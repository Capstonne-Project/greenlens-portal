import type {
  CreateWasteTagBodyDto,
  ToggleWasteTagBodyDto,
  UpdateWasteTagBodyDto,
  WasteTagCatalogDataDto,
  WasteTagListDataDto,
  WasteTagMutationDto,
} from '@/lib/api/dto/wasteTag.dto';
import {
  mapWasteTagCatalogDataDto,
  mapWasteTagListDataDto,
  mapWasteTagMutationDto,
} from '@/lib/api/mappers/wasteTag.mapper';
import type {
  CreateWasteTagInput,
  ToggleWasteTagInput,
  UpdateWasteTagInput,
  WasteTagList,
  WasteTagMutationResult,
} from '@/lib/api/models/wasteTag';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

export interface AdminWasteTagsParams {
  /** true = chỉ đang dùng, false = chỉ đã tắt, undefined = tất cả */
  isActive?: boolean;
}

function buildWasteTagsQuery(params?: AdminWasteTagsParams): Record<string, boolean> {
  const query: Record<string, boolean> = {};
  if (params?.isActive === true) query.isActive = true;
  if (params?.isActive === false) query.isActive = false;
  return query;
}

/** Catalog — tag active, sắp theo displayOrder (dropdown/chip). */
export async function adaptCatalogWasteTags(): Promise<ApiEnvelope<WasteTagList>> {
  const res = await apiService.get<ApiEnvelope<WasteTagCatalogDataDto>>('/v1/waste-tags');
  return mapApiEnvelope(res.data, mapWasteTagCatalogDataDto);
}

export async function adaptAdminWasteTags(
  params?: AdminWasteTagsParams
): Promise<ApiEnvelope<WasteTagList>> {
  if (params?.isActive !== false) {
    return adaptCatalogWasteTags();
  }

  const res = await apiService.get<ApiEnvelope<WasteTagListDataDto>>(
    '/v1/admin/waste-tags',
    buildWasteTagsQuery(params)
  );
  return mapApiEnvelope(res.data, mapWasteTagListDataDto);
}

export async function adaptCreateWasteTag(
  body: CreateWasteTagInput
): Promise<ApiEnvelope<WasteTagMutationResult>> {
  const payload: CreateWasteTagBodyDto = {
    code: body.code.trim().toUpperCase(),
    nameVi: body.nameVi.trim(),
    nameEn: body.nameEn.trim(),
    displayOrder: body.displayOrder,
    ...(body.iconUrl?.trim() ? { iconUrl: body.iconUrl.trim() } : {}),
    ...(body.description?.trim() ? { description: body.description.trim() } : {}),
  };
  const res = await apiService.post<ApiEnvelope<WasteTagMutationDto>>(
    '/v1/admin/waste-tags',
    payload
  );
  return mapApiEnvelope(res.data, mapWasteTagMutationDto);
}

export async function adaptUpdateWasteTag(id: string, body: UpdateWasteTagInput): Promise<void> {
  const payload: UpdateWasteTagBodyDto = {
    code: body.code.trim().toUpperCase(),
    nameVi: body.nameVi.trim(),
    nameEn: body.nameEn.trim(),
    displayOrder: body.displayOrder,
    ...(body.iconUrl?.trim() ? { iconUrl: body.iconUrl.trim() } : {}),
    ...(body.description?.trim() ? { description: body.description.trim() } : {}),
  };
  await apiService.put(`/v1/admin/waste-tags/${id}`, payload);
}

export async function adaptToggleWasteTag(id: string, body: ToggleWasteTagInput): Promise<void> {
  const payload: ToggleWasteTagBodyDto = { isActive: body.isActive };
  await apiService.patch(`/v1/admin/waste-tags/${id}/toggle`, payload);
}

/** DELETE /v1/admin/waste-tags/{id} — soft delete (vô hiệu hóa). */
export async function adaptDeleteWasteTag(id: string): Promise<void> {
  await apiService.delete(`/v1/admin/waste-tags/${encodeURIComponent(id)}`);
}
