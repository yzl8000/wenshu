import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../../common/middleware';
import { requireCredits } from '../wallet/creditCheck';
import * as plagiarismController from './plagiarism.controller';

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../../uploads/temp'),
  filename: (_req, file, cb) => {
    const id = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.docx', '.pdf', '.txt'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 .docx、.pdf、.txt 格式'));
    }
  },
});

const router = Router();

router.use(authenticate);

router.post('/checks', requireCredits('plagiarism'), upload.single('file'), plagiarismController.createCheck);
router.get('/checks', plagiarismController.listChecks);
router.get('/checks/:id', plagiarismController.getCheck);
router.delete('/checks/:id', plagiarismController.deleteCheck);

export default router;
