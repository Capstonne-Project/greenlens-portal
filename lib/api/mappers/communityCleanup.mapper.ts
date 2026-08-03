import type {
  CommunityCleanupEventDetailDto,
  CommunityCleanupListItemDto,
  CommunityCleanupListResponseDto,
  CommunityCleanupParticipantDto,
  CommunityCleanupParticipantsResponseDto,
  CommunityCleanupQueueStatsResponseDto,
  PaginationMetaDto,
} from '@/lib/api/dto/communityCleanup.dto';
import type {
  CommunityCleanupEventDetail,
  CommunityCleanupList,
  CommunityCleanupListItem,
  CommunityCleanupParticipant,
  CommunityCleanupParticipantsList,
  CommunityCleanupQueueStats,
  PaginationMeta,
} from '@/lib/api/models/communityCleanup';

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
    progressNote: dto.progressNote,
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
    media: {
      beforeImageUrls: dto.media.beforeImageUrls,
      progressImageUrls: dto.media.progressImageUrls,
      afterImageUrls: dto.media.afterImageUrls,
    },
  };
}

export function mapPaginationMetaDto(dto: PaginationMetaDto): PaginationMeta {
  return {
    page: dto.page,
    pageSize: dto.pageSize,
    totalItems: dto.totalItems,
    totalPages: dto.totalPages,
    hasNext: dto.hasNext,
    hasPrev: dto.hasPrev,
  };
}

export function mapCommunityCleanupListItemDto(
  dto: CommunityCleanupListItemDto
): CommunityCleanupListItem {
  return {
    id: dto.id,
    reportId: dto.reportId,
    reportCode: dto.reportCode,
    status: dto.status,
    title: dto.title,
    leaderUserId: dto.leaderUserId,
    leaderFullName: dto.leaderFullName,
    startsAt: dto.startsAt,
    joinClosesAt: dto.joinClosesAt,
    maxParticipants: dto.maxParticipants,
    participantCount: dto.participantCount,
    spotsLeft: dto.spotsLeft,
    progressPercent: dto.progressPercent,
    reportLatitude: dto.reportLatitude,
    reportLongitude: dto.reportLongitude,
    thumbnailUrl: dto.thumbnailUrl,
  };
}

export function mapCommunityCleanupListResponseDto(
  dto: CommunityCleanupListResponseDto
): CommunityCleanupList {
  return {
    items: dto.items.map(mapCommunityCleanupListItemDto),
    pagination: mapPaginationMetaDto(dto.pagination),
  };
}

export function mapCommunityCleanupParticipantDto(
  dto: CommunityCleanupParticipantDto
): CommunityCleanupParticipant {
  return {
    userId: dto.userId,
    fullName: dto.fullName,
    avatarUrl: dto.avatarUrl,
    role: dto.role,
    status: dto.status,
    joinedAt: dto.joinedAt,
    checkedInAt: dto.checkedInAt,
  };
}

export function mapCommunityCleanupParticipantsResponseDto(
  dto: CommunityCleanupParticipantsResponseDto
): CommunityCleanupParticipantsList {
  return {
    items: dto.items.map(mapCommunityCleanupParticipantDto),
    pagination: mapPaginationMetaDto(dto.pagination),
  };
}

export function mapCommunityCleanupQueueStatsResponseDto(
  dto: CommunityCleanupQueueStatsResponseDto
): CommunityCleanupQueueStats {
  const countsByStatus: CommunityCleanupQueueStats['countsByStatus'] = {};
  for (const entry of dto.countsByStatus) {
    countsByStatus[entry.status] = entry.count;
  }
  return {
    countsByStatus,
    totalParticipants: dto.totalParticipants,
    totalMediaCount: dto.totalMediaCount,
  };
}
