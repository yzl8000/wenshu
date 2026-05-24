import { Router } from 'express';
import { authenticate } from '../../common/middleware';
import * as aiController from './ai.controller';

const router = Router();
router.use(authenticate);

// Plagiarism AI
router.post('/plagiarism/rewrite', aiController.rewriteText);
router.post('/plagiarism/summarize', aiController.summarizeText);

// Resume AI
router.post('/resume/generate', aiController.generateResumeSection);
router.post('/resume/improve', aiController.improveResumeContent);

// Novel AI
router.post('/novel/continue', aiController.novelContinue);
router.post('/novel/expand', aiController.novelExpand);
router.post('/novel/character', aiController.novelCharacter);
router.post('/novel/brainstorm', aiController.novelBrainstorm);

export default router;
