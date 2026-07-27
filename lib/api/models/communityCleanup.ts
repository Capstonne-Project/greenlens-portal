/** FE models — chương trình dọn cộng đồng (Community Cleanup). */

export type CommunityCleanupStatus =
  | 'OpenForJoin'
  | 'JoinClosed'
  | 'InProgress'
  | 'PendingVerification'
  | 'Completed'
  | 'Cancelled';

export interface CommunityCleanupLeader {
  userId: string;
  fullName: string;
  teamId: string;
  teamName: string;
}

export interface CommunityCleanupMediaSummary {
  beforeCount: number;
  progressCount: number;
  afterCount: number;
}

export interface CommunityCleanupEventDetail {
  id: string;
  reportId: string;
  reportCode: string;
  status: CommunityCleanupStatus;
  title: string;
  description: string | null;
  leader: CommunityCleanupLeader;
  joinOpensAt: string;
  joinClosesAt: string | null;
  startsAt: string;
  endsAt: string | null;
  maxParticipants: number;
  participantCount: number;
  spotsLeft: number;
  progressPercent: number;
  meetingNote: string | null;
  meetingLatitude: number | null;
  meetingLongitude: number | null;
  reportLatitude: number;
  reportLongitude: number;
  reportAddress: string | null;
  categoryName: string;
  thumbnailUrl: string | null;
  isLeader: boolean;
  mediaSummary: CommunityCleanupMediaSummary;
}

/** POST /v1/reports/{reportId}/community-cleanups */
export interface CreateCommunityCleanupInput {
  title: string;
  description?: string;
  leaderUserId: string;
  /** ISO datetime */
  startsAt: string;
  /** ISO datetime */
  endsAt?: string;
  /** ISO datetime */
  joinClosesAt?: string;
  maxParticipants?: number;
  meetingNote?: string;
  meetingLatitude?: number;
  meetingLongitude?: number;
}
