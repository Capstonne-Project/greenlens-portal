'use client';

import {
  fetchGamificationConfigs,
  updateGamificationConfig,
  type UpdateGamificationConfigInput,
} from '@/lib/api/services/fetchGamificationConfig';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const gamificationConfigKeys = {
  all: ['admin', 'gamification-configs'] as const,
  list: () => [...gamificationConfigKeys.all, 'list'] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;

export function useGamificationConfigsList() {
  return useQuery({
    queryKey: gamificationConfigKeys.list(),
    queryFn: () => fetchGamificationConfigs(),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
  });
}

export function useUpdateGamificationConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateGamificationConfigInput }) =>
      updateGamificationConfig(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: gamificationConfigKeys.all });
    },
  });
}
