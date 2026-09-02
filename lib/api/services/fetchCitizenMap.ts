import {
  adaptCitizenMapProvinces,
  adaptCitizenMapWardReports,
  adaptCitizenMapWards,
} from '@/lib/api/adapters/citizenMap.adapter';
import type {
  CitizenMapProvince,
  CitizenMapWardReports,
  CitizenMapWards,
} from '@/lib/api/models/citizenMap';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  CitizenMapProvince,
  CitizenMapWard,
  CitizenMapWardReportPin,
  CitizenMapWardReports,
  CitizenMapWardRiskLevel,
  CitizenMapWards,
} from '@/lib/api/models/citizenMap';

/** Bước 1: toàn bộ tỉnh/thành kèm boundary GeoJSON. */
export async function fetchCitizenMapProvinces(): Promise<ApiEnvelope<CitizenMapProvince[]>> {
  return adaptCitizenMapProvinces();
}

/** Bước 2: phường/xã của 1 tỉnh, kèm boundary + mức rủi ro 5 cấp (màu do BE tính). */
export async function fetchCitizenMapWards(
  provinceCode: string
): Promise<ApiEnvelope<CitizenMapWards>> {
  return adaptCitizenMapWards(provinceCode);
}

/** Bước 3: điểm báo cáo ô nhiễm thuộc 1 phường/xã đã chọn. */
export async function fetchCitizenMapWardReports(
  wardCode: string
): Promise<ApiEnvelope<CitizenMapWardReports>> {
  return adaptCitizenMapWardReports(wardCode);
}

export default {
  fetchCitizenMapProvinces,
  fetchCitizenMapWards,
  fetchCitizenMapWardReports,
};
