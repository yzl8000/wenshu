import { deductCredits, PRICING } from './wallet.service';

/**
 * Middleware factory: check that user has enough credits for a service.
 * If insufficient, returns 402 Payment Required with balance info.
 * If sufficient, deducts credits and attaches new balance to req.
 */
export function requireCredits(service: string) {
  return async (req: any, res: any, next: any) => {
    const result = await deductCredits(req.userId!, service);
    if (!result.success) {
      const cost = PRICING.creditCosts[service] || 1;
      res.status(402).json({
        error: '积分不足',
        balance: result.balance,
        required: cost,
        message: `积分不足（当前: ${result.balance}，需要: ${cost}）。请先购买积分。`,
      });
      return;
    }
    req.newBalance = result.balance;
    next();
  };
}
