import { Router } from 'express';
import { authenticate } from '../../common/middleware';
import { getReferralStats } from './auth.service';

const router = Router();

router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await getReferralStats(req.userId!);
    if (!stats) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: '获取推荐数据失败' });
  }
});

export default router;
