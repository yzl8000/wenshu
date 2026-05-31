import { Router } from 'express';
import { detectPlagiarism, calculateWordCount } from '../plagiarism/simhash.service';

const router = Router();

// POST /api/demo/plagiarism — anonymous demo, no auth required
router.post('/plagiarism', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length < 50) {
      res.status(400).json({ error: '请至少输入 50 个字符的文本' });
      return;
    }

    const trimmed = content.slice(0, 5000); // Limit for demo
    const wordCount = calculateWordCount(trimmed);

    // Run self-comparison
    const startTime = Date.now();
    const result = detectPlagiarism(trimmed, trimmed);
    const elapsed = Date.now() - startTime;

    res.json({
      wordCount,
      elapsed,
      overallSimilarity: Math.round(result.overallSimilarity * 10000) / 100, // percentage
      matchedWordCount: result.matchedWordCount,
      topMatches: result.matches.slice(0, 5).map((m) => ({
        sourceText: m.sourceText.slice(0, 120),
        targetText: m.targetText.slice(0, 120),
        similarity: Math.round(m.similarity * 100),
        positionStart: m.positionStart,
        positionEnd: m.positionEnd,
      })),
    });
  } catch {
    res.status(500).json({ error: '检测失败，请稍后再试' });
  }
});

export default router;
