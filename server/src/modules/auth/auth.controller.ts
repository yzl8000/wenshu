import { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from './auth.service';

const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位'),
  name: z.string().min(1, '姓名不能为空'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const result = await authService.register(parsed.data);
  if (!result) {
    res.status(409).json({ error: '该邮箱已被注册' });
    return;
  }

  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const result = await authService.login(parsed.data);
  if (!result) {
    res.status(401).json({ error: '邮箱或密码错误' });
    return;
  }

  res.json(result);
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = req.body;
  if (!token) {
    res.status(400).json({ error: '缺少刷新令牌' });
    return;
  }

  const result = authService.refresh(token);
  if (!result) {
    res.status(401).json({ error: '刷新令牌无效' });
    return;
  }

  res.json(result);
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await authService.getUserById(req.userId!);
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  res.json({ user });
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const { name, avatar, currentPassword, newPassword } = req.body;

  if (newPassword && !currentPassword) {
    res.status(400).json({ error: '修改密码需要提供当前密码' });
    return;
  }

  const result = await authService.updateUser(req.userId!, {
    name,
    avatar,
    currentPassword,
    newPassword,
  });

  if (!result) {
    res.status(400).json({ error: '当前密码错误' });
    return;
  }

  res.json({ user: result });
}
