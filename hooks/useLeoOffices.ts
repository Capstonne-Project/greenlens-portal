'use client';

import {
  fetchLeoMyReports,
  fetchOfficeStaff,
  recruitOfficeStaff,
} from '@/lib/api/services/fetchOffice';
import type {
  LeoMyReportsData,
  LeoMyReportsParams,
  LeoMyReportsStatus,
  OfficeStaffListParams,
  RecruitOfficeStaffInput,
} from '@/lib/api/models/office';
import { teamKeys } from '@/hooks/useTeams';
import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';

export const leoOfficesKeys = {
  all: ['officer', 'leo'] as const,
  myReports: () => [...leoOfficesKeys.all, 'my-reports'] as const,
  reportsList: (params: LeoMyReportsParams) => [...leoOfficesKeys.myReports(), params] as const,
  myStaff: () => [...leoOfficesKeys.all, 'my-staff'] as const,
  staffList: (params: OfficeStaffListParams) => [...leoOfficesKeys.myStaff(), params] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;

/** Trạng thái tab Phân công — BE chỉ nhận một `status`/request nên gọi song song rồi gộp. */
const ASSIGN_REPORT_STATUSES = [
  'Verified',
  'Rejected',
] as const satisfies readonly LeoMyReportsStatus[];

/**
 * GET /v1/offices/my/reports — LEO màn theo dõi báo cáo trong LocalOffice.
 * Trả về `LeoMyReportsData` (kèm `localOfficeName`, `wardName`, `assignments[]`).
 */
export function useLeoMyReports(params: LeoMyReportsParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: leoOfficesKeys.reportsList(params),
    queryFn: () => fetchLeoMyReports(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

type LeoAssignReportsParams = Omit<LeoMyReportsParams, 'status'>;

/**
 * Phân công LEO — gộp báo cáo `Verified` + `Rejected` trong một danh sách.
 * Gọi 2 request song song (mỗi status một request), merge và sort `createdAt` mới nhất.
 */
export function useLeoAssignReports(
  params: LeoAssignReportsParams,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;

  const queries = useQueries({
    queries: ASSIGN_REPORT_STATUSES.map(status => ({
      queryKey: leoOfficesKeys.reportsList({ ...params, status }),
      queryFn: () => fetchLeoMyReports({ ...params, status }),
      staleTime: LIST_STALE_MS,
      placeholderData: keepPreviousData,
      enabled,
    })),
  });

  const data = useMemo((): LeoMyReportsData | undefined => {
    const payloads = queries.map(q => q.data?.data).filter(Boolean) as LeoMyReportsData[];
    if (payloads.length === 0) return undefined;

    const base = payloads[0];
    const items = payloads
      .flatMap(p => p.items)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalItems = payloads.reduce((sum, p) => sum + p.pagination.totalItems, 0);
    const totalPages = Math.max(1, ...payloads.map(p => p.pagination.totalPages));
    const page = params.page ?? 1;

    return {
      ...base,
      items,
      pagination: {
        page,
        pageSize: params.pageSize ?? 10,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }, [queries, params.page, params.pageSize]);

  return {
    data,
    isPending: queries.some(q => q.isPending),
    isError: queries.some(q => q.isError),
  };
}

/**
 * GET /v1/offices/my/staff — danh sách Cleaner/Inspector trong LocalOffice.
 */
export function useOfficeStaffList(params: OfficeStaffListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: leoOfficesKeys.staffList(params),
    queryFn: () => fetchOfficeStaff(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

/** POST /v1/offices/my/staff — tuyển Citizen vào LocalOffice + đội. */
export function useRecruitOfficeStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RecruitOfficeStaffInput) => recruitOfficeStaff(body),
    onSuccess: (_data, body) => {
      void queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myStaff() });
      void queryClient.invalidateQueries({ queryKey: teamKeys.all });
      if (body.teamId) {
        void queryClient.invalidateQueries({ queryKey: teamKeys.detail(body.teamId) });
      }
    },
  });
}
