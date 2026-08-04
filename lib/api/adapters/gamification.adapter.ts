import type {
  LockGamificationBodyDto,
  LockGamificationResultDto,
} from '@/lib/api/dto/gamification.dto';
import type { LockGamificationInput, LockGamificationResult } from '@/lib/api/models/gamification';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

/** POST /v1/gamification/{userId}/lock */
export async function adaptLockGamificationUser(
  userId: string,
  body?: LockGamificationInput
): Promise<ApiEnvelope<LockGamificationResult>> {
  const payload: LockGamificationBodyDto = {};
  if (body?.reason?.trim()) payload.reason = body.reason.trim();

  const res = await apiService.post<ApiEnvelope<LockGamificationResultDto>>(
    `/v1/gamification/${encodeURIComponent(userId)}/lock`,
    payload
  );

  return mapApiEnvelope(res.data, dto => ({
    userId: dto.userId ?? userId,
    isLocked: dto.isLocked !== false,
    message: dto.message?.trim() ?? '',
  }));
}
