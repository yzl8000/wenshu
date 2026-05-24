import bcrypt from 'bcryptjs';
import { prisma } from '../../common/prisma';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../common/jwt';

export async function register(data: { email: string; password: string; name: string }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return null;

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { email: data.email, passwordHash, name: data.name },
    select: { id: true, email: true, name: true, avatar: true, createdAt: true },
  });

  const payload = { userId: user.id, email: user.email };
  return {
    user,
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export async function login(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) return null;

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) return null;

  const payload = { userId: user.id, email: user.email };
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export function refresh(token: string) {
  try {
    const payload = verifyRefreshToken(token);
    const tokenPayload = { userId: payload.userId, email: payload.email };
    return {
      accessToken: signAccessToken(tokenPayload),
      refreshToken: signRefreshToken(tokenPayload),
    };
  } catch {
    return null;
  }
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, avatar: true, createdAt: true },
  });
}

export async function updateUser(
  userId: string,
  data: { name?: string; avatar?: string; currentPassword?: string; newPassword?: string }
) {
  const updateData: Record<string, unknown> = {};
  if (data.name) updateData.name = data.name;
  if (data.avatar !== undefined) updateData.avatar = data.avatar;

  if (data.newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    const valid = await bcrypt.compare(data.currentPassword!, user.passwordHash);
    if (!valid) return null;
    updateData.passwordHash = await bcrypt.hash(data.newPassword, 10);
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, email: true, name: true, avatar: true, createdAt: true },
  });
}
