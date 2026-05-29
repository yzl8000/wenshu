import { prisma } from '../../common/prisma';

// Pricing config
export const PRICING = {
  plans: [
    { id: 'basic', name: '基础版', price: 990, credits: 100, desc: '入门体验，适合轻度用户', popular: false },
    { id: 'standard', name: '标准版', price: 1990, credits: 300, desc: '性价比之选，满足日常使用', popular: true },
    { id: 'pro', name: '专业版', price: 4990, credits: 1000, desc: '重度用户首选，量大优惠', popular: false },
  ],
  creditCosts: {
    plagiarism: 10,
    ai_rewrite: 5,
    ai_expand: 5,
    ai_continue: 5,
    ai_brainstorm: 3,
    ai_summarize: 3,
  },
};

export async function getUserWallet(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, balance: true },
  });
  if (!user) return null;
  return { balance: user.balance };
}

export async function getTransactions(userId: string, page = 1, pageSize = 20) {
  const total = await prisma.transaction.count({ where: { userId } });
  const list = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true, type: true, amount: true, balance: true,
      description: true, status: true, paymentMethod: true, createdAt: true,
    },
  });
  return { total, list, page, pageSize };
}

export async function createRecharge(userId: string, planId: string) {
  const plan = PRICING.plans.find((p) => p.id === planId);
  if (!plan) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const newBalance = user.balance + plan.credits;

  await prisma.transaction.create({
    data: {
      userId,
      type: 'recharge',
      amount: plan.credits,
      balance: newBalance,
      description: `购买${plan.name} (¥${(plan.price / 100).toFixed(2)})`,
      status: 'completed',
      paymentMethod: 'simulate',
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { balance: newBalance },
  });

  return { balance: newBalance, charged: plan.credits };
}

export async function createWithdrawal(userId: string, amount: number, account: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.balance < amount) return null;

  const newBalance = user.balance - amount;

  await prisma.transaction.create({
    data: {
      userId,
      type: 'withdrawal',
      amount: -amount,
      balance: newBalance,
      description: `提现到 ${account}`,
      status: 'pending',
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { balance: newBalance },
  });

  return { balance: newBalance, withdrawn: amount };
}

export async function deductCredits(userId: string, service: string) {
  const cost = PRICING.creditCosts[service] || 1;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.balance < cost) return { success: false, balance: user?.balance || 0, cost };

  const newBalance = user.balance - cost;

  await prisma.transaction.create({
    data: {
      userId, type: 'consumption', amount: -cost, balance: newBalance,
      description: `消耗积分: ${service}`, status: 'completed',
    },
  });

  await prisma.user.update({ where: { id: userId }, data: { balance: newBalance } });

  return { success: true, balance: newBalance, cost };
}

// Admin: get all pending withdrawals
export async function getPendingWithdrawals() {
  return prisma.transaction.findMany({
    where: { type: 'withdrawal', status: 'pending' },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
