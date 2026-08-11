'use client';

import {
  createWasteTag,
  deleteWasteTag,
  fetchAdminWasteTags,
  fetchCatalogWasteTags,
  toggleWasteTag,
  updateWasteTag,
  type AdminWasteTagsParams,
} from '@/lib/api/services/fetchWasteTag';
import type {
  CreateWasteTagInput,
  ToggleWasteTagInput,
  UpdateWasteTagInput,
} from '@/lib/api/models/wasteTag';
import { ADMIN_WASTE_TAGS_LIST_FETCH_SIZE } from '@/lib/constants/adminWasteTags';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

export const wasteTagKeys = {
  all: ['waste-tags'] as const,
  catalog: () => [...wasteTagKeys.all, 'catalog'] as const,
  admin: ['admin', 'waste-tags'] as const,
  adminList: (params?: AdminWasteTagsParams) =>
    [...wasteTagKeys.admin, 'list', params ?? {}] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;
const CATALOG_STALE_MS = 10 * 60 * 1000;

function sortWasteTags<T extends { displayOrder: number; nameVi: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.nameVi.localeCompare(b.nameVi, 'vi')
  );
}

/** Catalog công khai — dropdown/chip (chỉ active, GET /v1/waste-tags). */
export function useCatalogWasteTags(enabled = true) {
  return useQuery({
    queryKey: wasteTagKeys.catalog(),
    queryFn: () => fetchCatalogWasteTags(),
    select: envelope => sortWasteTags(envelope.data.items),
    staleTime: CATALOG_STALE_MS,
    enabled,
  });
}

export function useAdminWasteTagsList(params?: AdminWasteTagsParams) {
  return useQuery({
    queryKey: wasteTagKeys.adminList(params),
    queryFn: () => fetchAdminWasteTags(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
  });
}

/** Gộp tag active + inactive (admin) cho màn quản trị. */
export function useAdminWasteTags() {
  const activeQuery = useAdminWasteTagsList({
    isActive: true,
    page: 1,
    pageSize: ADMIN_WASTE_TAGS_LIST_FETCH_SIZE,
    sortBy: 'displayOrder',
    sortDesc: false,
  });
  const inactiveQuery = useAdminWasteTagsList({
    isActive: false,
    page: 1,
    pageSize: ADMIN_WASTE_TAGS_LIST_FETCH_SIZE,
    sortBy: 'displayOrder',
    sortDesc: false,
  });

  const items = useMemo(() => {
    const active = activeQuery.data?.items ?? [];
    const inactive = inactiveQuery.data?.items ?? [];
    return sortWasteTags([...active, ...inactive]);
  }, [activeQuery.data, inactiveQuery.data]);

  return {
    items,
    isPending: activeQuery.isPending || inactiveQuery.isPending,
    isError: activeQuery.isError || inactiveQuery.isError,
    error: activeQuery.error ?? inactiveQuery.error,
    refetch: () => {
      void activeQuery.refetch();
      void inactiveQuery.refetch();
    },
  };
}

function useInvalidateWasteTags() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: wasteTagKeys.all });
    void queryClient.invalidateQueries({ queryKey: wasteTagKeys.admin });
  };
}

export function useCreateWasteTag() {
  const invalidate = useInvalidateWasteTags();
  return useMutation({
    mutationFn: (body: CreateWasteTagInput) => createWasteTag(body),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateWasteTag() {
  const invalidate = useInvalidateWasteTags();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateWasteTagInput }) =>
      updateWasteTag(id, body),
    onSuccess: () => invalidate(),
  });
}

export function useToggleWasteTag() {
  const invalidate = useInvalidateWasteTags();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ToggleWasteTagInput }) =>
      toggleWasteTag(id, body),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteWasteTag() {
  const invalidate = useInvalidateWasteTags();
  return useMutation({
    mutationFn: (id: string) => deleteWasteTag(id),
    onSuccess: () => invalidate(),
  });
}
