import type { ProvinceListDataDto, WardListDataDto } from '@/lib/api/dto/location.dto';
import { mapProvinceDto, mapWardDto } from '@/lib/api/mappers/location.mapper';
import type { Province, Ward } from '@/lib/api/models/location';
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
