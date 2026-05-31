import { Router } from 'express';
import { authenticate } from '../../common/middleware';
import { requireCredits } from '../wallet/creditCheck';
import * as aiController from './ai.controller';

const router = Router();
router.use(authenticate);

// Plagiarism AI — costs credits
router.post('/plagiarism/rewrite', requireCredits('ai_rewrite'), aiController.rewriteText);
router.post('/plagiarism/summarize', requireCredits('ai_summarize'), aiController.summarizeText);

// Resume AI — costs credits
router.post('/resume/generate', requireCredits('ai_rewrite'), aiController.generateResumeSection);
router.post('/resume/improve', requireCredits('ai_rewrite'), aiController.improveResumeContent);

// Novel AI — costs credits
router.post('/novel/continue', requireCredits('ai_continue'), aiController.novelContinue);
router.post('/novel/expand', requireCredits('ai_expand'), aiController.novelExpand);
router.post('/novel/character', requireCredits('ai_rewrite'), aiController.novelCharacter);
router.post('/novel/brainstorm', requireCredits('ai_brainstorm'), aiController.novelBrainstorm);

export default router;
