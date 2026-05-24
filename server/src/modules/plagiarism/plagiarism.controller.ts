import { Request, Response } from 'express';
import { prisma } from '../../common/prisma';
import { tokenize, detectPlagiarism, calculateWordCount } from './simhash.service';
import { extractText, validateFile } from './fileParser.service';
import fs from 'fs';

export async function createCheck(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  let content = '';
  let sourceType = 'text_input';
  let fileName: string | undefined;
  let fileSize: number | undefined;

  if (req.file) {
    // File upload
    const validationError = validateFile(req.file.originalname, req.file.size);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }
    try {
      content = await extractText(req.file.path, req.file.originalname);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '文件解析失败';
      res.status(400).json({ error: message });
      // Clean up temp file
      fs.unlink(req.file.path, () => {});
      return;
    }
    sourceType = 'file_upload';
    fileName = req.file.originalname;
    fileSize = req.file.size;

    // Clean up temp file after extraction
    fs.unlink(req.file.path, () => {});
  } else if (req.body.content) {
    content = req.body.content;
  } else {
    res.status(400).json({ error: '请提供文本内容或上传文件' });
    return;
  }

  if (content.trim().length < 50) {
    res.status(400).json({ error: '文本内容过短，至少需要50个字符' });
    return;
  }

  const title = req.body.title || fileName || '未命名检测';
  const wordCount = calculateWordCount(content);

  // Create the check record
  const check = await prisma.plagiarismCheck.create({
    data: {
      userId,
      title,
      content,
      sourceType,
      fileName,
      fileSize,
      status: 'processing',
    },
  });

  // Process asynchronously (in production, use a job queue)
  setImmediate(async () => {
    try {
      // Self-comparison (find internal duplicates within the document)
      const selfResult = detectPlagiarism(content, content);

      await prisma.plagiarismResult.create({
        data: {
          checkId: check.id,
          sourceLabel: '文档内部重复检测',
          sourceType: 'self',
          overallSimilarity: Math.min(selfResult.overallSimilarity, 1),
          matchedWordCount: selfResult.matchedWordCount,
          totalWordCount: wordCount,
          matches: {
            create: selfResult.matches.slice(0, 20).map((m) => ({
              sourceText: m.sourceText,
              targetText: m.targetText,
              similarity: m.similarity,
              positionStart: m.positionStart,
              positionEnd: m.positionEnd,
            })),
          },
        },
      });

      // Attempt web search cross-referencing (non-blocking, may fail gracefully)
      try {
        const webResults = await performWebSearch(content);
        for (const webResult of webResults) {
          await prisma.plagiarismResult.create({
            data: {
              checkId: check.id,
              sourceLabel: webResult.url,
              sourceType: 'web',
              overallSimilarity: webResult.similarity,
              matchedWordCount: webResult.matchedWords,
              totalWordCount: wordCount,
              matches: {
                create: webResult.matches.slice(0, 10).map((m) => ({
                  sourceText: m.sourceText,
                  targetText: m.targetText,
                  similarity: m.similarity,
                  positionStart: m.positionStart,
                  positionEnd: m.positionEnd,
                })),
              },
            },
          });
        }
      } catch {
        // Web search is optional; don't fail the whole check
        console.log('Web search unavailable, skipping cross-reference');
      }

      await prisma.plagiarismCheck.update({
        where: { id: check.id },
        data: { status: 'completed' },
      });
    } catch (err) {
      console.error('Plagiarism check failed:', err);
      await prisma.plagiarismCheck.update({
        where: { id: check.id },
        data: { status: 'failed' },
      });
    }
  });

  res.status(201).json({ id: check.id, status: 'processing' });
}

export async function listChecks(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [checks, total] = await Promise.all([
    prisma.plagiarismCheck.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        sourceType: true,
        fileName: true,
        status: true,
        createdAt: true,
        _count: { select: { results: true } },
      },
    }),
    prisma.plagiarismCheck.count({ where: { userId } }),
  ]);

  res.json({ checks, total, page, limit });
}

export async function getCheck(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const check = await prisma.plagiarismCheck.findFirst({
    where: { id: req.params.id, userId },
    include: {
      results: {
        include: { matches: true },
      },
    },
  });

  if (!check) {
    res.status(404).json({ error: '检测记录不存在' });
    return;
  }

  res.json({ check });
}

export async function deleteCheck(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const check = await prisma.plagiarismCheck.findFirst({
    where: { id: req.params.id, userId },
  });

  if (!check) {
    res.status(404).json({ error: '检测记录不存在' });
    return;
  }

  await prisma.plagiarismCheck.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

// ---- Web Search Integration ----

interface WebMatch {
  sourceText: string;
  targetText: string;
  similarity: number;
  positionStart: number;
  positionEnd: number;
}

interface WebSearchResult {
  url: string;
  similarity: number;
  matchedWords: number;
  matches: WebMatch[];
}

async function performWebSearch(content: string): Promise<WebSearchResult[]> {
  // Extract key sentences for search queries
  const sentences = content.split(/[。！？.!?\n]+/).filter((s) => s.trim().length > 20);
  const results: WebSearchResult[] = [];

  // Take up to 3 most distinctive sentences
  const queries = sentences.slice(0, 3);

  for (const query of queries) {
    const trimmedQuery = query.trim().slice(0, 100);
    try {
      // Use a free search API (DuckDuckGo, no API key required)
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(trimmedQuery)}&format=json&no_html=1`;
      const response = await fetch(searchUrl);
      const data = await response.json() as {
        AbstractText?: string;
        AbstractURL?: string;
        RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
      };

      const sourceTexts: { text: string; url: string }[] = [];

      if (data.AbstractText) {
        sourceTexts.push({ text: data.AbstractText, url: data.AbstractURL || 'https://duckduckgo.com' });
      }

      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics.slice(0, 3)) {
          if (topic.Text) {
            sourceTexts.push({ text: topic.Text, url: topic.FirstURL || 'https://duckduckgo.com' });
          }
        }
      }

      for (const source of sourceTexts) {
        if (source.text.length < 50) continue;
        const detection = detectPlagiarism(source.text, trimmedQuery);
        if (detection.overallSimilarity > 0.3) {
          results.push({
            url: source.url,
            similarity: detection.overallSimilarity,
            matchedWords: detection.matchedWordCount,
            matches: detection.matches.map((m) => ({
              sourceText: m.sourceText,
              targetText: m.targetText,
              similarity: m.similarity,
              positionStart: m.positionStart,
              positionEnd: m.positionEnd,
            })),
          });
        }
      }
    } catch {
      // Skip failed queries
      continue;
    }
  }

  return results;
}
