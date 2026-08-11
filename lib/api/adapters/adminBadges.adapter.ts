import type {
  AdminBadgeListDataDto,
  ToggleAdminBadgeBodyDto,
  UpdateAdminBadgeBodyDto,
} from '@/lib/api/dto/adminBadge.dto';
import { mapAdminBadgeListDataDto } from '@/lib/api/mappers/adminBadge.mapper';
import type {
  AdminBadgeList,
  AdminBadgesParams,
  ToggleAdminBadgeInput,
  UpdateAdminBadgeInput,
} from '@/lib/api/models/adminBadge';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

function buildAdminBadgesQuery(
  params?: AdminBadgesParams
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

/** GET /v1/admin/badges — phân trang, search, isActive, sort. */
export async function adaptAdminBadges(
  params?: AdminBadgesParams
): Promise<ApiEnvelope<AdminBadgeList>> {
  const res = await apiService.get<ApiEnvelope<AdminBadgeListDataDto>>(
    '/v1/admin/badges',
    buildAdminBadgesQuery(params)
  );
  return mapApiEnvelope(res.data, mapAdminBadgeListDataDto);
}

export async function adaptUpdateAdminBadge(
  id: string,
  body: UpdateAdminBadgeInput
): Promise<void> {
  const payload: UpdateAdminBadgeBodyDto = {
    nameVi: body.nameVi.trim(),
    nameEn: body.nameEn.trim(),
    ...(body.description?.trim() ? { description: body.description.trim() } : {}),
    ...(body.iconUrl?.trim() ? { iconUrl: body.iconUrl.trim() } : {}),
  };
  await apiService.put(`/v1/admin/badges/${encodeURIComponent(id)}`, payload);
}

export async function adaptToggleAdminBadge(
  id: string,
  body: ToggleAdminBadgeInput
): Promise<void> {
  const payload: ToggleAdminBadgeBodyDto = { isActive: body.isActive };
  await apiService.patch(`/v1/admin/badges/${encodeURIComponent(id)}/toggle`, payload);
}
