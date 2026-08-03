import type {
  CommunityCleanupEventDetailDto,
  CommunityCleanupListResponseDto,
  CommunityCleanupParticipantsResponseDto,
  CommunityCleanupQueueStatsResponseDto,
  CommunityCleanupReasonBodyDto,
  CreateCommunityCleanupBodyDto,
} from '@/lib/api/dto/communityCleanup.dto';
import {
  mapCommunityCleanupEventDetailDto,
  mapCommunityCleanupListResponseDto,
  mapCommunityCleanupParticipantsResponseDto,
  mapCommunityCleanupQueueStatsResponseDto,
} from '@/lib/api/mappers/communityCleanup.mapper';
import type {
  CommunityCleanupEventDetail,
  CommunityCleanupList,
  CommunityCleanupOfficeQueueParams,
  CommunityCleanupParticipantsList,
  CommunityCleanupQueueStats,
  CreateCommunityCleanupInput,
} from '@/lib/api/models/communityCleanup';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

/** POST /v1/reports/{reportId}/community-cleanups — [LEO] mở chương trình dọn cộng đồng. */
export async function adaptCreateCommunityCleanup(
  reportId: string,
  body: CreateCommunityCleanupInput
): Promise<ApiEnvelope<CommunityCleanupEventDetail>> {
  const payload: CreateCommunityCleanupBodyDto = {
    title: body.title.trim(),
    ...(body.description?.trim() ? { description: body.description.trim() } : {}),
    leaderUserId: body.leaderUserId,
    startsAt: body.startsAt,
    ...(body.endsAt ? { endsAt: body.endsAt } : {}),
    ...(body.joinClosesAt ? { joinClosesAt: body.joinClosesAt } : {}),
    ...(body.maxParticipants != null ? { maxParticipants: body.maxParticipants } : {}),
    ...(body.meetingNote?.trim() ? { meetingNote: body.meetingNote.trim() } : {}),
    ...(body.meetingLatitude != null ? { meetingLatitude: body.meetingLatitude } : {}),
    ...(body.meetingLongitude != null ? { meetingLongitude: body.meetingLongitude } : {}),
  };

  const res = await apiService.post<ApiEnvelope<CommunityCleanupEventDetailDto>>(
    `/v1/reports/${reportId}/community-cleanups`,
    payload
  );
  return mapApiEnvelope(res.data, mapCommunityCleanupEventDetailDto);
}

/** GET /v1/community-cleanups/office-queue — [LEO] hàng đợi chương trình cộng đồng theo office. */
export async function adaptGetOfficeCommunityQueue(
  params?: CommunityCleanupOfficeQueueParams
): Promise<ApiEnvelope<CommunityCleanupList>> {
  const query: Record<string, string | number> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.status) query.status = params.status;

  const res = await apiService.get<ApiEnvelope<CommunityCleanupListResponseDto>>(
    '/v1/community-cleanups/office-queue',
    query
  );
  return mapApiEnvelope(res.data, mapCommunityCleanupListResponseDto);
}

/** GET /v1/community-cleanups/{eventId} — chi tiết chương trình. */
export async function adaptGetCommunityCleanupDetail(
  eventId: string
): Promise<ApiEnvelope<CommunityCleanupEventDetail>> {
  const res = await apiService.get<ApiEnvelope<CommunityCleanupEventDetailDto>>(
    `/v1/community-cleanups/${eventId}`
  );
  return mapApiEnvelope(res.data, mapCommunityCleanupEventDetailDto);
}

/** GET /v1/community-cleanups/{eventId}/participants — [Leader/LEO] danh sách participant. */
export async function adaptGetCommunityCleanupParticipants(
  eventId: string,
  params?: { page?: number; pageSize?: number }
): Promise<ApiEnvelope<CommunityCleanupParticipantsList>> {
  const query: Record<string, number> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;

  const res = await apiService.get<ApiEnvelope<CommunityCleanupParticipantsResponseDto>>(
    `/v1/community-cleanups/${eventId}/participants`,
    query
  );
  return mapApiEnvelope(res.data, mapCommunityCleanupParticipantsResponseDto);
}

/** GET /v1/community-cleanups/office-queue/stats — [LEO] thống kê hàng đợi theo office. */
export async function adaptGetOfficeCommunityQueueStats(): Promise<
  ApiEnvelope<CommunityCleanupQueueStats>
> {
  const res = await apiService.get<ApiEnvelope<CommunityCleanupQueueStatsResponseDto>>(
    '/v1/community-cleanups/office-queue/stats'
  );
  return mapApiEnvelope(res.data, mapCommunityCleanupQueueStatsResponseDto);
}

/** POST /v1/community-cleanups/{eventId}/verify — [LEO] duyệt xác thực hoàn thành. */
export async function adaptVerifyCommunityCleanup(eventId: string): Promise<void> {
  await apiService.post(`/v1/community-cleanups/${eventId}/verify`);
}

/** POST /v1/community-cleanups/{eventId}/reject-verification — [LEO] từ chối xác thực (≥20 ký tự). */
export async function adaptRejectCommunityVerification(
  eventId: string,
  reason: string
): Promise<void> {
  const payload: CommunityCleanupReasonBodyDto = { reason: reason.trim() };
  await apiService.post(`/v1/community-cleanups/${eventId}/reject-verification`, payload);
}

/** POST /v1/community-cleanups/{eventId}/cancel — [LEO] hủy chương trình (≥20 ký tự). */
export async function adaptCancelCommunityCleanup(eventId: string, reason: string): Promise<void> {
  const payload: CommunityCleanupReasonBodyDto = { reason: reason.trim() };
  await apiService.post(`/v1/community-cleanups/${eventId}/cancel`, payload);
}
