'use client';

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import type { LockGamificationInput } from '@/lib/api/models/gamification';
import {
  fetchLeaderboard,
  lockGamificationUser,
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
    queryFn: async () => {
      const res = await fetchLeaderboard(queryParams);
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useLockGamificationUser() {
  return useMutation({
    mutationFn: ({ userId, body }: { userId: string; body?: LockGamificationInput }) =>
      lockGamificationUser(userId, body),
  });
}
