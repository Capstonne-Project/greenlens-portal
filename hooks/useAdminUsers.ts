'use client';

import {
  clearAdminAllUsersCache,
  createAdminUser,
  deleteAdminUser,
  fetchAdminAllUsers,
  fetchAdminUsers,
  updateAdminUser,
} from '@/lib/api/services/fetchAdmin';
import type {
  AdminUser,
  AdminUsersList,
  AdminUsersListParams,
  CreateAdminUserInput,
  UpdateAdminUserInput,
} from '@/lib/api/models/adminUser';
import { adminUsersCountsUseAllSource } from '@/lib/config/adminUsers';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

export const adminUsersKeys = {
  all: ['admin', 'users'] as const,
  list: (params: AdminUsersListParams) => [...adminUsersKeys.all, 'list', params] as const,
  count: (role?: string) => [...adminUsersKeys.all, 'count', role ?? '__all__'] as const,
  allSource: () => [...adminUsersKeys.all, 'all-source'] as const,
};

const COUNT_STALE_MS = 3 * 60 * 1000;
const LIST_STALE_MS = 3 * 60 * 1000;

function pickTotal(envelope: ApiEnvelope<AdminUsersList>): number {
  return envelope.data.pagination.totalItems;
}

/** Danh sách người dùng (phân trang / lọc). */
export function useAdminUsersList(params: AdminUsersListParams) {
  return useQuery({
    queryKey: adminUsersKeys.list(params),
    queryFn: () => fetchAdminUsers(params),
    select: (envelope: ApiEnvelope<AdminUsersList>) => envelope.data,
    staleTime: LIST_STALE_MS,
  });
}

/** Tổng số bản ghi (pageSize=1) — dùng badge sidebar. */
export function useAdminUsersTotal(role?: string) {
  return useQuery({
    queryKey: adminUsersKeys.count(role),
    queryFn: () =>
      fetchAdminUsers({
        page: 1,
        pageSize: 1,
        ...(role ? { role } : {}),
      }),
    select: pickTotal,
    staleTime: COUNT_STALE_MS,
  });
}

/** Nhiều tổng theo vai trò — một lần gọi useQueries (hoặc 1× `/users/all` khi strategy=all). */
export function useAdminUsersTotalsByRole(roles: (string | undefined)[]) {
  const useAllSource = adminUsersCountsUseAllSource();

  const allSource = useQuery({
    queryKey: adminUsersKeys.allSource(),
    queryFn: () => fetchAdminAllUsers(),
    select: (envelope: ApiEnvelope<AdminUser[]>) => envelope.data,
    staleTime: COUNT_STALE_MS,
    enabled: useAllSource,
  });

  const pagedCounts = useQueries({
    queries: roles.map(role => ({
      queryKey: adminUsersKeys.count(role),
      queryFn: () =>
        fetchAdminUsers({
          page: 1,
          pageSize: 1,
          ...(role ? { role } : {}),
        }),
      select: pickTotal,
      staleTime: COUNT_STALE_MS,
      enabled: !useAllSource,
    })),
  });

  if (!useAllSource) return pagedCounts;

  return roles.map(role => {
    const items = allSource.data ?? [];
    const total = role ? items.filter(u => u.role === role).length : items.length;
    return {
      data: total,
      isPending: allSource.isPending,
      isError: allSource.isError,
      error: allSource.error,
      isFetching: allSource.isFetching,
      status: allSource.status,
      fetchStatus: allSource.fetchStatus,
    };
  });
}

function useInvalidateAdminUsers() {
  const queryClient = useQueryClient();
  return () => {
    clearAdminAllUsersCache();
    void queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
  };
}

export function useCreateAdminUser() {
  const invalidate = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: (body: CreateAdminUserInput) => createAdminUser(body),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateAdminUser() {
  const invalidate = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAdminUserInput }) =>
      updateAdminUser(id, body),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteAdminUser() {
  const invalidate = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    onSuccess: () => invalidate(),
  });
}
