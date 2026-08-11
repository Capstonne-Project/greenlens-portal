'use client';

import {
  fetchAdminBadges,
  toggleAdminBadge,
  updateAdminBadge,
} from '@/lib/api/services/fetchAdminBadge';
import type {
  AdminBadgesParams,
  ToggleAdminBadgeInput,
  UpdateAdminBadgeInput,
} from '@/lib/api/models/adminBadge';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const adminBadgeKeys = {
  all: ['admin', 'badges'] as const,
  list: (params?: AdminBadgesParams) => [...adminBadgeKeys.all, 'list', params ?? {}] as const,
};

const LIST_STALE_MS = 10 * 60 * 1000;

/** GET /v1/admin/badges — phân trang + search + isActive + sort. */
export function useAdminBadgesList(params?: AdminBadgesParams) {
  return useQuery({
    queryKey: adminBadgeKeys.list(params),
    queryFn: () => fetchAdminBadges(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
  });
}

function useInvalidateAdminBadges() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminBadgeKeys.all });
  };
}

export function useUpdateAdminBadge() {
  const invalidate = useInvalidateAdminBadges();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAdminBadgeInput }) =>
      updateAdminBadge(id, body),
    onSuccess: () => invalidate(),
  });
}

export function useToggleAdminBadge() {
  const invalidate = useInvalidateAdminBadges();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ToggleAdminBadgeInput }) =>
      toggleAdminBadge(id, body),
    onSuccess: () => invalidate(),
  });
}
