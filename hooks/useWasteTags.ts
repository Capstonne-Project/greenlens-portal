'use client';

import {
  createWasteTag,
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  const isInactiveOnly = params?.isActive === false;

  return useQuery({
    queryKey: isInactiveOnly ? wasteTagKeys.adminList(params) : wasteTagKeys.catalog(),
    queryFn: () => (isInactiveOnly ? fetchAdminWasteTags(params) : fetchCatalogWasteTags()),
    select: envelope => envelope.data,
    staleTime: isInactiveOnly ? LIST_STALE_MS : CATALOG_STALE_MS,
  });
}

/** Gộp tag active (catalog) + inactive (admin) cho màn quản trị. */
export function useAdminWasteTags() {
  const catalogQuery = useCatalogWasteTags();
  const inactiveQuery = useAdminWasteTagsList({ isActive: false });

  const items = useMemo(() => {
    const active = catalogQuery.data ?? [];
    const inactive = inactiveQuery.data?.items ?? [];
    return sortWasteTags([...active, ...inactive]);
  }, [catalogQuery.data, inactiveQuery.data]);

  return {
    items,
    isPending: catalogQuery.isPending || inactiveQuery.isPending,
    isError: catalogQuery.isError || inactiveQuery.isError,
    error: catalogQuery.error ?? inactiveQuery.error,
    refetch: () => {
      void catalogQuery.refetch();
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
