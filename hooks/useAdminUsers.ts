'use client';

import {
  changeAdminUserRole,
  clearAdminAllUsersCache,
  createAdminUser,
  deleteAdminUser,
  fetchAdminAllUsers,
  fetchAdminRoles,
  fetchAdminUserDetail,
  fetchAdminUsers,
  updateAdminUser,
} from '@/lib/api/services/fetchAdmin';
import type {
  AdminRole,
  AdminUser,
  AdminUserDetail,
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
  detail: (id: string) => [...adminUsersKeys.all, 'detail', id] as const,
  roles: () => [...adminUsersKeys.all, 'roles'] as const,
  count: (role?: string) => [...adminUsersKeys.all, 'count', role ?? '__all__'] as const,
  allSource: () => [...adminUsersKeys.all, 'all-source'] as const,
};

const COUNT_STALE_MS = 3 * 60 * 1000;
const LIST_STALE_MS = 3 * 60 * 1000;
const DETAIL_STALE_MS = 3 * 60 * 1000;
const ROLES_STALE_MS = 10 * 60 * 1000;

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

/** Chi tiết người dùng admin. */
export function useAdminUserDetail(id: string | null) {
  return useQuery({
    queryKey: adminUsersKeys.detail(id ?? ''),
    queryFn: () => fetchAdminUserDetail(id!),
    select: (envelope: ApiEnvelope<AdminUserDetail>) => envelope.data,
    enabled: Boolean(id),
    staleTime: DETAIL_STALE_MS,
  });
}

/** Danh sách role hệ thống (ít đổi). */
export function useAdminRoles() {
  return useQuery({
    queryKey: adminUsersKeys.roles(),
    queryFn: () => fetchAdminRoles(),
    select: (envelope: ApiEnvelope<AdminRole[]>) => envelope.data,
    staleTime: ROLES_STALE_MS,
  });
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

export function useChangeAdminUserRole() {
  const invalidate = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: ({ id, newRole }: { id: string; newRole: string }) =>
      changeAdminUserRole(id, newRole),
    onSuccess: () => invalidate(),
  });
}
