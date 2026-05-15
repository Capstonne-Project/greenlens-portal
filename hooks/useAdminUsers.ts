'use client';

import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
  type AdminUsersPaged,
  type AdminUsersQueryParams,
  type CreateAdminUserBody,
  type UpdateAdminUserBody,
} from '@/lib/api/services/fetchAdmin';
import type { ApiEnvelope } from '@/lib/api/types/auth';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

export const adminUsersKeys = {
  all: ['admin', 'users'] as const,
  list: (params: AdminUsersQueryParams) => [...adminUsersKeys.all, 'list', params] as const,
  count: (role?: string) => [...adminUsersKeys.all, 'count', role ?? '__all__'] as const,
};

const COUNT_STALE_MS = 3 * 60 * 1000;
const LIST_STALE_MS = 3 * 60 * 1000;

function pickTotal(envelope: ApiEnvelope<AdminUsersPaged>): number {
  return envelope.data.pagination.totalItems;
}

/** Danh sách người dùng (phân trang / lọc). */
export function useAdminUsersList(params: AdminUsersQueryParams) {
  return useQuery({
    queryKey: adminUsersKeys.list(params),
    queryFn: () => fetchAdminUsers(params),
    select: (envelope: ApiEnvelope<AdminUsersPaged>) => envelope.data,
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

/** Nhiều tổng theo vai trò — một lần gọi useQueries. */
export function useAdminUsersTotalsByRole(roles: (string | undefined)[]) {
  return useQueries({
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
    })),
  });
}

function useInvalidateAdminUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
}

export function useCreateAdminUser() {
  const invalidate = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: (body: CreateAdminUserBody) => createAdminUser(body),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateAdminUser() {
  const invalidate = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAdminUserBody }) =>
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
