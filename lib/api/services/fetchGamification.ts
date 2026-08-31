/**
 * L2 — Gamification (admin lock + public leaderboard).
 */
import { adaptLockGamificationUser } from '@/lib/api/adapters/gamification.adapter';
import type { LockGamificationInput, LockGamificationResult } from '@/lib/api/models/gamification';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '../core';

export type { LockGamificationInput, LockGamificationResult } from '@/lib/api/models/gamification';

export type LeaderboardPeriod = 'AllTime' | 'Weekly' | 'Monthly' | 'Yearly';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  points: number;
  level: number;
}

export interface LeaderboardData {
  period: LeaderboardPeriod;
  year: number | null;
  month: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  entries: LeaderboardEntry[];
}

export interface LeaderboardQueryParams {
  period?: LeaderboardPeriod;
  top?: number;
  year?: number;
  month?: number;
}

export async function lockGamificationUser(
  userId: string,
  body?: LockGamificationInput
): Promise<ApiEnvelope<LockGamificationResult>> {
  return adaptLockGamificationUser(userId, body);
}

/** GET /v1/gamification/leaderboard — public ranking (BR-GAM). */
export async function fetchLeaderboard(
  params?: LeaderboardQueryParams
): Promise<ApiEnvelope<LeaderboardData>> {
  const res = await apiService.get<ApiEnvelope<LeaderboardData>>('/v1/gamification/leaderboard', {
    params: {
      period: params?.period ?? 'AllTime',
      top: params?.top ?? 20,
      ...(params?.year != null ? { year: params.year } : {}),
      ...(params?.month != null ? { month: params.month } : {}),
    },
  });
  return res.data;
}

export default { lockGamificationUser, fetchLeaderboard };
