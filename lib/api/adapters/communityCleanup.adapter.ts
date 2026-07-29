import type {
  CommunityCleanupEventDetailDto,
  CreateCommunityCleanupBodyDto,
} from '@/lib/api/dto/communityCleanup.dto';
import { mapCommunityCleanupEventDetailDto } from '@/lib/api/mappers/communityCleanup.mapper';
import type {
  CommunityCleanupEventDetail,
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
