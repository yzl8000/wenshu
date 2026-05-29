import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import multer from 'multer';
import authRoutes from './modules/auth/auth.routes';
import referralRoutes from './modules/auth/referral.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import walletAdminRoutes from './modules/wallet/wallet.admin.routes';
import plagiarismRoutes from './modules/plagiarism/plagiarism.routes';
import resumeRoutes from './modules/resume/resume.routes';
import novelRoutes from './modules/novel/novel.routes';
import aiRoutes from './modules/ai/ai.routes';
import { errorHandler } from './common/middleware';

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', walletAdminRoutes);
app.use('/api/plagiarism', plagiarismRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/novels', novelRoutes);
app.use('/api/ai', aiRoutes);

// File upload — store as base64 data URL so it survives redeploy
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('只允许上传图片'));
  },
});

// Image upload endpoint — returns base64 data URL
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) { res.status(400).json({ error: '请选择图片' }); return; }
  const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  res.json({ url: dataUrl });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Production: serve frontend static files
if (isProduction) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

export default app;
