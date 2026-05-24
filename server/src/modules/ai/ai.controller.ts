import { Request, Response } from 'express';
import * as aiService from './ai.service';

export async function rewriteText(req: Request, res: Response): Promise<void> {
  const { text } = req.body;
  if (!text) { res.status(400).json({ error: '请提供要改写的文本' }); return; }

  try {
    const result = await aiService.chat(aiService.rewritePrompt(text));
    res.json({ result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI 服务调用失败';
    res.status(500).json({ error: msg });
  }
}

export async function summarizeText(req: Request, res: Response): Promise<void> {
  const { text } = req.body;
  if (!text) { res.status(400).json({ error: '请提供要摘要的文本' }); return; }

  try {
    const result = await aiService.chat(aiService.summarizePrompt(text));
    res.json({ result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI 服务调用失败';
    res.status(500).json({ error: msg });
  }
}

export async function generateResumeSection(req: Request, res: Response): Promise<void> {
  const { sectionType, context } = req.body;
  if (!sectionType) { res.status(400).json({ error: '请指定板块类型' }); return; }

  try {
    const result = await aiService.chat(aiService.resumeSectionPrompt(sectionType, context || {}));
    res.json({ result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI 服务调用失败';
    res.status(500).json({ error: msg });
  }
}

export async function improveResumeContent(req: Request, res: Response): Promise<void> {
  const { content, sectionType } = req.body;
  if (!content) { res.status(400).json({ error: '请提供要优化的内容' }); return; }

  try {
    const messages = [
      { role: 'system' as const, content: `你是一个专业的简历优化顾问。请优化以下${sectionType || ''}板块的内容，使其更加专业、有影响力。用数据说话，用动词开头。只输出优化后的内容。` },
      { role: 'user' as const, content: `优化以下内容：\n\n${content}` },
    ];
    const result = await aiService.chat(messages);
    res.json({ result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI 服务调用失败';
    res.status(500).json({ error: msg });
  }
}

export async function novelContinue(req: Request, res: Response): Promise<void> {
  const { context, style } = req.body;
  if (!context) { res.status(400).json({ error: '请提供上文内容' }); return; }

  try {
    const result = await aiService.chat(aiService.novelContinuePrompt(context, style || '流畅自然'));
    res.json({ result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI 服务调用失败';
    res.status(500).json({ error: msg });
  }
}

export async function novelExpand(req: Request, res: Response): Promise<void> {
  const { scene, direction } = req.body;
  if (!scene) { res.status(400).json({ error: '请提供场景内容' }); return; }

  try {
    const result = await aiService.chat(aiService.novelExpandPrompt(scene, direction || '增加细节描写'));
    res.json({ result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI 服务调用失败';
    res.status(500).json({ error: msg });
  }
}

export async function novelCharacter(req: Request, res: Response): Promise<void> {
  const { novelInfo } = req.body;

  try {
    const result = await aiService.chat(aiService.novelCharacterPrompt(novelInfo || ''));
    res.json({ result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI 服务调用失败';
    res.status(500).json({ error: msg });
  }
}

export async function novelBrainstorm(req: Request, res: Response): Promise<void> {
  const { novelInfo, type } = req.body;

  try {
    const result = await aiService.chat(aiService.novelBrainstormPrompt(novelInfo || '', type || '情节发展'));
    res.json({ result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI 服务调用失败';
    res.status(500).json({ error: msg });
  }
}
