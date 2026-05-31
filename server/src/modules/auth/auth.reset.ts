import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../common/prisma';

const router = Router();

// In-memory reset codes (production would use DB + email)
const resetCodes = new Map<string, { code: string; expires: number }>();

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: '请输入邮箱' }); return; }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether email exists
      res.json({ message: '如果该邮箱已注册，重置验证码已生成' });
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    resetCodes.set(email, { code, expires: Date.now() + 10 * 60 * 1000 }); // 10 min expiry

    // In production, send code via email. Here we return it directly.
    res.json({ message: '验证码已生成', code });
  } catch { res.status(500).json({ error: '服务器错误' }); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ error: '请填写所有必填项' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: '新密码至少 6 位' });
      return;
    }

    const record = resetCodes.get(email);
    if (!record || record.code !== code || Date.now() > record.expires) {
      res.status(400).json({ error: '验证码无效或已过期' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { email }, data: { passwordHash } });
    resetCodes.delete(email);

    res.json({ message: '密码已重置，请使用新密码登录' });
  } catch { res.status(500).json({ error: '重置失败' }); }
});

export default router;
