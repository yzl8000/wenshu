import { Router } from 'express';
import { authenticate } from '../../common/middleware';
import { prisma } from '../../common/prisma';

const router = Router();

// Admin guard: check if user is admin
async function adminGuard(req: any, res: any, next: any) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.email !== 'admin@wenshu.com') {
      res.status(403).json({ error: '无管理员权限' });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: '鉴权失败' });
  }
}

// Get admin stats (revenue, pending payments, pending withdrawals)
router.get('/stats', authenticate, adminGuard, async (_req, res) => {
  try {
    const totalRevenue = await prisma.transaction.aggregate({
      where: { type: 'recharge', status: 'completed' },
      _sum: { amount: true },
    });
    const pendingPayments = await prisma.transaction.count({
      where: { type: 'recharge', status: 'pending' },
    });
    const pendingWithdrawals = await prisma.transaction.count({
      where: { type: 'withdrawal', status: 'pending' },
    });
    const totalWithdrawn = await prisma.transaction.aggregate({
      where: { type: 'withdrawal', status: 'completed' },
      _sum: { amount: true },
    });

    res.json({
      revenue: totalRevenue._sum.amount || 0,
      pendingPayments,
      pendingWithdrawals,
      totalWithdrawn: Math.abs(totalWithdrawn._sum.amount || 0),
    });
  } catch { res.status(500).json({ error: '获取统计数据失败' }); }
});

// Get pending recharge payments
router.get('/payments', authenticate, adminGuard, async (_req, res) => {
  try {
    const payments = await prisma.transaction.findMany({
      where: { type: 'recharge', status: 'pending' },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch { res.status(500).json({ error: '获取充值记录失败' }); }
});

// Approve payment (credit user)
router.post('/payments/:id/approve', authenticate, adminGuard, async (req, res) => {
  try {
    const tx = await prisma.transaction.findUnique({ where: { id: req.params.id } });
    if (!tx || tx.type !== 'recharge' || tx.status !== 'pending') {
      res.status(400).json({ error: '交易不存在或状态不正确' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: tx.userId } });
    if (!user) { res.status(404).json({ error: '用户不存在' }); return; }

    const newBalance = user.balance + tx.amount;

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: 'completed', balance: newBalance, description: (tx.description || '') + ' [已确认]' },
    });
    await prisma.user.update({ where: { id: user.id }, data: { balance: newBalance } });

    res.json({ success: true });
  } catch { res.status(500).json({ error: '审核失败' }); }
});

// Reject payment
router.post('/payments/:id/reject', authenticate, adminGuard, async (req, res) => {
  try {
    const tx = await prisma.transaction.findUnique({ where: { id: req.params.id } });
    if (!tx || tx.status !== 'pending') {
      res.status(400).json({ error: '交易不存在或状态不正确' });
      return;
    }

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: 'rejected', description: (tx.description || '') + ' [已拒绝]' },
    });

    res.json({ success: true });
  } catch { res.status(500).json({ error: '操作失败' }); }
});

// Get pending withdrawals
router.get('/withdrawals', authenticate, adminGuard, async (_req, res) => {
  try {
    const withdrawals = await prisma.transaction.findMany({
      where: { type: 'withdrawal', status: 'pending' },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(withdrawals);
  } catch { res.status(500).json({ error: '获取提现记录失败' }); }
});

// Approve withdrawal
router.post('/withdrawals/:id/approve', authenticate, adminGuard, async (req, res) => {
  try {
    const tx = await prisma.transaction.findUnique({ where: { id: req.params.id } });
    if (!tx || tx.type !== 'withdrawal' || tx.status !== 'pending') {
      res.status(400).json({ error: '交易不存在或状态不正确' });
      return;
    }

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: 'completed', description: (tx.description || '') + ' [已打款]' },
    });

    res.json({ success: true });
  } catch { res.status(500).json({ error: '操作失败' }); }
});

// Reject withdrawal
router.post('/withdrawals/:id/reject', authenticate, adminGuard, async (req, res) => {
  try {
    const tx = await prisma.transaction.findUnique({ where: { id: req.params.id } });
    if (!tx || tx.status !== 'pending') {
      res.status(400).json({ error: '交易不存在或状态不正确' });
      return;
    }

    // Refund the amount back
    const user = await prisma.user.findUnique({ where: { id: tx.userId } });
    if (user) {
      const newBalance = user.balance + Math.abs(tx.amount);
      await prisma.user.update({ where: { id: user.id }, data: { balance: newBalance } });
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { status: 'rejected', balance: newBalance, description: (tx.description || '') + ' [已拒绝/已退款]' },
      });
    }

    res.json({ success: true });
  } catch { res.status(500).json({ error: '操作失败' }); }
});

// Admin config — get/update payment QR codes (stored as simple JSON in description)
let paymentConfig: { alipayQr?: string; wechatQr?: string; alipayAccount?: string; wechatAccount?: string } = {};

router.get('/config', authenticate, adminGuard, (_req, res) => {
  res.json(paymentConfig);
});

router.put('/config', authenticate, adminGuard, (req, res) => {
  const { alipayQr, wechatQr, alipayAccount, wechatAccount } = req.body;
  if (alipayQr !== undefined) paymentConfig.alipayQr = alipayQr;
  if (wechatQr !== undefined) paymentConfig.wechatQr = wechatQr;
  if (alipayAccount !== undefined) paymentConfig.alipayAccount = alipayAccount;
  if (wechatAccount !== undefined) paymentConfig.wechatAccount = wechatAccount;
  res.json({ success: true, config: paymentConfig });
});

export default router;
