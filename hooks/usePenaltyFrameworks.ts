'use client';

import {
  createPenaltyFramework,
  fetchPenaltyFrameworks,
  type CreatePenaltyFrameworkInput,
  type PenaltyFrameworksListParams,
} from '@/lib/api/services/fetchPenaltyFramework';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const penaltyFrameworkKeys = {
  all: ['admin', 'penalty-frameworks'] as const,
  list: (params: PenaltyFrameworksListParams) =>
    [...penaltyFrameworkKeys.all, 'list', params] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;

export function usePenaltyFrameworksList(params: PenaltyFrameworksListParams) {
  return useQuery({
    queryKey: penaltyFrameworkKeys.list(params),
    queryFn: () => fetchPenaltyFrameworks(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
  });
}

export function useCreatePenaltyFramework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreatePenaltyFrameworkInput) => createPenaltyFramework(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: penaltyFrameworkKeys.all });
    },
  });
}
