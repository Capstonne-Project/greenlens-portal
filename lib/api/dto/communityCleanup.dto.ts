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

export interface CommunityCleanupMyParticipationDto {
  status: string;
  joinedAt: string;
  role: string;
}

/** POST .../community-cleanups — 201 data */
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
}
