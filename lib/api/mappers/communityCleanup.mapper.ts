import type { CommunityCleanupEventDetailDto } from '@/lib/api/dto/communityCleanup.dto';
import type { CommunityCleanupEventDetail } from '@/lib/api/models/communityCleanup';

export function mapCommunityCleanupEventDetailDto(
  dto: CommunityCleanupEventDetailDto
): CommunityCleanupEventDetail {
  return {
    id: dto.id,
    reportId: dto.reportId,
    reportCode: dto.reportCode,
    status: dto.status,
    title: dto.title,
    description: dto.description,
    leader: {
      userId: dto.leader.userId,
      fullName: dto.leader.fullName,
      teamId: dto.leader.teamId,
      teamName: dto.leader.teamName,
    },
    joinOpensAt: dto.joinOpensAt,
    joinClosesAt: dto.joinClosesAt,
    startsAt: dto.startsAt,
    endsAt: dto.endsAt,
    maxParticipants: dto.maxParticipants,
    participantCount: dto.participantCount,
    spotsLeft: dto.spotsLeft,
    progressPercent: dto.progressPercent,
    meetingNote: dto.meetingNote,
    meetingLatitude: dto.meetingLatitude,
    meetingLongitude: dto.meetingLongitude,
    reportLatitude: dto.reportLatitude,
    reportLongitude: dto.reportLongitude,
    reportAddress: dto.reportAddress,
    categoryName: dto.categoryName,
    thumbnailUrl: dto.thumbnailUrl,
    isLeader: dto.isLeader,
    mediaSummary: {
      beforeCount: dto.mediaSummary.beforeCount,
      progressCount: dto.mediaSummary.progressCount,
      afterCount: dto.mediaSummary.afterCount,
    },
  };
}
