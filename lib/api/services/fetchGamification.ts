/**
 * L2 — Gamification admin actions (lock user points).
 */
import { adaptLockGamificationUser } from '@/lib/api/adapters/gamification.adapter';
import type { LockGamificationInput, LockGamificationResult } from '@/lib/api/models/gamification';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type { LockGamificationInput, LockGamificationResult } from '@/lib/api/models/gamification';

export async function lockGamificationUser(
  userId: string,
  body?: LockGamificationInput
): Promise<ApiEnvelope<LockGamificationResult>> {
  return adaptLockGamificationUser(userId, body);
}

export default { lockGamificationUser };
