import { Router } from 'express';
import { authenticate } from '../../common/middleware';
import * as resumeController from './resume.controller';

const router = Router();
router.use(authenticate);

router.get('/templates', resumeController.listTemplates);
router.get('/', resumeController.listResumes);
router.post('/', resumeController.createResume);
router.get('/:id', resumeController.getResume);
router.put('/:id', resumeController.updateResume);
router.delete('/:id', resumeController.deleteResume);
router.put('/:id/sections/:sectionId', resumeController.upsertSection);
router.delete('/:id/sections/:sectionId', resumeController.deleteSection);

export default router;
