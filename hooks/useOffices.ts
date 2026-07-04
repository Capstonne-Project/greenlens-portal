'use client';

import { changeAdminUserRole, fetchAdminUsers } from '@/lib/api/services/fetchAdmin';
import { collectAssignedOfficerIds, filterUnassignedLeoUsers } from '@/utils/officeLeo';
import { createDepartment } from '@/lib/api/services/fetchDepartment';
import { departmentKeys } from '@/hooks/useDepartments';
import {
  assignOfficeOfficer,
  createOffice,
  fetchOfficeDetail,
  fetchOffices,
  updateOffice,
} from '@/lib/api/services/fetchOffice';
import { fetchProvinces, fetchWardsByProvince } from '@/lib/api/services/fetchLocationCatalog';
import type { AdminUsersListParams } from '@/lib/api/models/adminUser';
import type { CreateDepartmentInput } from '@/lib/api/models/department';
import type {
  AssignOfficeOfficerInput,
  CreateOfficeInput,
  OfficesListParams,
  UpdateOfficeInput,
} from '@/lib/api/models/office';
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const ASSIGNED_OFFICERS_PAGE_SIZE = 500;

export const officeKeys = {
  all: ['admin', 'offices'] as const,
  list: (params: OfficesListParams) => [...officeKeys.all, 'list', params] as const,
  detail: (id: string) => [...officeKeys.all, 'detail', id] as const,
  provinces: () => [...officeKeys.all, 'provinces'] as const,
  wards: (provinceCode: string) => [...officeKeys.all, 'wards', provinceCode] as const,
  userSearch: (params: AdminUsersListParams) => [...officeKeys.all, 'users', params] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;
const CATALOG_STALE_MS = 10 * 60 * 1000;

export function useOfficesList(params: OfficesListParams, enabled = true) {
  return useQuery({
    queryKey: officeKeys.list(params),
    queryFn: () => fetchOffices(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    enabled,
  });
}

export function useUnassignedLeoUsers(search: string, enabled: boolean) {
  const { data: officesData, isPending: officesPending } = useOfficesList(
    { page: 1, pageSize: ASSIGNED_OFFICERS_PAGE_SIZE },
    enabled
  );

  const assignedOfficerIds = useMemo(
    () => collectAssignedOfficerIds(officesData?.items ?? []),
    [officesData]
  );

  const userParams = useMemo(
    () => ({
      page: 1,
      pageSize: 50,
      role: 'LEO',
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [search]
  );

  const {
    data: usersData,
    isPending: usersPending,
    isError,
    error,
  } = useOfficeUserSearch(userParams, enabled);

  const items = useMemo(
    () => filterUnassignedLeoUsers(usersData?.items ?? [], assignedOfficerIds),
    [usersData, assignedOfficerIds]
  );

  return {
    items,
    isPending: officesPending || usersPending,
    isError,
    error,
  };
}

export function useOfficeDetail(officeId: string | null) {
  return useQuery({
    queryKey: officeKeys.detail(officeId ?? ''),
    queryFn: () => fetchOfficeDetail(officeId!),
    select: envelope => envelope.data,
    enabled: Boolean(officeId),
    staleTime: LIST_STALE_MS,
  });
}

export function useProvinces() {
  return useQuery({
    queryKey: officeKeys.provinces(),
    queryFn: () => fetchProvinces(),
    select: envelope => envelope.data,
    staleTime: CATALOG_STALE_MS,
  });
}

export function useWards(provinceCode: string | null) {
  return useQuery({
    queryKey: officeKeys.wards(provinceCode ?? ''),
    queryFn: () => fetchWardsByProvince(provinceCode!),
    select: envelope => envelope.data,
    enabled: Boolean(provinceCode?.trim()),
    staleTime: CATALOG_STALE_MS,
  });
}

export function useOfficeUserSearch(params: AdminUsersListParams, enabled: boolean) {
  return useQuery({
    queryKey: officeKeys.userSearch(params),
    queryFn: () => fetchAdminUsers(params),
    select: envelope => envelope.data,
    enabled,
    staleTime: 60 * 1000,
  });
}

function useInvalidateOffices() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: officeKeys.all });
  };
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  const invalidateOffices = useInvalidateOffices();
  return useMutation({
    mutationFn: (body: CreateDepartmentInput) => createDepartment(body),
    onSuccess: () => {
      invalidateOffices();
      void queryClient.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
}

export function useCreateOffice() {
  const invalidate = useInvalidateOffices();
  return useMutation({
    mutationFn: (body: CreateOfficeInput) => createOffice(body),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateOffice() {
  const invalidate = useInvalidateOffices();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateOfficeInput }) => updateOffice(id, body),
    onSuccess: () => invalidate(),
  });
}

export function useAssignOfficeOfficer() {
  const invalidate = useInvalidateOffices();
  return useMutation({
    mutationFn: ({ officeId, body }: { officeId: string; body: AssignOfficeOfficerInput }) =>
      assignOfficeOfficer(officeId, body),
    onSuccess: () => invalidate(),
  });
}

export function useChangeUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: string }) =>
      changeAdminUserRole(userId, newRole),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: officeKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

/** @deprecated Dùng `officeKeys` */
export const organizationKeys = officeKeys;
