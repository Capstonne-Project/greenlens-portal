import type {
  ArchivePollutionCategoryBodyDto,
  CreatePollutionCategoryBodyDto,
  PollutionCategoryListDataDto,
  PollutionCategoryMutationDto,
  UpdatePollutionCategoryBodyDto,
} from '@/lib/api/dto/pollutionCategory.dto';
import {
  mapPollutionCategoryAdminListDataDto,
  mapPollutionCategoryListDataDto,
  mapPollutionCategoryMutationDto,
} from '@/lib/api/mappers/pollutionCategory.mapper';
import type {
  AdminPollutionCategoriesParams,
  ArchivePollutionCategoryInput,
  CreatePollutionCategoryInput,
  PollutionCategoryAdminList,
  PollutionCategoryList,
  PollutionCategoryMutationResult,
  UpdatePollutionCategoryInput,
} from '@/lib/api/models/pollutionCategory';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

function buildAdminPollutionCategoriesQuery(
  params?: AdminPollutionCategoriesParams
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.isActive !== undefined) query.isActive = params.isActive;
  if (params?.sortBy?.trim()) query.sortBy = params.sortBy.trim();
  if (params?.sortDesc !== undefined) query.sortDesc = params.sortDesc;
  return query;
}

/** GET /v1/catalog/pollution-categories — chỉ active (dropdown). */
export async function adaptCatalogPollutionCategories(): Promise<
  ApiEnvelope<PollutionCategoryList>
> {
  const res = await apiService.get<ApiEnvelope<PollutionCategoryListDataDto>>(
    '/v1/catalog/pollution-categories'
  );
  return mapApiEnvelope(res.data, mapPollutionCategoryListDataDto);
}

/** GET /v1/admin/pollution-categories — phân trang, search, isActive, sort. */
export async function adaptAdminPollutionCategories(
  params?: AdminPollutionCategoriesParams
): Promise<ApiEnvelope<PollutionCategoryAdminList>> {
  const res = await apiService.get<ApiEnvelope<PollutionCategoryListDataDto>>(
    '/v1/admin/pollution-categories',
    buildAdminPollutionCategoriesQuery(params)
  );
  return mapApiEnvelope(res.data, mapPollutionCategoryAdminListDataDto);
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
  await apiService.put(`/v1/admin/pollution-categories/${encodeURIComponent(id)}`, payload);
}

export async function adaptArchivePollutionCategory(
  id: string,
  body: ArchivePollutionCategoryInput
): Promise<void> {
  const payload: ArchivePollutionCategoryBodyDto = { archive: body.archive };
  await apiService.put(`/v1/admin/pollution-categories/${encodeURIComponent(id)}/archive`, payload);
}

export async function adaptDeletePollutionCategory(id: string): Promise<void> {
  await apiService.delete(`/v1/admin/pollution-categories/${encodeURIComponent(id)}`);
}
