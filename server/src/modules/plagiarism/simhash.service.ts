/**
 * SimHash-based plagiarism detection pipeline.
 *
 * Stage 1: Text preprocessing (tokenize, normalize, remove stop words)
 * Stage 2: SimHash fingerprint generation (sliding window → n-gram → FNV-1a → 64-bit)
 * Stage 3: Candidate pair detection (Hamming distance ≤ 3, LSH-optimized)
 * Stage 4: Cosine similarity confirmation (TF-IDF → cosine ≥ threshold → LCS)
 * Stage 5: Result aggregation (merge adjacent matches, calculate per-source similarity)
 */

const WINDOW_SIZE = 200;
const WINDOW_STEP = 100;
const N_GRAM_SIZE = 3;
const HAMMING_THRESHOLD = 3;
const COSINE_THRESHOLD = 0.65;
const LSH_BANDS = 4;
const LSH_BAND_BITS = 16;

// ---- Text Preprocessing ----

const STOP_WORDS_CN = new Set([
  '的', '一', '是', '在', '不', '了', '有', '和', '人', '这', '中', '大', '为', '上', '个',
  '我', '他', '它', '她', '们', '那', '你', '到', '说', '也', '就', '要', '会', '可', '对',
  '去', '能', '下', '过', '同', '时', '后', '都', '与', '但', '从', '而', '被', '及', '其',
  '没', '所', '又', '看', '只', '把', '如', '想', '还', '之', '将', '或', '很', '最', '新',
  '已', '两', '让', '给', '更', '比', '别', '吧', '呀', '吗', '哦', '嗯', '么', '得', '着',
  '之', '以', '了', '则', '且', '与', '何', '但', '或', '若', '乃', '因', '虽', '于', '者',
]);

const STOP_WORDS_EN = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with',
  'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'and', 'but', 'or', 'not', 'no', 'nor',
  'so', 'if', 'then', 'than', 'that', 'this', 'these', 'those', 'it', 'its',
  'he', 'she', 'they', 'we', 'you', 'i', 'my', 'your', 'his', 'her', 'our',
  'very', 'too', 'just', 'also', 'now', 'here', 'there', 'when', 'where', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'only', 'own', 'same', 'about', 'up', 'out',
]);

function isCjk(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0xf900 && code <= 0xfaff)
  );
}

export function tokenize(text: string): string[] {
  // Detect whether the text is primarily CJK or Latin
  let cjkCount = 0;
  let latinCount = 0;
  for (const char of text.slice(0, 500)) {
    if (isCjk(char)) cjkCount++;
    else if (/[a-zA-Z]/.test(char)) latinCount++;
  }

  const isCjkText = cjkCount > latinCount;

  if (isCjkText) {
    return tokenizeCjk(text);
  }
  return tokenizeLatin(text);
}

function tokenizeCjk(text: string): string[] {
  const tokens: string[] = [];
  let buf = '';
  for (const char of text) {
    if (isCjk(char)) {
      if (buf.trim()) {
        tokens.push(...buf.trim().toLowerCase().split(/\s+/));
        buf = '';
      }
      if (!STOP_WORDS_CN.has(char)) {
        tokens.push(char);
      }
    } else if (/[a-zA-Z0-9]/.test(char)) {
      buf += char;
    } else {
      if (buf.trim()) {
        tokens.push(...buf.trim().toLowerCase().split(/\s+/));
        buf = '';
      }
    }
  }
  if (buf.trim()) {
    tokens.push(...buf.trim().toLowerCase().split(/\s+/));
  }
  return tokens;
}

function tokenizeLatin(text: string): string[] {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  return normalized
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS_EN.has(w));
}

// ---- SimHash Fingerprint ----

function fnv1a64(str: string): bigint {
  let hash = 14695981039346656037n;
  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i));
    hash = (hash * 1099511628211n) & 0xffffffffffffffffn;
  }
  return hash;
}

function computeSimHash(tokens: string[], n: number): bigint {
  const weights = new Array(64).fill(0);

  for (let i = 0; i <= tokens.length - n; i++) {
    const ngram = tokens.slice(i, i + n).join(' ');
    const hash = fnv1a64(ngram);
    for (let bit = 0; bit < 64; bit++) {
      if ((hash >> BigInt(bit)) & 1n) {
        weights[bit]++;
      } else {
        weights[bit]--;
      }
    }
  }

  let fingerprint = 0n;
  for (let bit = 0; bit < 64; bit++) {
    if (weights[bit] > 0) {
      fingerprint |= 1n << BigInt(bit);
    }
  }
  return fingerprint;
}

interface FingerprintEntry {
  fingerprint: bigint;
  startPos: number;
  endPos: number;
}

export function generateFingerprints(tokens: string[]): FingerprintEntry[] {
  const fingerprints: FingerprintEntry[] = [];
  for (let i = 0; i + WINDOW_SIZE <= tokens.length; i += WINDOW_STEP) {
    const window = tokens.slice(i, i + WINDOW_SIZE);
    const fingerprint = computeSimHash(window, N_GRAM_SIZE);
    fingerprints.push({ fingerprint, startPos: i, endPos: i + WINDOW_SIZE });
  }
  return fingerprints;
}

// ---- Hamming Distance & LSH ----

function hammingDistance(a: bigint, b: bigint): number {
  let diff = a ^ b;
  let count = 0;
  while (diff > 0n) {
    count += Number(diff & 1n);
    diff >>= 1n;
  }
  return count;
}

function getLSHBandValue(fp: bigint, band: number): number {
  // Split 64-bit into LSH_BANDS bands of LSH_BAND_BITS each
  const shift = BigInt(band * LSH_BAND_BITS);
  const mask = (1n << BigInt(LSH_BAND_BITS)) - 1n;
  return Number((fp >> shift) & mask);
}

interface CandidatePair {
  idxA: number;
  idxB: number;
}

export function findCandidatePairs(fingerprints: FingerprintEntry[]): CandidatePair[] {
  const n = fingerprints.length;

  if (n <= 1) return [];

  // For small documents, use direct O(n^2) comparison
  if (n < 50) {
    const pairs: CandidatePair[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (hammingDistance(fingerprints[i].fingerprint, fingerprints[j].fingerprint) <= HAMMING_THRESHOLD) {
          pairs.push({ idxA: i, idxB: j });
        }
      }
    }
    return pairs;
  }

  // LSH optimization for larger documents
  const buckets = new Map<string, number[]>();
  for (let i = 0; i < n; i++) {
    for (let band = 0; band < LSH_BANDS; band++) {
      const bandVal = getLSHBandValue(fingerprints[i].fingerprint, band);
      const key = `${band}:${bandVal}`;
      const bucket = buckets.get(key) || [];
      bucket.push(i);
      buckets.set(key, bucket);
    }
  }

  const candidateSet = new Set<string>();
  for (const [, bucket] of buckets) {
    if (bucket.length > 1 && bucket.length < 100) {
      for (let i = 0; i < bucket.length; i++) {
        for (let j = i + 1; j < bucket.length; j++) {
          const a = bucket[i];
          const b = bucket[j];
          const key = a < b ? `${a}-${b}` : `${b}-${a}`;
          candidateSet.add(key);
        }
      }
    }
  }

  const pairs: CandidatePair[] = [];
  for (const key of candidateSet) {
    const [a, b] = key.split('-').map(Number);
    if (hammingDistance(fingerprints[a].fingerprint, fingerprints[b].fingerprint) <= HAMMING_THRESHOLD) {
      pairs.push({ idxA: a, idxB: b });
    }
  }

  return pairs;
}

// ---- TF-IDF & Cosine Similarity ----

function computeTermFrequencies(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  return tf;
}

function cosineSimilarity(tokensA: string[], tokensB: string[]): number {
  const tfA = computeTermFrequencies(tokensA);
  const tfB = computeTermFrequencies(tokensB);

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const [term, countA] of tfA) {
    const countB = tfB.get(term) || 0;
    dotProduct += countA * countB;
    magA += countA * countA;
  }

  for (const [, countB] of tfB) {
    magB += countB * countB;
  }

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ---- Longest Common Subsequence (for exact match positioning) ----

function longestCommonSubstring(a: string, b: string): { text: string; posA: number; posB: number; length: number } {
  const m = a.length;
  const n = b.length;
  let maxLen = 0;
  let endA = 0;
  let endB = 0;

  // Use rolling array for memory efficiency
  const dp = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    let prevDiag = 0;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prevDiag + 1;
        if (dp[j] > maxLen) {
          maxLen = dp[j];
          endA = i;
          endB = j;
        }
      } else {
        dp[j] = 0;
      }
      prevDiag = temp;
    }
  }

  return {
    text: a.slice(endA - maxLen, endA),
    posA: endA - maxLen,
    posB: endB - maxLen,
    length: maxLen,
  };
}

// ---- Main Detection Pipeline ----

export interface MatchResult {
  sourceText: string;
  targetText: string;
  similarity: number;
  positionStart: number;
  positionEnd: number;
}

export interface DetectionResult {
  overallSimilarity: number;
  matchedWordCount: number;
  totalWordCount: number;
  matches: MatchResult[];
}

export function detectPlagiarism(sourceText: string, targetText: string): DetectionResult {
  const sourceTokens = tokenize(sourceText);
  const targetTokens = tokenize(targetText);

  if (sourceTokens.length === 0 || targetTokens.length === 0) {
    return {
      overallSimilarity: 0,
      matchedWordCount: 0,
      totalWordCount: targetTokens.length,
      matches: [],
    };
  }

  // Generate fingerprints for both texts
  const sourceFps = generateFingerprints(sourceTokens);
  const targetFps = generateFingerprints(targetTokens);

  // Find candidates within target (self-comparison)
  const selfPairs = findCandidatePairs(targetFps);

  // Also compare source vs target: for each source fingerprint, check against all target fingerprints
  const crossMatches: CandidatePair[] = [];
  for (let i = 0; i < sourceFps.length; i++) {
    for (let j = 0; j < targetFps.length; j++) {
      if (hammingDistance(sourceFps[i].fingerprint, targetFps[j].fingerprint) <= HAMMING_THRESHOLD) {
        crossMatches.push({ idxA: i, idxB: j });
      }
    }
  }

  const allMatches: MatchResult[] = [];
  let totalMatchedChars = 0;

  // Process cross-matches (source vs target)
  for (const pair of crossMatches) {
    const srcFp = sourceFps[pair.idxA];
    const tgtFp = targetFps[pair.idxB];

    const srcTokensSlice = sourceTokens.slice(srcFp.startPos, srcFp.endPos);
    const tgtTokensSlice = targetTokens.slice(tgtFp.startPos, tgtFp.endPos);

    const cosine = cosineSimilarity(srcTokensSlice, tgtTokensSlice);
    if (cosine >= COSINE_THRESHOLD) {
      const srcText = sourceTokens.slice(srcFp.startPos, srcFp.endPos).join('');
      const tgtText = targetTokens.slice(tgtFp.startPos, tgtFp.endPos).join('');
      const lcs = longestCommonSubstring(tgtText, srcText);

      if (lcs.length >= 20) {
        allMatches.push({
          sourceText: lcs.text,
          targetText: lcs.text,
          similarity: cosine,
          positionStart: tgtFp.startPos,
          positionEnd: tgtFp.endPos,
        });
        totalMatchedChars += lcs.length;
      }
    }
  }

  // Merge adjacent/overlapping matches
  const mergedMatches = mergeMatches(allMatches);
  const totalChars = targetText.replace(/\s/g, '').length;

  return {
    overallSimilarity: totalChars > 0 ? totalMatchedChars / totalChars : 0,
    matchedWordCount: totalMatchedChars,
    totalWordCount: targetTokens.length,
    matches: mergedMatches,
  };
}

function mergeMatches(matches: MatchResult[]): MatchResult[] {
  if (matches.length === 0) return [];

  const sorted = [...matches].sort((a, b) => a.positionStart - b.positionStart);
  const merged: MatchResult[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const curr = sorted[i];

    if (curr.positionStart <= last.positionEnd + 50) {
      // Merge overlapping or very close matches
      last.positionEnd = Math.max(last.positionEnd, curr.positionEnd);
      last.targetText = last.targetText + curr.targetText.slice(
        Math.max(0, last.positionEnd - curr.positionStart)
      );
      last.similarity = Math.max(last.similarity, curr.similarity);
    } else {
      merged.push(curr);
    }
  }

  return merged;
}

export function calculateWordCount(text: string): number {
  const tokens = tokenize(text);
  return tokens.length;
}
