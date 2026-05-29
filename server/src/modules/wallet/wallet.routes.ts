import { Router } from 'express';
import { authenticate } from '../../common/middleware';
import { z } from 'zod';
import { prisma } from '../../common/prisma';
import {
  getUserWallet, getTransactions, createRecharge, createWithdrawal,
  PRICING,
} from './wallet.service';

const router = Router();

// Get pricing
router.get('/pricing', (_req, res) => {
  res.json(PRICING);
});

// Get payment config (public for authenticated users — shows QR codes)
router.get('/payment-config', authenticate, async (_req, res) => {
  try {
    const record = await prisma.appConfig.findUnique({ where: { id: 'main' } });
    res.json(record ? JSON.parse(record.value) : {});
  } catch { res.status(500).json({ error: '获取配置失败' }); }
});

// Get wallet balance
router.get('/wallet', authenticate, async (req, res) => {
  try {
    const wallet = await getUserWallet(req.userId!);
    if (!wallet) { res.status(404).json({ error: '用户不存在' }); return; }
    res.json(wallet);
  } catch { res.status(500).json({ error: '获取钱包失败' }); }
});

// Get transaction history
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const result = await getTransactions(req.userId!, page);
    res.json(result);
  } catch { res.status(500).json({ error: '获取交易记录失败' }); }
});

// Recharge
router.post('/recharge', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      planId: z.string(),
      paymentMethod: z.string().default('alipay'),
      proof: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: '请选择套餐' }); return; }

    const result = await createRecharge(req.userId!, parsed.data.planId, parsed.data.paymentMethod, parsed.data.proof);
    if (!result) { res.status(400).json({ error: '套餐不存在' }); return; }
    res.json(result);
  } catch { res.status(500).json({ error: '充值失败' }); }
});

// Withdrawal
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      amount: z.number().min(1000, '最低提现10元'),
      account: z.string().min(1, '请填写收款账号'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }

    const result = await createWithdrawal(req.userId!, parsed.data.amount, parsed.data.account);
    if (!result) { res.status(400).json({ error: '余额不足' }); return; }
    res.json({ balance: result.balance, withdrawn: result.withdrawn });
  } catch { res.status(500).json({ error: '提现失败' }); }
});

export default router;
