'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchCitizenMapProvinces,
  fetchCitizenMapWardReports,
  fetchCitizenMapWards,
} from '@/lib/api/services/fetchCitizenMap';

export const citizenMapKeys = {
  all: ['citizen-map'] as const,
  provinces: () => [...citizenMapKeys.all, 'provinces'] as const,
  wards: (provinceCode: string) => [...citizenMapKeys.all, 'wards', provinceCode] as const,
  wardReports: (wardCode: string) => [...citizenMapKeys.all, 'ward-reports', wardCode] as const,
};

/** Đổi ít — cache dài, không cần refetch khi người dùng qua lại giữa các tỉnh. */
const PROVINCES_STALE_MS = 30 * 60 * 1000;
const WARDS_STALE_MS = 5 * 60 * 1000;
const WARD_REPORTS_STALE_MS = 60 * 1000;

/** Bước 1: toàn quốc kèm boundary — gọi ngay khi vào trang /map. */
export function useCitizenMapProvinces() {
  return useQuery({
    queryKey: citizenMapKeys.provinces(),
    queryFn: () => fetchCitizenMapProvinces(),
    select: envelope => envelope.data,
    staleTime: PROVINCES_STALE_MS,
    retry: 1,
  });
}

/** Bước 2: phường/xã + mức rủi ro — chỉ gọi sau khi người dùng bấm chọn 1 tỉnh. */
export function useCitizenMapWards(provinceCode: string | null) {
  return useQuery({
    queryKey: citizenMapKeys.wards(provinceCode ?? ''),
    queryFn: () => fetchCitizenMapWards(provinceCode!),
    select: envelope => envelope.data,
    staleTime: WARDS_STALE_MS,
    enabled: Boolean(provinceCode),
    retry: 1,
  });
}

/** Bước 3: điểm báo cáo — chỉ gọi sau khi người dùng bấm chọn đúng 1 phường/xã cố định. */
export function useCitizenMapWardReports(wardCode: string | null) {
  return useQuery({
    queryKey: citizenMapKeys.wardReports(wardCode ?? ''),
    queryFn: () => fetchCitizenMapWardReports(wardCode!),
    select: envelope => envelope.data,
    staleTime: WARD_REPORTS_STALE_MS,
    enabled: Boolean(wardCode),
    retry: 1,
  });
}
