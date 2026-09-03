'use client';

import { officerKeys } from '@/hooks/useOfficer';
import { leoOfficesKeys } from '@/hooks/useLeoOffices';
import { useProtectedQueryEnabled } from '@/hooks/useAuthSession';
import {
  cancelCommunityCleanup,
  createCommunityCleanup,
  getCommunityCleanupDetail,
  getCommunityCleanupParticipants,
  getOfficeCommunityQueue,
  getOfficeCommunityQueueStats,
  getPublicCommunityCleanup,
  getReportCommunityCleanup,
  rejectCommunityVerification,
  shareCommunityCleanupFacebookPage,
  verifyCommunityCleanup,
} from '@/lib/api/services/fetchCommunityCleanup';
import type {
  CommunityCleanupOfficeQueueParams,
  CreateCommunityCleanupInput,
} from '@/lib/api/models/communityCleanup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Query keys — chương trình dọn cộng đồng (Community Cleanup). */
export const communityCleanupKeys = {
  all: ['community-cleanups'] as const,
  queue: (params?: CommunityCleanupOfficeQueueParams) =>
    [...communityCleanupKeys.all, 'office-queue', params ?? {}] as const,
  queueStats: () => [...communityCleanupKeys.all, 'office-queue-stats'] as const,
  detail: (eventId: string) => [...communityCleanupKeys.all, 'detail', eventId] as const,
  publicPreview: (eventId: string) =>
    [...communityCleanupKeys.all, 'public-preview', eventId] as const,
  byReport: (reportId: string) => [...communityCleanupKeys.all, 'by-report', reportId] as const,
  participants: (eventId: string, page?: number) =>
    [...communityCleanupKeys.all, 'participants', eventId, page ?? 1] as const,
};

const QUEUE_STALE_MS = 60 * 1000;
const QUEUE_STATS_STALE_MS = 3 * 60 * 1000;
const DETAIL_STALE_MS = 60 * 1000;
const PARTICIPANTS_STALE_MS = 3 * 60 * 1000;

/** Poll danh sách participant trên màn detail LEO — badge check-in cập nhật không cần reload. */
export const COMMUNITY_CLEANUP_PARTICIPANTS_POLL_MS = 2_000;

/** POST /v1/reports/{reportId}/community-cleanups — [LEO] mở chương trình dọn cộng đồng. */
export function useCreateCommunityCleanup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, body }: { reportId: string; body: CreateCommunityCleanupInput }) =>
      createCommunityCleanup(reportId, body),
    onSuccess: (_data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: officerKeys.queue() });
      queryClient.invalidateQueries({ queryKey: communityCleanupKeys.byReport(reportId) });
      queryClient.invalidateQueries({ queryKey: communityCleanupKeys.all });
    },
  });
}

/** GET /v1/reports/{reportId}/community-cleanup — chương trình active của report (data null nếu chưa có). */
export function useReportCommunityCleanup(reportId: string, options?: { enabled?: boolean }) {
  const canFetch = useProtectedQueryEnabled(
    (options?.enabled ?? Boolean(reportId)) && Boolean(reportId)
  );
  return useQuery({
    queryKey: communityCleanupKeys.byReport(reportId),
    queryFn: async () => (await getReportCommunityCleanup(reportId)).data,
    staleTime: DETAIL_STALE_MS,
    enabled: canFetch,
  });
}

/** GET /v1/community-cleanups/office-queue — [LEO] hàng đợi chương trình cộng đồng. */
export function useOfficeCommunityQueue(
  params?: CommunityCleanupOfficeQueueParams,
  options?: { enabled?: boolean }
) {
  const canFetch = useProtectedQueryEnabled(options?.enabled ?? true);
  return useQuery({
    queryKey: communityCleanupKeys.queue(params),
    queryFn: async () => (await getOfficeCommunityQueue(params)).data,
    staleTime: QUEUE_STALE_MS,
    enabled: canFetch,
  });
}

/** GET /v1/community-cleanups/office-queue/stats — [LEO] thống kê hàng đợi theo office. */
export function useOfficeCommunityQueueStats(options?: { enabled?: boolean }) {
  const canFetch = useProtectedQueryEnabled(options?.enabled ?? true);
  return useQuery({
    queryKey: communityCleanupKeys.queueStats(),
    queryFn: async () => (await getOfficeCommunityQueueStats()).data,
    staleTime: QUEUE_STATS_STALE_MS,
    enabled: canFetch,
  });
}

/** GET /v1/community-cleanups/{eventId} — chi tiết chương trình. */
export function useCommunityCleanupDetail(eventId: string, options?: { enabled?: boolean }) {
  const canFetch = useProtectedQueryEnabled(
    (options?.enabled ?? Boolean(eventId)) && Boolean(eventId)
  );
  return useQuery({
    queryKey: communityCleanupKeys.detail(eventId),
    queryFn: async () => (await getCommunityCleanupDetail(eventId)).data,
    staleTime: DETAIL_STALE_MS,
    enabled: canFetch,
  });
}

/** GET /v1/public/community-cleanups/{eventId} — preview public (OG / landing). Cancelled → 404. */
export function usePublicCommunityCleanup(eventId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: communityCleanupKeys.publicPreview(eventId),
    queryFn: async () => (await getPublicCommunityCleanup(eventId)).data,
    staleTime: 3 * 60 * 1000,
    enabled: options?.enabled ?? Boolean(eventId),
    retry: 1,
  });
}

/** GET /v1/community-cleanups/{eventId}/participants — danh sách participant đầy đủ. */
export function useCommunityCleanupParticipants(
  eventId: string,
  params?: { page?: number; pageSize?: number },
  options?: {
    enabled?: boolean;
    /** Poll interval (ms). `false` tắt polling. */
    refetchInterval?: number | false;
  }
) {
  const canFetch = useProtectedQueryEnabled(
    (options?.enabled ?? Boolean(eventId)) && Boolean(eventId)
  );
  return useQuery({
    queryKey: communityCleanupKeys.participants(eventId, params?.page),
    queryFn: async () => (await getCommunityCleanupParticipants(eventId, params)).data,
    staleTime: PARTICIPANTS_STALE_MS,
    enabled: canFetch,
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
  });
}

/** POST /v1/community-cleanups/{eventId}/verify — [LEO] duyệt xác thực → Completed. */
export function useVerifyCommunityCleanup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => verifyCommunityCleanup(eventId),
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({ queryKey: communityCleanupKeys.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: communityCleanupKeys.all });
    },
  });
}

/** POST /v1/community-cleanups/{eventId}/reject-verification — [LEO] từ chối xác thực → InProgress. */
export function useRejectCommunityVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, reason }: { eventId: string; reason: string }) =>
      rejectCommunityVerification(eventId, reason),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: communityCleanupKeys.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: communityCleanupKeys.all });
    },
  });
}

/** POST /v1/community-cleanups/{eventId}/cancel — [LEO] hủy chương trình. */
export function useCancelCommunityCleanup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, reason }: { eventId: string; reason: string }) =>
      cancelCommunityCleanup(eventId, reason),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: communityCleanupKeys.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: communityCleanupKeys.all });
    },
  });
}

/**
 * POST /v1/community-cleanups/{eventId}/share/facebook-page —
 * [LEO] đăng chương trình lên Facebook Page (ảnh + caption).
 */
export function useShareCommunityCleanupFacebookPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => shareCommunityCleanupFacebookPage(eventId),
    onSuccess: (_data, eventId) => {
      void queryClient.invalidateQueries({ queryKey: communityCleanupKeys.detail(eventId) });
    },
  });
}
