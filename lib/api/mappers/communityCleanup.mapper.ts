import type {
  CommunityCleanupEventDetailDto,
  CommunityCleanupFacebookPageDto,
  CommunityCleanupFacebookPageShareResultDto,
  CommunityCleanupListItemDto,
  CommunityCleanupListResponseDto,
  CommunityCleanupMyParticipationDto,
  CommunityCleanupParticipantDto,
  CommunityCleanupParticipantsResponseDto,
  CommunityCleanupPublicPreviewDto,
  CommunityCleanupQueueStatsResponseDto,
  CommunityCleanupShareDto,
  PaginationMetaDto,
} from '@/lib/api/dto/communityCleanup.dto';
import type {
  CommunityCleanupEventDetail,
  CommunityCleanupFacebookPage,
  CommunityCleanupFacebookPageShareResult,
  CommunityCleanupList,
  CommunityCleanupListItem,
  CommunityCleanupMyParticipation,
  CommunityCleanupParticipant,
  CommunityCleanupParticipantsList,
  CommunityCleanupPublicPreview,
  CommunityCleanupQueueStats,
  CommunityCleanupShare,
  PaginationMeta,
} from '@/lib/api/models/communityCleanup';

export function mapCommunityCleanupMyParticipationDto(
  dto: CommunityCleanupMyParticipationDto
): CommunityCleanupMyParticipation {
  return {
    status: dto.status,
    joinedAt: dto.joinedAt,
    role: dto.role,
  };
}

export function mapCommunityCleanupShareDto(
  dto: CommunityCleanupShareDto | null | undefined
): CommunityCleanupShare {
  if (!dto) {
    return {
      url: '',
      caption: '',
      imageUrl: null,
      facebookShareUrl: '',
      twitterShareUrl: '',
      linkedInShareUrl: '',
      hashtags: [],
    };
  }
  return {
    url: dto.url ?? '',
    caption: dto.caption ?? '',
    imageUrl: dto.imageUrl ?? null,
    facebookShareUrl: dto.facebookShareUrl ?? '',
    twitterShareUrl: dto.twitterShareUrl ?? '',
    linkedInShareUrl: dto.linkedInShareUrl ?? '',
    hashtags: dto.hashtags ?? [],
  };
}

export function mapCommunityCleanupFacebookPageDto(
  dto: CommunityCleanupFacebookPageDto | null | undefined
): CommunityCleanupFacebookPage | null {
  if (!dto?.href?.trim()) return null;
  return {
    href: dto.href.trim(),
    label: dto.label?.trim() || 'Facebook Page',
    sharedAt: dto.sharedAt ?? '',
  };
}

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
    reportDescription: dto.reportDescription,
    reportImageUrls: dto.reportImageUrls,
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
    severity: dto.severity,
    thumbnailUrl: dto.thumbnailUrl,
    myParticipation: dto.myParticipation
      ? mapCommunityCleanupMyParticipationDto(dto.myParticipation)
      : null,
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
    share: mapCommunityCleanupShareDto(dto.share),
    facebookPage: mapCommunityCleanupFacebookPageDto(dto.facebookPage),
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

/** Maps public preview DTO — GET /v1/public/community-cleanups/{eventId}. */
export function mapCommunityCleanupPublicPreviewDto(
  dto: CommunityCleanupPublicPreviewDto
): CommunityCleanupPublicPreview {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    status: dto.status,
    startsAt: dto.startsAt,
    endsAt: dto.endsAt,
    joinClosesAt: dto.joinClosesAt,
    maxParticipants: dto.maxParticipants,
    participantCount: dto.participantCount,
    spotsLeft: dto.spotsLeft,
    meetingNote: dto.meetingNote,
    categoryName: dto.categoryName,
    reportAddress: dto.reportAddress,
    thumbnailUrl: dto.thumbnailUrl,
    share: mapCommunityCleanupShareDto(dto.share),
  };
}

/** Maps Facebook Page share result — POST .../share/facebook-page. */
export function mapCommunityCleanupFacebookPageShareResultDto(
  dto: CommunityCleanupFacebookPageShareResultDto
): CommunityCleanupFacebookPageShareResult {
  return {
    attempted: dto.attempted,
    success: dto.success,
    postId: dto.postId ?? null,
    pageUrl: dto.pageUrl ?? null,
    errorCode: dto.errorCode ?? null,
    errorMessage: dto.errorMessage ?? null,
  };
}
