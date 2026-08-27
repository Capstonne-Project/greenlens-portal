/**
 * L2 — Community Cleanup (chương trình dọn cộng đồng).
 */
import {
  adaptCancelCommunityCleanup,
  adaptCreateCommunityCleanup,
  adaptGetCommunityCleanupDetail,
  adaptGetCommunityCleanupParticipants,
  adaptGetOfficeCommunityQueue,
  adaptGetOfficeCommunityQueueStats,
  adaptGetPublicCommunityCleanup,
  adaptGetReportCommunityCleanup,
  adaptRejectCommunityVerification,
  adaptShareCommunityCleanupFacebookPage,
  adaptVerifyCommunityCleanup,
} from '@/lib/api/adapters/communityCleanup.adapter';
import type {
  CommunityCleanupEventDetail,
  CommunityCleanupFacebookPageShareResult,
  CommunityCleanupList,
  CommunityCleanupOfficeQueueParams,
  CommunityCleanupParticipantsList,
  CommunityCleanupPublicPreview,
  CommunityCleanupQueueStats,
  CreateCommunityCleanupInput,
} from '@/lib/api/models/communityCleanup';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  CommunityCleanupEventDetail,
  CommunityCleanupFacebookPageShareResult,
  CommunityCleanupLeader,
  CommunityCleanupList,
  CommunityCleanupListItem,
  CommunityCleanupMediaSummary,
  CommunityCleanupMyParticipation,
  CommunityCleanupOfficeQueueParams,
  CommunityCleanupParticipant,
  CommunityCleanupParticipantsList,
  CommunityCleanupPublicPreview,
  CommunityCleanupQueueStats,
  CommunityCleanupShare,
  CommunityCleanupStatus,
  CreateCommunityCleanupInput,
  PaginationMeta,
} from '@/lib/api/models/communityCleanup';

/** POST /v1/reports/{reportId}/community-cleanups — [LEO] mở chương trình dọn cộng đồng. */
export async function createCommunityCleanup(
  reportId: string,
  body: CreateCommunityCleanupInput
): Promise<ApiEnvelope<CommunityCleanupEventDetail>> {
  return adaptCreateCommunityCleanup(reportId, body);
}

/**
 * GET /v1/reports/{reportId}/community-cleanup — chương trình active của report.
 * BR-CMU-003: `data=null` nếu chưa có — không phải lỗi.
 */
export async function getReportCommunityCleanup(
  reportId: string
): Promise<ApiEnvelope<CommunityCleanupEventDetail | null>> {
  return adaptGetReportCommunityCleanup(reportId);
}

/** GET /v1/community-cleanups/office-queue — [LEO] hàng đợi chương trình cộng đồng. */
export async function getOfficeCommunityQueue(
  params?: CommunityCleanupOfficeQueueParams
): Promise<ApiEnvelope<CommunityCleanupList>> {
  return adaptGetOfficeCommunityQueue(params);
}

/** GET /v1/community-cleanups/{eventId} — chi tiết chương trình. */
export async function getCommunityCleanupDetail(
  eventId: string
): Promise<ApiEnvelope<CommunityCleanupEventDetail>> {
  return adaptGetCommunityCleanupDetail(eventId);
}

/** GET /v1/community-cleanups/{eventId}/participants — danh sách participant. */
export async function getCommunityCleanupParticipants(
  eventId: string,
  params?: { page?: number; pageSize?: number }
): Promise<ApiEnvelope<CommunityCleanupParticipantsList>> {
  return adaptGetCommunityCleanupParticipants(eventId, params);
}

/** GET /v1/community-cleanups/office-queue/stats — [LEO] thống kê hàng đợi theo office. */
export async function getOfficeCommunityQueueStats(): Promise<
  ApiEnvelope<CommunityCleanupQueueStats>
> {
  return adaptGetOfficeCommunityQueueStats();
}

/** POST /v1/community-cleanups/{eventId}/verify — [LEO] duyệt xác thực hoàn thành. */
export async function verifyCommunityCleanup(eventId: string): Promise<void> {
  return adaptVerifyCommunityCleanup(eventId);
}

/** POST /v1/community-cleanups/{eventId}/reject-verification — [LEO] từ chối xác thực. */
export async function rejectCommunityVerification(eventId: string, reason: string): Promise<void> {
  return adaptRejectCommunityVerification(eventId, reason);
}

/** POST /v1/community-cleanups/{eventId}/cancel — [LEO] hủy chương trình. */
export async function cancelCommunityCleanup(eventId: string, reason: string): Promise<void> {
  return adaptCancelCommunityCleanup(eventId, reason);
}

/**
 * GET /v1/public/community-cleanups/{eventId} — public preview for OG / share landing.
 * No Authorization required. Cancelled program → 404.
 */
export async function getPublicCommunityCleanup(
  eventId: string
): Promise<ApiEnvelope<CommunityCleanupPublicPreview>> {
  return adaptGetPublicCommunityCleanup(eventId);
}

/**
 * POST /v1/community-cleanups/{eventId}/share/facebook-page —
 * [LEO] đăng chương trình lên Facebook Page.
 */
export async function shareCommunityCleanupFacebookPage(
  eventId: string
): Promise<ApiEnvelope<CommunityCleanupFacebookPageShareResult>> {
  return adaptShareCommunityCleanupFacebookPage(eventId);
}

const communityCleanupService = {
  createCommunityCleanup,
  getReportCommunityCleanup,
  getOfficeCommunityQueue,
  getOfficeCommunityQueueStats,
  getCommunityCleanupDetail,
  getCommunityCleanupParticipants,
  getPublicCommunityCleanup,
  shareCommunityCleanupFacebookPage,
  verifyCommunityCleanup,
  rejectCommunityVerification,
  cancelCommunityCleanup,
};

export default communityCleanupService;
