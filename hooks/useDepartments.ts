'use client';

import {
  assignDepartmentOfficer,
  createDepartment,
  deactivateDepartment,
  fetchDepartmentDetail,
  fetchDepartments,
  updateDepartment,
} from '@/lib/api/services/fetchDepartment';
import { fetchAdminUsers } from '@/lib/api/services/fetchAdmin';
import { fetchProvinces } from '@/lib/api/services/fetchLocationCatalog';
import type { AdminUsersListParams } from '@/lib/api/models/adminUser';
import type {
  AssignDepartmentOfficerInput,
  CreateDepartmentInput,
  DepartmentsListParams,
  UpdateDepartmentInput,
} from '@/lib/api/models/department';
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const departmentKeys = {
  all: ['admin', 'departments'] as const,
  list: (params: DepartmentsListParams) => [...departmentKeys.all, 'list', params] as const,
  detail: (id: string) => [...departmentKeys.all, 'detail', id] as const,
  provinces: () => [...departmentKeys.all, 'provinces'] as const,
  deoSearch: (params: AdminUsersListParams) =>
    [...departmentKeys.all, 'deo-users', params] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;
const CATALOG_STALE_MS = 10 * 60 * 1000;

export function useDepartmentsList(params: DepartmentsListParams) {
  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn: () => fetchDepartments(params),
    select: envelope => envelope.data,
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
