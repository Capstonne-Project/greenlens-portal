'use client';

import {
  archivePollutionCategory,
  createPollutionCategory,
  deletePollutionCategory,
  fetchAdminPollutionCategories,
  fetchCatalogPollutionCategories,
  updatePollutionCategory,
} from '@/lib/api/services/fetchPollutionCategory';
import type {
  AdminPollutionCategoriesParams,
  ArchivePollutionCategoryInput,
  CreatePollutionCategoryInput,
  UpdatePollutionCategoryInput,
} from '@/lib/api/models/pollutionCategory';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const pollutionCategoryKeys = {
  all: ['admin', 'pollution-categories'] as const,
  list: (params?: AdminPollutionCategoriesParams) =>
    [...pollutionCategoryKeys.all, 'list', params ?? {}] as const,
  catalog: () => [...pollutionCategoryKeys.all, 'catalog'] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;
const CATALOG_STALE_MS = 10 * 60 * 1000;

/** GET /v1/admin/pollution-categories — phân trang + search + isActive + sort. */
export function useAdminPollutionCategoriesList(params?: AdminPollutionCategoriesParams) {
  return useQuery({
    queryKey: pollutionCategoryKeys.list(params),
    queryFn: () => fetchAdminPollutionCategories(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
  });
}

/** Catalog công khai — dropdown báo cáo (chỉ active). */
export function useCatalogPollutionCategories(enabled = true) {
  return useQuery({
    queryKey: pollutionCategoryKeys.catalog(),
    queryFn: () => fetchCatalogPollutionCategories(),
    select: envelope => envelope.data.items,
    staleTime: CATALOG_STALE_MS,
    enabled,
  });
}

function useInvalidatePollutionCategories() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: pollutionCategoryKeys.all });
  };
}

export function useCreatePollutionCategory() {
  const invalidate = useInvalidatePollutionCategories();
  return useMutation({
    mutationFn: (body: CreatePollutionCategoryInput) => createPollutionCategory(body),
    onSuccess: () => invalidate(),
  });
}

export function useUpdatePollutionCategory() {
  const invalidate = useInvalidatePollutionCategories();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePollutionCategoryInput }) =>
      updatePollutionCategory(id, body),
    onSuccess: () => invalidate(),
  });
}

export function useArchivePollutionCategory() {
  const invalidate = useInvalidatePollutionCategories();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ArchivePollutionCategoryInput }) =>
      archivePollutionCategory(id, body),
    onSuccess: () => invalidate(),
  });
}

export function useDeletePollutionCategory() {
  const invalidate = useInvalidatePollutionCategories();
  return useMutation({
    mutationFn: (id: string) => deletePollutionCategory(id),
    onSuccess: () => invalidate(),
  });
}
