/** Khớp BE `/v1/reports/{reportId}/community-cleanups` + `/v1/community-cleanups`. */

import type { ReportSeverityDto } from '@/lib/api/dto/report.dto';

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

export type CommunityCleanupParticipantRoleDto = 'Leader' | 'Member';

export type CommunityCleanupParticipantStatusDto = 'Joined' | 'CheckedIn' | 'Withdrawn' | 'NoShow';

export interface CommunityCleanupMyParticipationDto {
  status: CommunityCleanupParticipantStatusDto;
  joinedAt: string;
  role: CommunityCleanupParticipantRoleDto;
}

/** Share payload — create/detail responses. */
export interface CommunityCleanupShareDto {
  url: string;
  caption: string;
  imageUrl: string | null;
  facebookShareUrl: string;
  twitterShareUrl: string;
  linkedInShareUrl: string;
  hashtags: string[];
}

/**
 * Detail shape — POST .../community-cleanups (201),
 * GET /v1/community-cleanups/{eventId},
 * GET /v1/reports/{reportId}/community-cleanup (data may be null).
 */
export interface CommunityCleanupEventDetailDto {
  id: string;
  reportId: string;
  reportCode: string;
  status: CommunityCleanupStatusDto;
  title: string;
  description: string | null;
  reportDescription: string;
  reportImageUrls: string[];
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
  severity: ReportSeverityDto;
  thumbnailUrl: string | null;
  myParticipation: CommunityCleanupMyParticipationDto | null;
  isLeader: boolean;
  mediaSummary: CommunityCleanupMediaSummaryDto;
  media: CommunityCleanupMediaDto;
  share: CommunityCleanupShareDto;
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

/**
 * POST /v1/community-cleanups/{eventId}/share/facebook-page — [LEO] đăng lên Facebook Page.
 * Kết quả đăng Page (BE gọi Meta Graph API POST /photos).
 */
export interface CommunityCleanupFacebookPageShareResultDto {
  attempted: boolean;
  success: boolean;
  postId: string | null;
  pageUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

/**
 * GET /v1/public/community-cleanups/{eventId} — public preview (OG / share landing).
 * No Authorization required. Cancelled program → 404.
 */
export interface CommunityCleanupPublicPreviewDto {
  id: string;
  title: string;
  description: string | null;
  status: CommunityCleanupStatusDto;
  startsAt: string;
  endsAt: string | null;
  joinClosesAt: string | null;
  maxParticipants: number;
  participantCount: number;
  spotsLeft: number;
  meetingNote: string | null;
  categoryName: string;
  reportAddress: string | null;
  thumbnailUrl: string | null;
  share: CommunityCleanupShareDto;
}
