import type {
  ArchivePollutionCategoryBodyDto,
  CreatePollutionCategoryBodyDto,
  PollutionCategoryListDataDto,
  PollutionCategoryMutationDto,
  UpdatePollutionCategoryBodyDto,
} from '@/lib/api/dto/pollutionCategory.dto';
import {
  mapPollutionCategoryListDataDto,
  mapPollutionCategoryMutationDto,
} from '@/lib/api/mappers/pollutionCategory.mapper';
import type {
  ArchivePollutionCategoryInput,
  CreatePollutionCategoryInput,
  PollutionCategoryList,
  PollutionCategoryMutationResult,
  UpdatePollutionCategoryInput,
} from '@/lib/api/models/pollutionCategory';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

export interface AdminPollutionCategoriesParams {
  /** true = chỉ lưu trữ, false = chỉ đang dùng, undefined = tất cả */
  archived?: boolean;
}

export async function adaptCatalogPollutionCategories(): Promise<
  ApiEnvelope<PollutionCategoryList>
> {
  const res = await apiService.get<ApiEnvelope<PollutionCategoryListDataDto>>(
    '/v1/catalog/pollution-categories'
  );
  return mapApiEnvelope(res.data, mapPollutionCategoryListDataDto);
}

export async function adaptAdminPollutionCategories(
  params?: AdminPollutionCategoriesParams
): Promise<ApiEnvelope<PollutionCategoryList>> {
  const query: Record<string, boolean> = {};
  if (params?.archived === true) query.archived = true;
  if (params?.archived === false) query.archived = false;

  try {
    const res = await apiService.get<ApiEnvelope<PollutionCategoryListDataDto>>(
      '/v1/admin/pollution-categories',
      query
    );
    return mapApiEnvelope(res.data, mapPollutionCategoryListDataDto);
  } catch {
    const catalog = await adaptCatalogPollutionCategories();
    let items = catalog.data.items;
    if (params?.archived === true) items = [];
    if (params?.archived === false) items = items.filter(i => !i.isArchived);
    return { ...catalog, data: { items } };
  }
}

export async function adaptCreatePollutionCategory(
  body: CreatePollutionCategoryInput
): Promise<ApiEnvelope<PollutionCategoryMutationResult>> {
  const payload: CreatePollutionCategoryBodyDto = {
    code: body.code.trim().toUpperCase(),
    nameVi: body.nameVi.trim(),
    nameEn: body.nameEn.trim(),
    ...(body.iconUrl?.trim() ? { iconUrl: body.iconUrl.trim() } : {}),
  };
  const res = await apiService.post<ApiEnvelope<PollutionCategoryMutationDto>>(
    '/v1/admin/pollution-categories',
    payload
  );
  return mapApiEnvelope(res.data, mapPollutionCategoryMutationDto);
}

export async function adaptUpdatePollutionCategory(
  id: string,
  body: UpdatePollutionCategoryInput
): Promise<void> {
  const payload: UpdatePollutionCategoryBodyDto = {
    nameVi: body.nameVi.trim(),
    nameEn: body.nameEn.trim(),
    ...(body.iconUrl?.trim() ? { iconUrl: body.iconUrl.trim() } : {}),
  };
  await apiService.put(`/v1/admin/pollution-categories/${id}`, payload);
}

export async function adaptArchivePollutionCategory(
  id: string,
  body: ArchivePollutionCategoryInput
): Promise<void> {
  const payload: ArchivePollutionCategoryBodyDto = { archive: body.archive };
  await apiService.put(`/v1/admin/pollution-categories/${id}/archive`, payload);
}

export async function adaptDeletePollutionCategory(id: string): Promise<void> {
  await apiService.delete(`/v1/admin/pollution-categories/${id}`);
}
