import { Router } from 'express';
import { authenticate } from '../../common/middleware';
import * as novelController from './novel.controller';

const router = Router();
router.use(authenticate);

// Novels
router.get('/', novelController.listNovels);
router.post('/', novelController.createNovel);
router.get('/:id', novelController.getNovel);
router.put('/:id', novelController.updateNovel);
router.delete('/:id', novelController.deleteNovel);

// Chapters
router.get('/:novelId/chapters', novelController.listChapters);
router.post('/:novelId/chapters', novelController.createChapter);
router.get('/:novelId/chapters/:chapterId', novelController.getChapter);
router.put('/:novelId/chapters/:chapterId', novelController.updateChapter);
router.delete('/:novelId/chapters/:chapterId', novelController.deleteChapter);
router.put('/:novelId/chapters-reorder', novelController.reorderChapters);

// Characters
router.get('/:novelId/characters', novelController.listCharacters);
router.post('/:novelId/characters', novelController.createCharacter);
router.put('/:novelId/characters/:charId', novelController.updateCharacter);
router.delete('/:novelId/characters/:charId', novelController.deleteCharacter);

// Relationships
router.get('/:novelId/relationships', novelController.listRelationships);
router.post('/:novelId/relationships', novelController.createRelationship);
router.delete('/:novelId/relationships/:relId', novelController.deleteRelationship);

// Outlines
router.get('/:novelId/outlines', novelController.listOutlines);
router.post('/:novelId/outlines', novelController.createOutline);
router.put('/:novelId/outlines/:outlineId', novelController.updateOutline);
router.delete('/:novelId/outlines/:outlineId', novelController.deleteOutline);

// Statistics
router.get('/:novelId/statistics', novelController.getStatistics);

// Goals
router.get('/:novelId/goals', novelController.listGoals);
router.post('/:novelId/goals', novelController.createGoal);
router.put('/:novelId/goals/:goalId', novelController.updateGoal);
router.delete('/:novelId/goals/:goalId', novelController.deleteGoal);

export default router;
