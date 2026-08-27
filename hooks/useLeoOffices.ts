'use client';

import {
  fetchLeoMyReports,
  fetchLeoWardBoundary,
  fetchOfficeStaff,
  lookupOfficeStaff,
  recruitOfficeStaff,
  releaseOfficeStaff,
} from '@/lib/api/services/fetchOffice';
import { extractApiErrorCode } from '@/lib/api/core';
import type {
  LeoMyReportsParams,
  LeoMyReportsStatus,
  OfficeStaffListParams,
  RecruitOfficeStaffInput,
} from '@/lib/api/models/office';
import { teamKeys } from '@/hooks/useTeams';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const leoOfficesKeys = {
  all: ['officer', 'leo'] as const,
  myReports: () => [...leoOfficesKeys.all, 'my-reports'] as const,
  reportsList: (params: LeoMyReportsParams) => {
    const { status, ...rest } = params;
    const statusKey = status == null ? null : Array.isArray(status) ? [...status].sort() : status;
    return [...leoOfficesKeys.myReports(), { ...rest, status: statusKey }] as const;
  },
  myStaff: () => [...leoOfficesKeys.all, 'my-staff'] as const,
  staffList: (params: OfficeStaffListParams) => [...leoOfficesKeys.myStaff(), params] as const,
  staffLookup: (email: string) => [...leoOfficesKeys.myStaff(), 'lookup', email] as const,
  wardBoundary: () => [...leoOfficesKeys.all, 'ward-boundary'] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;
const LOOKUP_STALE_MS = 60 * 1000;

/**
 * Tab Phân công — GET /v1/offices/my/reports multi-status:
 * `?status=Verified&status=Rejected`.
 */
const ASSIGN_REPORT_STATUSES = [
  'Verified',
  'Rejected',
] as const satisfies readonly LeoMyReportsStatus[];

/**
 * Tab Theo dõi — multi-status `InProgress` + `Resolved`
 * (`?status=InProgress&status=Resolved`).
 */
export const LEO_TRACKING_REPORT_STATUSES = [
  'InProgress',
  'Resolved',
] as const satisfies readonly LeoMyReportsStatus[];

export type LeoTrackingReportStatus = (typeof LEO_TRACKING_REPORT_STATUSES)[number];

/** Tra cứu `/officer/reports` — Rejected / Closed trên GET /v1/offices/my/reports. */
export const LEO_LOOKUP_REPORT_STATUSES = [
  'Rejected',
  'Closed',
] as const satisfies readonly LeoMyReportsStatus[];

export type LeoLookupReportStatus = (typeof LEO_LOOKUP_REPORT_STATUSES)[number];

type LeoAssignReportsParams = Omit<LeoMyReportsParams, 'status'>;

type LeoTrackingReportsParams = Omit<LeoMyReportsParams, 'status'> & {
  /** `all` = multi InProgress+Resolved một request; hoặc 1 status. */
  status?: LeoTrackingReportStatus | 'all';
};

type LeoLookupReportsParams = Omit<LeoMyReportsParams, 'status'> & {
  /**
   * `all` (mặc định) = multi `?status=Rejected&status=Closed`.
   * Hoặc 1 status / mảng status cụ thể.
   */
  status?: LeoLookupReportStatus | 'all' | readonly LeoLookupReportStatus[];
};

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

/**
 * Phân công LEO — GET /v1/offices/my/reports multi-status
 * ?status=Verified&status=Rejected. Pagination lấy trực tiếp từ BE.
 */
export function useLeoAssignReports(
  params: LeoAssignReportsParams,
  options?: { enabled?: boolean }
) {
  const query = useLeoMyReports(
    { ...params, status: ASSIGN_REPORT_STATUSES },
    { enabled: options?.enabled ?? true }
  );

  return {
    data: query.data,
    isPending: query.isPending,
    isError: query.isError,
  };
}

/**
 * Theo dõi LEO — InProgress + Resolved.
 * `status: 'all'` (mặc định): multi `?status=InProgress&status=Resolved`.
 * Status cụ thể: một request (reuse cache leoOfficesKeys.reportsList).
 */
export function useLeoTrackingReports(
  params: LeoTrackingReportsParams,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;
  const { status = 'all', ...rest } = params;
  const singleStatus = status !== 'all' ? status : null;

  const singleQuery = useLeoMyReports(
    { ...rest, status: singleStatus ?? 'InProgress' },
    { enabled: enabled && Boolean(singleStatus) }
  );

  const multiQuery = useLeoMyReports(
    { ...rest, status: LEO_TRACKING_REPORT_STATUSES },
    { enabled: enabled && !singleStatus }
  );

  if (singleStatus) {
    const isPending = singleQuery.isPending;
    return {
      data: singleQuery.data,
      isLoading: isPending,
      isPending,
      isError: singleQuery.isError,
    };
  }

  const isPending = multiQuery.isPending;
  return {
    data: multiQuery.data,
    isLoading: isPending,
    isPending,
    isError: multiQuery.isError,
  };
}

/**
 * Tra cứu báo cáo kết thúc — `Rejected` + `Closed` từ GET /v1/offices/my/reports.
 * `status: 'all'` (mặc định): multi `?status=Rejected&status=Closed`.
 * Status cụ thể: một request.
 */
export function useLeoLookupReports(
  params: LeoLookupReportsParams,
  options?: { enabled?: boolean }
) {
  const { status = 'all', ...rest } = params;
  const resolvedStatus = status === 'all' || status == null ? LEO_LOOKUP_REPORT_STATUSES : status;

  return useLeoMyReports({ ...rest, status: resolvedStatus }, options);
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

/**
 * GET /v1/offices/my/staff/lookup — tra cứu Citizen theo email (exact).
 * Gọi khi `email` hợp lệ; 404 → query error (`Không tìm thấy email`).
 */
export function useOfficeStaffLookup(email: string, options?: { enabled?: boolean }) {
  const trimmed = email.trim();
  return useQuery({
    queryKey: leoOfficesKeys.staffLookup(trimmed.toLowerCase()),
    queryFn: () => lookupOfficeStaff(trimmed),
    select: envelope => envelope.data,
    staleTime: LOOKUP_STALE_MS,
    retry: false,
    enabled: (options?.enabled ?? true) && Boolean(trimmed),
  });
}

/**
 * GET /v1/offices/my/ward-boundary — ranh giới phường LEO đang quản lý (suy từ JWT).
 * 404 `OFFICE_NOT_FOUND` (LEO chưa được gán office) không retry — coi như "chưa có boundary".
 */
export function useLeoWardBoundary(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: leoOfficesKeys.wardBoundary(),
    queryFn: () => fetchLeoWardBoundary(),
    select: envelope => envelope.data,
    staleTime: 30 * 60 * 1000,
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      if (extractApiErrorCode(error) === 'OFFICE_NOT_FOUND') return false;
      return failureCount < 1;
    },
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

/**
 * DELETE /v1/offices/my/staff/{userId}
 * [LEO] Release nhân sự về Citizen — gỡ khỏi phường/team, role → Citizen.
 */
export function useReleaseOfficeStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => releaseOfficeStaff(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myStaff() });
      void queryClient.invalidateQueries({ queryKey: teamKeys.all });
    },
  });
}
