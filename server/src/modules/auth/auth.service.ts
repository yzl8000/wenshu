import bcrypt from 'bcryptjs';
import { prisma } from '../../common/prisma';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../common/jwt';

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `WX${code}`;
}

const FREE_CREDITS = 30; // 3 free plagiarism checks

export async function register(data: { email: string; password: string; name: string; referralCode?: string }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return null;

  const passwordHash = await bcrypt.hash(data.password, 10);
  const referralCode = generateReferralCode();

  // Validate referral code if provided
  let referredBy: string | undefined;
  if (data.referralCode) {
    const referrer = await prisma.user.findUnique({ where: { referralCode: data.referralCode } });
    if (referrer) referredBy = data.referralCode;
  }

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      referralCode,
      referredBy,
      balance: FREE_CREDITS,
    },
    select: { id: true, email: true, name: true, avatar: true, referralCode: true, referredBy: true, balance: true, createdAt: true },
  });

  // Record the free trial credits
  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: 'free_trial',
      amount: FREE_CREDITS,
      balance: FREE_CREDITS,
      description: '注册赠送免费体验积分',
      status: 'completed',
    },
  });

  // Give referral bonus to referrer
  if (referredBy) {
    const referrer = await prisma.user.findUnique({ where: { referralCode: referredBy } });
    if (referrer) {
      const bonus = 10;
      await prisma.user.update({ where: { id: referrer.id }, data: { balance: referrer.balance + bonus } });
      await prisma.transaction.create({
        data: {
          userId: referrer.id,
          type: 'referral_bonus',
          amount: bonus,
          balance: referrer.balance + bonus,
          description: `推荐用户 ${user.email} 注册奖励`,
          status: 'completed',
        },
      });
    }
  }

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

  // Generate referral code for existing users who don't have one
  let { referralCode } = user;
  if (!referralCode) {
    referralCode = generateReferralCode();
    await prisma.user.update({ where: { id: user.id }, data: { referralCode } });
  }

  const payload = { userId: user.id, email: user.email };
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      referralCode,
      balance: user.balance,
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
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true, avatar: true, balance: true,
      referralCode: true, referredBy: true, createdAt: true,
      _count: { select: { referredUsers: true } },
    },
  });
  if (!user) return null;

  // Generate referral code for existing users who don't have one
  if (!user.referralCode) {
    const referralCode = generateReferralCode();
    await prisma.user.update({ where: { id: userId }, data: { referralCode } });
    user = { ...user, referralCode };
  }
  return user;
}

export async function getReferralStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralCode: true,
      referredUsers: {
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { referredUsers: true } },
    },
  });
  if (!user) return null;
  return {
    code: user.referralCode,
    count: user._count.referredUsers,
    users: user.referredUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      joinedAt: u.createdAt,
    })),
  };
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
