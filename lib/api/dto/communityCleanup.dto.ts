/** Khớp BE `/v1/reports/{reportId}/community-cleanups` + `/v1/community-cleanups`. */

/** POST /v1/reports/{reportId}/community-cleanups */
export interface CreateCommunityCleanupBodyDto {
  title: string;
  description?: string;
  leaderUserId: string;
  startsAt: string;
  endsAt?: string;
  joinClosesAt?: string;
  maxParticipants?: number;
  meetingNote?: string;
  meetingLatitude?: number;
  meetingLongitude?: number;
}

export type CommunityCleanupStatusDto =
  | 'OpenForJoin'
  | 'JoinClosed'
  | 'InProgress'
  | 'PendingVerification'
  | 'Completed'
  | 'Cancelled';

export interface CommunityCleanupLeaderDto {
  userId: string;
  fullName: string;
  teamId: string;
  teamName: string;
}

export interface CommunityCleanupMediaSummaryDto {
  beforeCount: number;
  progressCount: number;
  afterCount: number;
}

export interface CommunityCleanupMediaDto {
  beforeImageUrls: string[];
  progressImageUrls: string[];
  afterImageUrls: string[];
}

export interface CommunityCleanupMyParticipationDto {
  status: string;
  joinedAt: string;
  role: string;
}

/** POST .../community-cleanups — 201 data / GET {eventId} — 200 data */
export interface CommunityCleanupEventDetailDto {
  id: string;
  reportId: string;
  reportCode: string;
  status: CommunityCleanupStatusDto;
  title: string;
  description: string | null;
  leader: CommunityCleanupLeaderDto;
  joinOpensAt: string;
  joinClosesAt: string | null;
  startsAt: string;
  endsAt: string | null;
  maxParticipants: number;
  participantCount: number;
  spotsLeft: number;
  progressPercent: number;
  progressNote: string | null;
  meetingNote: string | null;
  meetingLatitude: number | null;
  meetingLongitude: number | null;
  reportLatitude: number;
  reportLongitude: number;
  reportAddress: string | null;
  categoryName: string;
  thumbnailUrl: string | null;
  myParticipation: CommunityCleanupMyParticipationDto | null;
  isLeader: boolean;
  mediaSummary: CommunityCleanupMediaSummaryDto;
  media: CommunityCleanupMediaDto;
}

export interface PaginationMetaDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Compact list item — GET /v1/community-cleanups/office-queue. */
export interface CommunityCleanupListItemDto {
  id: string;
  reportId: string;
  reportCode: string;
  status: CommunityCleanupStatusDto;
  title: string;
  leaderUserId: string;
  leaderFullName: string;
  startsAt: string;
  joinClosesAt: string | null;
  maxParticipants: number;
  participantCount: number;
  spotsLeft: number;
  progressPercent: number;
  reportLatitude: number;
  reportLongitude: number;
  thumbnailUrl: string | null;
  myParticipation: CommunityCleanupMyParticipationDto | null;
}

export interface CommunityCleanupListResponseDto {
  items: CommunityCleanupListItemDto[];
  pagination: PaginationMetaDto;
}

export type CommunityCleanupParticipantRoleDto = 'Leader' | 'Member';

export type CommunityCleanupParticipantStatusDto = 'Joined' | 'CheckedIn' | 'Withdrawn' | 'NoShow';

/** GET /v1/community-cleanups/{eventId}/participants */
export interface CommunityCleanupParticipantDto {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  role: CommunityCleanupParticipantRoleDto;
  status: CommunityCleanupParticipantStatusDto;
  joinedAt: string;
  checkedInAt: string | null;
}

export interface CommunityCleanupParticipantsResponseDto {
  items: CommunityCleanupParticipantDto[];
  pagination: PaginationMetaDto;
}

/** Body — POST {eventId}/reject-verification, POST {eventId}/cancel. */
export interface CommunityCleanupReasonBodyDto {
  reason: string;
}

export interface CommunityCleanupStatusCountDto {
  status: CommunityCleanupStatusDto;
  count: number;
}

/** GET /v1/community-cleanups/office-queue/stats */
export interface CommunityCleanupQueueStatsResponseDto {
  countsByStatus: CommunityCleanupStatusCountDto[];
  totalParticipants: number;
  totalMediaCount: number;
}
