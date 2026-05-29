import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import authRoutes from './modules/auth/auth.routes';
import referralRoutes from './modules/auth/referral.routes';
import walletRoutes from './modules/wallet/wallet.routes';
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
app.use('/api/plagiarism', plagiarismRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/novels', novelRoutes);
app.use('/api/ai', aiRoutes);

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
