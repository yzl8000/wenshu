import { Request, Response } from 'express';
import { prisma } from '../../common/prisma';

// ---- Novels ----

export async function listNovels(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novels = await prisma.novel.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { chapters: true, characters: true } },
      chapters: { select: { wordCount: true } },
    },
  });

  const result = novels.map((novel: { chapters: { wordCount: number }[]; _count: Record<string, number> }) => ({
    ...novel,
    totalWords: novel.chapters.reduce((sum: number, ch: { wordCount: number }) => sum + ch.wordCount, 0),
    _count: novel._count,
    chapters: undefined,
  }));

  res.json({ novels: result });
}

export async function createNovel(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const { title, description, genre, targetWords } = req.body;
  const novel = await prisma.novel.create({
    data: { userId, title, description, genre, targetWords },
  });
  res.status(201).json({ novel });
}

export async function getNovel(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.id, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  const totalWords = await prisma.chapter.aggregate({
    where: { novelId: novel.id },
    _sum: { wordCount: true },
  });

  const chapterCount = await prisma.chapter.count({ where: { novelId: novel.id } });
  const charCount = await prisma.character.count({ where: { novelId: novel.id } });

  res.json({ novel: { ...novel, totalWords: totalWords._sum.wordCount || 0, chapterCount, charCount } });
}

export async function updateNovel(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const { title, description, genre, targetWords, status, coverImage } = req.body;
  const novel = await prisma.novel.updateMany({
    where: { id: req.params.id, userId },
    data: { title, description, genre, targetWords, status, coverImage },
  });
  if (novel.count === 0) { res.status(404).json({ error: '小说不存在' }); return; }
  res.json({ success: true });
}

export async function deleteNovel(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.deleteMany({ where: { id: req.params.id, userId } });
  if (novel.count === 0) { res.status(404).json({ error: '小说不存在' }); return; }
  res.json({ success: true });
}

// ---- Chapters ----

export async function listChapters(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  const chapters = await prisma.chapter.findMany({
    where: { novelId: req.params.novelId },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true, title: true, wordCount: true, status: true, sortOrder: true,
      parentId: true, createdAt: true, updatedAt: true,
    },
  });
  res.json({ chapters });
}

export async function createChapter(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  const { title, parentId } = req.body;
  const maxOrder = await prisma.chapter.aggregate({
    where: { novelId: req.params.novelId },
    _max: { sortOrder: true },
  });

  const chapter = await prisma.chapter.create({
    data: {
      novelId: req.params.novelId,
      title: title || '新章节',
      parentId: parentId || null,
      sortOrder: (maxOrder._max.sortOrder || 0) + 1,
    },
  });
  res.status(201).json({ chapter });
}

export async function getChapter(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  const chapter = await prisma.chapter.findFirst({
    where: { id: req.params.chapterId, novelId: req.params.novelId },
  });
  if (!chapter) { res.status(404).json({ error: '章节不存在' }); return; }
  res.json({ chapter });
}

export async function updateChapter(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  const { title, contentJson, plainText, wordCount, status } = req.body;

  // Record writing session if wordCount increased
  if (wordCount !== undefined) {
    const existing = await prisma.chapter.findFirst({ where: { id: req.params.chapterId } });
    if (existing && wordCount > existing.wordCount) {
      const addedWords = wordCount - existing.wordCount;
      await prisma.writingSession.create({
        data: {
          userId, novelId: req.params.novelId,
          chapterId: req.params.chapterId,
          wordCount: addedWords, startedAt: new Date(), endedAt: new Date(),
        },
      });
    }
  }

  const chapter = await prisma.chapter.updateMany({
    where: { id: req.params.chapterId, novelId: req.params.novelId },
    data: {
      title, plainText, wordCount, status,
      contentJson: contentJson ? (typeof contentJson === 'string' ? contentJson : JSON.stringify(contentJson)) : undefined,
    },
  });
  if (chapter.count === 0) { res.status(404).json({ error: '章节不存在' }); return; }

  // Update novel status to "writing" if it was "planning"
  await prisma.novel.updateMany({
    where: { id: req.params.novelId, status: 'planning' },
    data: { status: 'writing' },
  });

  res.json({ success: true });
}

export async function deleteChapter(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  await prisma.chapter.deleteMany({ where: { id: req.params.chapterId, novelId: req.params.novelId } });
  res.json({ success: true });
}

export async function reorderChapters(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  const { orderedIds } = req.body as { orderedIds: string[] };

  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.chapter.updateMany({
      where: { id: orderedIds[i], novelId: req.params.novelId },
      data: { sortOrder: i },
    });
  }

  res.json({ success: true });
}

// ---- Characters ----

export async function listCharacters(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  const characters = await prisma.character.findMany({
    where: { novelId: req.params.novelId },
  });
  res.json({ characters });
}

export async function createCharacter(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  const { name, role, description, attributes, color } = req.body;
  const character = await prisma.character.create({
    data: { novelId: req.params.novelId, name, role, description, attributes: attributes ? (typeof attributes === 'string' ? attributes : JSON.stringify(attributes)) : null, color },
  });
  res.status(201).json({ character });
}

export async function updateCharacter(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  const { name, role, description, attributes, color } = req.body;
  const character = await prisma.character.updateMany({
    where: { id: req.params.charId, novelId: req.params.novelId },
    data: { name, role, description, attributes: attributes ? (typeof attributes === 'string' ? attributes : JSON.stringify(attributes)) : null, color },
  });
  if (character.count === 0) { res.status(404).json({ error: '角色不存在' }); return; }
  res.json({ success: true });
}

export async function deleteCharacter(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  await prisma.character.deleteMany({ where: { id: req.params.charId, novelId: req.params.novelId } });
  res.json({ success: true });
}

// ---- Relationships ----

export async function listRelationships(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  const characters = await prisma.character.findMany({
    where: { novelId: req.params.novelId },
    select: { id: true, name: true, role: true, color: true },
  });
  const relationships = await prisma.relationship.findMany({
    where: { novelId: req.params.novelId },
    include: {
      sourceCharacter: { select: { id: true, name: true } },
      targetCharacter: { select: { id: true, name: true } },
    },
  });

  const nodes = characters.map((ch: { id: string; name: string; role: string | null; color: string | null }) => ({
    id: ch.id, name: ch.name, role: ch.role, color: ch.color,
  }));
  const links = relationships.map((rel: { sourceCharacterId: string; targetCharacterId: string; relationshipType: string; label: string | null }) => ({
    source: rel.sourceCharacterId,
    target: rel.targetCharacterId,
    relationshipType: rel.relationshipType,
    label: rel.label,
  }));

  res.json({ nodes, links, relationships });
}

export async function createRelationship(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  const { sourceCharacterId, targetCharacterId, relationshipType, label, description } = req.body;
  const relationship = await prisma.relationship.create({
    data: { novelId: req.params.novelId, sourceCharacterId, targetCharacterId, relationshipType, label, description },
  });
  res.status(201).json({ relationship });
}

export async function deleteRelationship(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  await prisma.relationship.deleteMany({ where: { id: req.params.relId, novelId: req.params.novelId } });
  res.json({ success: true });
}

// ---- Outlines ----

export async function listOutlines(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  const outlines = await prisma.outline.findMany({
    where: { novelId: req.params.novelId },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ outlines });
}

export async function createOutline(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  const { title, parentId, description, noteContent, linkedChapterId, color } = req.body;
  const maxOrder = await prisma.outline.aggregate({
    where: { novelId: req.params.novelId },
    _max: { sortOrder: true },
  });

  const outline = await prisma.outline.create({
    data: {
      novelId: req.params.novelId, title, parentId, description, noteContent,
      linkedChapterId, color, sortOrder: (maxOrder._max.sortOrder || 0) + 1,
    },
  });
  res.status(201).json({ outline });
}

export async function updateOutline(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  const { title, parentId, description, noteContent, linkedChapterId, color, sortOrder } = req.body;
  const outline = await prisma.outline.updateMany({
    where: { id: req.params.outlineId, novelId: req.params.novelId },
    data: { title, parentId, description, noteContent, linkedChapterId, color, sortOrder },
  });
  if (outline.count === 0) { res.status(404).json({ error: '大纲节点不存在' }); return; }
  res.json({ success: true });
}

export async function deleteOutline(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  // Delete children first
  await prisma.outline.deleteMany({ where: { parentId: req.params.outlineId } });
  await prisma.outline.deleteMany({ where: { id: req.params.outlineId, novelId: req.params.novelId } });
  res.json({ success: true });
}

// ---- Statistics ----

export async function getStatistics(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const novel = await prisma.novel.findFirst({ where: { id: req.params.novelId, userId } });
  if (!novel) { res.status(404).json({ error: '小说不存在' }); return; }

  const totalWords = await prisma.chapter.aggregate({
    where: { novelId: req.params.novelId },
    _sum: { wordCount: true },
  });

  const chapterCount = await prisma.chapter.count({ where: { novelId: req.params.novelId } });
  const characterCount = await prisma.character.count({ where: { novelId: req.params.novelId } });

  // Daily progress (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sessions = await prisma.writingSession.findMany({
    where: {
      novelId: req.params.novelId,
      startedAt: { gte: thirtyDaysAgo },
    },
    select: { wordCount: true, startedAt: true },
    orderBy: { startedAt: 'asc' },
  });

  // Group by date
  const dailyMap = new Map<string, number>();
  for (const s of sessions) {
    const date = s.startedAt.toISOString().split('T')[0];
    dailyMap.set(date, (dailyMap.get(date) || 0) + s.wordCount);
  }

  const dailyProgress = Array.from(dailyMap.entries()).map(([date, wordCount]) => ({ date, wordCount }));

  // Writing streak
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (dailyMap.has(dateStr)) {
      streak++;
      if (streak > longestStreak) longestStreak = streak;
    } else {
      if (dateStr === today) continue; // don't break streak if today hasn't been written yet
      streak = 0;
    }
  }
  currentStreak = streak;

  res.json({
    totalWords: totalWords._sum.wordCount || 0,
    chapterCount,
    characterCount,
    dailyProgress,
    writingStreak: { currentStreak, longestStreak },
  });
}

// ---- Goals ----

export async function listGoals(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const goals = await prisma.writingGoal.findMany({
    where: { userId, novelId: req.params.novelId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ goals });
}

export async function createGoal(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const { dailyWordTarget, startDate, endDate } = req.body;
  const goal = await prisma.writingGoal.create({
    data: {
      userId, novelId: req.params.novelId,
      dailyWordTarget, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null,
    },
  });
  res.status(201).json({ goal });
}

export async function updateGoal(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const { dailyWordTarget, startDate, endDate, isActive } = req.body;
  const goal = await prisma.writingGoal.updateMany({
    where: { id: req.params.goalId, userId },
    data: { dailyWordTarget, startDate: startDate ? new Date(startDate) : undefined, endDate: endDate ? new Date(endDate) : undefined, isActive },
  });
  if (goal.count === 0) { res.status(404).json({ error: '目标不存在' }); return; }
  res.json({ success: true });
}

export async function deleteGoal(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const goal = await prisma.writingGoal.deleteMany({ where: { id: req.params.goalId, userId } });
  if (goal.count === 0) { res.status(404).json({ error: '目标不存在' }); return; }
  res.json({ success: true });
}
