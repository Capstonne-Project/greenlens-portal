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
  adaptRejectCommunityVerification,
  adaptVerifyCommunityCleanup,
} from '@/lib/api/adapters/communityCleanup.adapter';
import type {
  CommunityCleanupEventDetail,
  CommunityCleanupList,
  CommunityCleanupOfficeQueueParams,
  CommunityCleanupParticipantsList,
  CommunityCleanupQueueStats,
  CreateCommunityCleanupInput,
} from '@/lib/api/models/communityCleanup';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  CommunityCleanupEventDetail,
  CommunityCleanupLeader,
  CommunityCleanupList,
  CommunityCleanupListItem,
  CommunityCleanupMediaSummary,
  CommunityCleanupOfficeQueueParams,
  CommunityCleanupParticipant,
  CommunityCleanupParticipantsList,
  CommunityCleanupQueueStats,
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

const communityCleanupService = {
  createCommunityCleanup,
  getOfficeCommunityQueue,
  getOfficeCommunityQueueStats,
  getCommunityCleanupDetail,
  getCommunityCleanupParticipants,
  verifyCommunityCleanup,
  rejectCommunityVerification,
  cancelCommunityCleanup,
};

export default communityCleanupService;
