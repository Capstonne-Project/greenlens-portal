'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import type { LockGamificationInput } from '@/lib/api/models/gamification';
import {
  fetchLeaderboard,
  lockGamificationUser,
  type LeaderboardPeriod,
  type LeaderboardQueryParams,
} from '@/lib/api/services/fetchGamification';
import { LEADERBOARD_TOP_DEFAULT } from '@/lib/constants/leaderboard';

export const gamificationKeys = {
  all: ['gamification'] as const,
  leaderboard: (params: LeaderboardQueryParams) =>
    [...gamificationKeys.all, 'leaderboard', params] as const,
};

export function useLeaderboard(params?: LeaderboardQueryParams) {
  const queryParams: LeaderboardQueryParams = {
    period: params?.period ?? 'AllTime',
    top: params?.top ?? LEADERBOARD_TOP_DEFAULT,
    year: params?.year,
    month: params?.month,
  };

  return useQuery({
    queryKey: gamificationKeys.leaderboard(queryParams),
    queryFn: () => fetchLeaderboard(queryParams),
    staleTime: 10 * 60 * 1000,
    select: res => res.data,
  });
}

export function useLockGamificationUser() {
  return useMutation({
    mutationFn: ({ userId, body }: { userId: string; body?: LockGamificationInput }) =>
      lockGamificationUser(userId, body),
  });
}

export type { LeaderboardPeriod };
