import { adaptProvinces, adaptWardsByProvince } from '@/lib/api/adapters/catalog.adapter';
import type { Province, Ward } from '@/lib/api/models/location';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type { Province, Ward } from '@/lib/api/models/location';

export async function fetchProvinces(): Promise<ApiEnvelope<Province[]>> {
  return adaptProvinces();
}

export async function fetchWardsByProvince(provinceCode: string): Promise<ApiEnvelope<Ward[]>> {
  return adaptWardsByProvince(provinceCode);
}

export default { fetchProvinces, fetchWardsByProvince };
