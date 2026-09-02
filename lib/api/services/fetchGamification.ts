/**
 * L2 — Gamification (admin lock + public leaderboard).
 */
import { adaptLockGamificationUser } from '@/lib/api/adapters/gamification.adapter';
import type { LeaderboardResponseDto } from '@/lib/api/dto/gamification.dto';
import { mapLeaderboardResponseDto } from '@/lib/api/mappers/gamification.mapper';
import type {
  LeaderboardData,
  LeaderboardQueryParams,
  LockGamificationInput,
  LockGamificationResult,
} from '@/lib/api/models/gamification';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { mapApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '../core';

export type {
  LeaderboardData,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardQueryParams,
  LockGamificationInput,
  LockGamificationResult,
} from '@/lib/api/models/gamification';

/** Swagger default `top` for GET /v1/gamification/leaderboard. */
const LEADERBOARD_TOP_SWAGGER_DEFAULT = 10;

export async function lockGamificationUser(
  userId: string,
  body?: LockGamificationInput
): Promise<ApiEnvelope<LockGamificationResult>> {
  return adaptLockGamificationUser(userId, body);
}

/**
 * GET /v1/gamification/leaderboard — public ranking (BR-GAM).
 * Query: period, top (default 10), year?, month?
 */
export async function fetchLeaderboard(
  params?: LeaderboardQueryParams
): Promise<ApiEnvelope<LeaderboardData>> {
  const query: Record<string, string | number> = {
    period: params?.period ?? 'AllTime',
    top: params?.top ?? LEADERBOARD_TOP_SWAGGER_DEFAULT,
  };
  if (params?.year != null) query.year = params.year;
  if (params?.month != null) query.month = params.month;

  const res = await apiService.get<ApiEnvelope<LeaderboardResponseDto>>(
    '/v1/gamification/leaderboard',
    query
  );

  return mapApiEnvelope(res.data, mapLeaderboardResponseDto);
}

export default { lockGamificationUser, fetchLeaderboard };
