import { Request, Response } from 'express';
import { prisma } from '../../common/prisma';

export async function listTemplates(_req: Request, res: Response): Promise<void> {
  const templates = await prisma.resumeTemplate.findMany();
  res.json({ templates });
}

export async function listResumes(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: { template: { select: { id: true, name: true } }, _count: { select: { sections: true } } },
  });
  res.json({ resumes });
}

export async function createResume(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const { templateId, title } = req.body;
  const resume = await prisma.resume.create({
    data: { userId, templateId, title },
  });
  res.status(201).json({ resume });
}

export async function getResume(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const resume = await prisma.resume.findFirst({
    where: { id: req.params.id, userId },
    include: { template: true, sections: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!resume) { res.status(404).json({ error: '简历不存在' }); return; }
  res.json({ resume });
}

export async function updateResume(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const { title, templateId, status } = req.body;
  const resume = await prisma.resume.updateMany({
    where: { id: req.params.id, userId },
    data: { title, templateId, status },
  });
  if (resume.count === 0) { res.status(404).json({ error: '简历不存在' }); return; }
  res.json({ success: true });
}

export async function deleteResume(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const resume = await prisma.resume.deleteMany({ where: { id: req.params.id, userId } });
  if (resume.count === 0) { res.status(404).json({ error: '简历不存在' }); return; }
  res.json({ success: true });
}

export async function upsertSection(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const { resumeId, sectionId } = { resumeId: req.params.id, sectionId: req.params.sectionId };
  const { contentJson, sectionType, title, sortOrder } = req.body;

  // Verify resume ownership
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
  if (!resume) { res.status(404).json({ error: '简历不存在' }); return; }

  if (sectionId === 'new') {
    const section = await prisma.resumeSection.create({
      data: { resumeId, sectionType, title, contentJson: JSON.stringify(contentJson || {}), sortOrder: sortOrder || 0 },
    });
    res.status(201).json({ section });
  } else {
    const section = await prisma.resumeSection.updateMany({
      where: { id: sectionId, resumeId },
      data: { sectionType, title, contentJson: typeof contentJson === 'string' ? contentJson : JSON.stringify(contentJson || {}), sortOrder },
    });
    if (section.count === 0) { res.status(404).json({ error: '找不到该部分' }); return; }
    const updated = await prisma.resumeSection.findUnique({ where: { id: sectionId } });
    res.json({ section: updated });
  }
}

export async function deleteSection(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const resume = await prisma.resume.findFirst({ where: { id: req.params.id, userId } });
  if (!resume) { res.status(404).json({ error: '简历不存在' }); return; }

  await prisma.resumeSection.deleteMany({ where: { id: req.params.sectionId, resumeId: req.params.id } });
  res.json({ success: true });
}
