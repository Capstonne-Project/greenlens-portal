import type {
  ProvinceListDataDto,
  WardBoundaryDto,
  WardListDataDto,
} from '@/lib/api/dto/location.dto';
import { mapProvinceDto, mapWardBoundaryDto, mapWardDto } from '@/lib/api/mappers/location.mapper';
import type { Province, Ward, WardBoundary } from '@/lib/api/models/location';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '@/lib/api/core';

export async function adaptProvinces(): Promise<ApiEnvelope<Province[]>> {
  const res = await apiService.get<ApiEnvelope<ProvinceListDataDto>>('/v1/catalog/provinces');
  return mapApiEnvelope(res.data, data => data.items.map(mapProvinceDto));
}

export async function adaptWardsByProvince(provinceCode: string): Promise<ApiEnvelope<Ward[]>> {
  const code = provinceCode.trim();
  const res = await apiService.get<ApiEnvelope<WardListDataDto>>(
    `/v1/catalog/provinces/${encodeURIComponent(code)}/wards`
  );
  return mapApiEnvelope(res.data, data => data.items.map(mapWardDto));
}

/**
 * GET /v1/catalog/wards/{wardCode}/boundary — tra boundary theo `wardCode` đã biết trước (AllowAnonymous).
 * LEO map dùng `fetchLeoWardBoundary` (GET /v1/offices/my/ward-boundary) thay vì hàm này.
 */
export async function adaptWardBoundary(wardCode: string): Promise<ApiEnvelope<WardBoundary>> {
  const code = wardCode.trim();
  const res = await apiService.get<ApiEnvelope<WardBoundaryDto>>(
    `/v1/catalog/wards/${encodeURIComponent(code)}/boundary`
  );
  return mapApiEnvelope(res.data, mapWardBoundaryDto);
}
