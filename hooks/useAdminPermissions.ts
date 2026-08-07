'use client';

import { fetchAdminPermissions } from '@/lib/api/services/fetchAdminPermissions';
import type { AdminPermissionsList } from '@/lib/api/models/adminPermission';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { useQuery } from '@tanstack/react-query';

export const adminPermissionKeys = {
  all: ['admin', 'permissions'] as const,
  list: () => [...adminPermissionKeys.all, 'list'] as const,
};

const LIST_STALE_MS = 10 * 60 * 1000;

export function useAdminPermissionsList() {
  return useQuery({
    queryKey: adminPermissionKeys.list(),
    queryFn: () => fetchAdminPermissions(),
    select: (envelope: ApiEnvelope<AdminPermissionsList>) => envelope.data,
    staleTime: LIST_STALE_MS,
  });
}
