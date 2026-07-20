'use client';

import {
  assignDepartmentOfficer,
  createDepartment,
  deactivateDepartment,
  fetchDepartmentDetail,
  fetchDepartments,
  fetchDeoMyReports,
  fetchMyOffices,
  updateDepartment,
} from '@/lib/api/services/fetchDepartment';
import { fetchAdminUsers } from '@/lib/api/services/fetchAdmin';
import { fetchProvinces } from '@/lib/api/services/fetchLocationCatalog';
import type { AdminUsersListParams } from '@/lib/api/models/adminUser';
import { useMemo } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type {
  AssignDepartmentOfficerInput,
  CreateDepartmentInput,
  DepartmentsListParams,
  DeoMyReportsParams,
  MyOffices,
  MyOfficesParams,
  UpdateDepartmentInput,
} from '@/lib/api/models/department';
import { MY_OFFICES_PAGE_SIZE } from '@/lib/api/models/department';

export const departmentKeys = {
  all: ['admin', 'departments'] as const,
  list: (params: DepartmentsListParams) => [...departmentKeys.all, 'list', params] as const,
  myOffices: (params: MyOfficesParams) => [...departmentKeys.all, 'my-offices', params] as const,
  deoMyReports: (params: DeoMyReportsParams) =>
    [...departmentKeys.all, 'deo-my-reports', params] as const,
  myOfficesInfinite: (search: string) =>
    [
      ...departmentKeys.all,
      'my-offices-infinite',
      { search, pageSize: MY_OFFICES_PAGE_SIZE },
    ] as const,
  detail: (id: string) => [...departmentKeys.all, 'detail', id] as const,
  provinces: () => [...departmentKeys.all, 'provinces'] as const,
  deoSearch: (params: AdminUsersListParams) =>
    [...departmentKeys.all, 'deo-users', params] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;
const CATALOG_STALE_MS = 10 * 60 * 1000;

/** Chỉ lấy departmentId khi submit create mà chưa mở dropdown. */
export const MY_OFFICES_LOOKUP_PARAMS: MyOfficesParams = { page: 1, pageSize: 1 };

/** L4 — lấy my-offices từ cache hoặc fetch (dùng khi submit create cần departmentId). */
export async function ensureMyOfficesData(
  queryClient: QueryClient,
  params: MyOfficesParams = MY_OFFICES_LOOKUP_PARAMS
): Promise<MyOffices> {
  const envelope = await queryClient.fetchQuery({
    queryKey: departmentKeys.myOffices(params),
    queryFn: () => fetchMyOffices(params),
    staleTime: LIST_STALE_MS,
  });
  return envelope.data;
}

export function useDepartmentsList(params: DepartmentsListParams) {
  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn: () => fetchDepartments(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
  });
}

export function useMyOffices(params: MyOfficesParams, enabled = true) {
  return useQuery({
    queryKey: departmentKeys.myOffices(params),
    queryFn: () => fetchMyOffices(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    enabled,
  });
}

/** GET /v1/departments/my/reports — danh sách báo cáo Sở (DEO). */
export function useDeoMyReports(params: DeoMyReportsParams, enabled = true) {
  return useQuery({
    queryKey: departmentKeys.deoMyReports(params),
    queryFn: () => fetchDeoMyReports(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    enabled,
  });
}

/** Dropdown phường/xã — chỉ `search` + pagination (pageSize 20), infinite scroll. */
export function useMyOfficesInfinite(search: string, enabled: boolean) {
  const normalizedSearch = search.trim();

  return useInfiniteQuery({
    queryKey: departmentKeys.myOfficesInfinite(normalizedSearch),
    queryFn: async ({ pageParam }) => {
      const envelope = await fetchMyOffices({
        page: pageParam,
        pageSize: MY_OFFICES_PAGE_SIZE,
        ...(normalizedSearch ? { search: normalizedSearch } : {}),
      });
      return envelope.data;
    },
    initialPageParam: 1,
    getNextPageParam: lastPage =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    enabled,
    staleTime: LIST_STALE_MS,
  });
}

export function useDepartmentDetail(id: string | null) {
  return useQuery({
    queryKey: departmentKeys.detail(id ?? ''),
    queryFn: () => fetchDepartmentDetail(id!),
    select: envelope => envelope.data,
    enabled: Boolean(id),
    staleTime: LIST_STALE_MS,
  });
}

export function useCatalogProvinces(enabled = true) {
  return useQuery({
    queryKey: departmentKeys.provinces(),
    queryFn: () => fetchProvinces(),
    select: envelope => envelope.data,
    staleTime: CATALOG_STALE_MS,
    enabled,
  });
}

function useInvalidateDepartments() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: departmentKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'offices'] });
  };
}

export function useCreateDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: (body: CreateDepartmentInput) => createDepartment(body),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateDepartmentInput }) =>
      updateDepartment(id, body),
    onSuccess: () => invalidate(),
  });
}

export function useDeactivateDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: (id: string) => deactivateDepartment(id),
    onSuccess: () => invalidate(),
  });
}

export function useAssignDepartmentOfficer() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: AssignDepartmentOfficerInput }) =>
      assignDepartmentOfficer(id, body),
    onSuccess: () => invalidate(),
  });
}

export function useDeoUsers(search: string, enabled: boolean) {
  const params = useMemo(
    () => ({
      page: 1,
      pageSize: 50,
      role: 'DEO',
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [search]
  );

  return useQuery({
    queryKey: departmentKeys.deoSearch(params),
    queryFn: () => fetchAdminUsers(params),
    select: envelope => envelope.data.items,
    enabled,
    staleTime: 60 * 1000,
  });
}
