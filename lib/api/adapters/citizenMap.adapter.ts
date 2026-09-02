import apiService from '@/lib/api/core';
import type {
  CitizenMapProvincesDataDto,
  CitizenMapWardReportsDataDto,
  CitizenMapWardsDataDto,
} from '@/lib/api/dto/citizenMap.dto';
import {
  mapCitizenMapProvincesDataDto,
  mapCitizenMapWardReportsDataDto,
  mapCitizenMapWardsDataDto,
} from '@/lib/api/mappers/citizenMap.mapper';
import type {
  CitizenMapProvince,
  CitizenMapWardReports,
  CitizenMapWards,
} from '@/lib/api/models/citizenMap';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

/** GET /v1/citizen-map/provinces — bước 1, toàn quốc kèm boundary. */
export async function adaptCitizenMapProvinces(): Promise<ApiEnvelope<CitizenMapProvince[]>> {
  const res = await apiService.get<ApiEnvelope<CitizenMapProvincesDataDto>>(
    '/v1/citizen-map/provinces'
  );
  return mapApiEnvelope(res.data, mapCitizenMapProvincesDataDto);
}

/** GET /v1/citizen-map/provinces/{provinceCode}/wards — bước 2, drill-down phường/xã + level màu. */
export async function adaptCitizenMapWards(
  provinceCode: string
): Promise<ApiEnvelope<CitizenMapWards>> {
  const code = provinceCode.trim();
  const res = await apiService.get<ApiEnvelope<CitizenMapWardsDataDto>>(
    `/v1/citizen-map/provinces/${encodeURIComponent(code)}/wards`
  );
  return mapApiEnvelope(res.data, mapCitizenMapWardsDataDto);
}

/** GET /v1/citizen-map/wards/{wardCode}/reports — bước 3, điểm báo cáo trong phường đã chọn. */
export async function adaptCitizenMapWardReports(
  wardCode: string
): Promise<ApiEnvelope<CitizenMapWardReports>> {
  const code = wardCode.trim();
  const res = await apiService.get<ApiEnvelope<CitizenMapWardReportsDataDto>>(
    `/v1/citizen-map/wards/${encodeURIComponent(code)}/reports`
  );
  return mapApiEnvelope(res.data, mapCitizenMapWardReportsDataDto);
}
