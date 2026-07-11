'use client';

import {
  createPenaltyFramework,
  fetchPenaltyFrameworks,
  togglePenaltyFramework,
  updatePenaltyFramework,
  type CreatePenaltyFrameworkInput,
  type PenaltyFrameworksListParams,
  type TogglePenaltyFrameworkInput,
  type UpdatePenaltyFrameworkInput,
} from '@/lib/api/services/fetchPenaltyFramework';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const penaltyFrameworkKeys = {
  all: ['admin', 'penalty-frameworks'] as const,
  list: (params: PenaltyFrameworksListParams) =>
    [...penaltyFrameworkKeys.all, 'list', params] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;

function useInvalidatePenaltyFrameworks() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: penaltyFrameworkKeys.all });
  };
}

export function usePenaltyFrameworksList(params: PenaltyFrameworksListParams) {
  return useQuery({
    queryKey: penaltyFrameworkKeys.list(params),
    queryFn: () => fetchPenaltyFrameworks(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
  });
}

export function useCreatePenaltyFramework() {
  const invalidate = useInvalidatePenaltyFrameworks();
  return useMutation({
    mutationFn: (body: CreatePenaltyFrameworkInput) => createPenaltyFramework(body),
    onSuccess: () => invalidate(),
  });
}

export function useUpdatePenaltyFramework() {
  const invalidate = useInvalidatePenaltyFrameworks();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePenaltyFrameworkInput }) =>
      updatePenaltyFramework(id, body),
    onSuccess: () => invalidate(),
  });
}

export function useTogglePenaltyFramework() {
  const invalidate = useInvalidatePenaltyFrameworks();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TogglePenaltyFrameworkInput }) =>
      togglePenaltyFramework(id, body),
    onSuccess: () => invalidate(),
  });
}
