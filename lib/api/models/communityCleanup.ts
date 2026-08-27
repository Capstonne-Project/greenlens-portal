/** FE models — chương trình dọn cộng đồng (Community Cleanup). */

import type { ReportSeverity } from '@/lib/api/models/report';

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

export interface CommunityCleanupMedia {
  beforeImageUrls: string[];
  progressImageUrls: string[];
  afterImageUrls: string[];
}

export type CommunityCleanupParticipantRole = 'Leader' | 'Member';

export type CommunityCleanupParticipantStatus = 'Joined' | 'CheckedIn' | 'Withdrawn' | 'NoShow';

export interface CommunityCleanupMyParticipation {
  status: CommunityCleanupParticipantStatus;
  joinedAt: string;
  role: CommunityCleanupParticipantRole;
}

export interface CommunityCleanupShare {
  url: string;
  caption: string;
  imageUrl: string | null;
  facebookShareUrl: string;
  twitterShareUrl: string;
  linkedInShareUrl: string;
  hashtags: string[];
}

export interface CommunityCleanupEventDetail {
  id: string;
  reportId: string;
  reportCode: string;
  status: CommunityCleanupStatus;
  title: string;
  description: string | null;
  reportDescription: string;
  reportImageUrls: string[];
  leader: CommunityCleanupLeader;
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
  severity: ReportSeverity;
  thumbnailUrl: string | null;
  myParticipation: CommunityCleanupMyParticipation | null;
  isLeader: boolean;
  mediaSummary: CommunityCleanupMediaSummary;
  media: CommunityCleanupMedia;
  share: CommunityCleanupShare;
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

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Compact item — GET /v1/community-cleanups/office-queue. */
export interface CommunityCleanupListItem {
  id: string;
  reportId: string;
  reportCode: string;
  status: CommunityCleanupStatus;
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
}

export interface CommunityCleanupList {
  items: CommunityCleanupListItem[];
  pagination: PaginationMeta;
}

export interface CommunityCleanupOfficeQueueParams {
  page?: number;
  pageSize?: number;
  /** Bỏ trống = mọi status (tab Tất cả). Nhiều giá trị → `?status=A&status=B`. */
  status?: CommunityCleanupStatus | CommunityCleanupStatus[];
}

export interface CommunityCleanupParticipant {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  role: CommunityCleanupParticipantRole;
  status: CommunityCleanupParticipantStatus;
  joinedAt: string;
  checkedInAt: string | null;
}

export interface CommunityCleanupParticipantsList {
  items: CommunityCleanupParticipant[];
  pagination: PaginationMeta;
}

/** GET /v1/community-cleanups/office-queue/stats */
export interface CommunityCleanupQueueStats {
  countsByStatus: Partial<Record<CommunityCleanupStatus, number>>;
  totalParticipants: number;
  totalMediaCount: number;
}

/**
 * POST /v1/community-cleanups/{eventId}/share/facebook-page — [LEO] kết quả đăng Facebook Page.
 */
export interface CommunityCleanupFacebookPageShareResult {
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
export interface CommunityCleanupPublicPreview {
  id: string;
  title: string;
  description: string | null;
  status: CommunityCleanupStatus;
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
  share: CommunityCleanupShare;
}
