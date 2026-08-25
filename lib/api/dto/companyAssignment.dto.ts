/** GET /v1/reports/company-assignments — list item (Swagger / BE). */

/** Văn phòng / LEO điều phối — `report.dispatchSource` (list) và `dispatchSource` (detail). */
export interface CompanyAssignmentDispatchSourceDto {
  localOfficeId: string;
  localOfficeName: string;
  wardCode: string;
  wardName: string;
  leoUserId: string;
  leoFullName: string;
}

/** Waste tag trên đội — list `team.wasteTags`, detail `assignment.teamWasteTags`. */
export interface CompanyAssignmentTeamWasteTagDto {
  tagId: string;
  code: string;
  nameVi: string;
  nameEn?: string | null;
  iconUrl?: string | null;
}

/** Canonical first media on list report (`report.firstMedia`). */
export interface CompanyAssignmentFirstMediaDto {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type: string;
  uploadedAt: string;
}

/** Legacy / alternate media shape still seen on older list payloads. */
export interface CompanyAssignmentReportMediaDto {
  id?: string;
  url: string;
  thumbnailUrl?: string | null;
  type?: string;
  mediaType?: string;
  uploadedAt?: string;
}

export interface CompanyAssignmentReportSummaryDto {
  reportId: string;
  code: string;
  address: string;
  wardCode?: string;
  categoryName: string;
  severity: string;
  status: string;
  slaResolveDueAt: string;
  dispatchSource?: CompanyAssignmentDispatchSourceDto | null;
  /** Canonical cover media from Swagger list response. */
  firstMedia?: CompanyAssignmentFirstMediaDto | null;
  /** @deprecated Prefer `firstMedia` — kept for legacy list payloads. */
  thumbnailUrl?: string | null;
  coverImageUrl?: string | null;
  imageUrl?: string | null;
  /** @deprecated Prefer `firstMedia` — legacy media array. */
  media?: CompanyAssignmentReportMediaDto[];
  /** @deprecated Prefer `firstMedia` — legacy thumbnail strings. */
  thumbnails?: string[] | null;
}

/** List + detail team member. */
export interface CompanyAssignmentTeamMemberDto {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  isLeader: boolean;
  /** Detail wire — khi member join team. */
  joinedAt?: string | null;
}

export interface CompanyAssignmentTeamSummaryDto {
  teamId: string;
  teamName: string;
  memberCount: number;
  wasteTags?: CompanyAssignmentTeamWasteTagDto[];
  members?: CompanyAssignmentTeamMemberDto[];
}

export interface CompanyAssignmentListItemDto {
  assignmentId: string;
  assignmentStatus: string;
  assignedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  progressPercent: number;
  progressNote?: string | null;
  progressUpdatedAt?: string | null;
  note?: string | null;
  report: CompanyAssignmentReportSummaryDto;
  team: CompanyAssignmentTeamSummaryDto;
  assignedByName: string;
  /** @deprecated Prefer `report.firstMedia` — legacy root thumbnail. */
  thumbnailUrl?: string | null;
}

export interface CompanyAssignmentsListDto {
  items: CompanyAssignmentListItemDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/** GET /v1/reports/company-assignments/{reportId} — [CompanyManager]. */

/**
 * Cleanup / progress media item (before, after, progressUpdates[].images).
 * Swagger detail — richer than citizenMedia.
 */
export interface CompanyAssignmentMediaItemDto {
  id?: string;
  url: string;
  thumbnailUrl?: string | null;
  mediaType?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  uploadedAt: string;
}

/**
 * Canonical citizen media on detail (`citizenMedia[]`).
 * Same shape as list `firstMedia`.
 */
export interface CompanyAssignmentCitizenMediaDto {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type: string;
  uploadedAt: string;
}

export interface CompanyAssignmentMediaDto {
  beforeImages?: CompanyAssignmentMediaItemDto[];
  afterImages?: CompanyAssignmentMediaItemDto[];
  /** @deprecated Prefer `assignment.progressUpdates[].images` — mapper derives progressImages. */
  progressImages?: CompanyAssignmentMediaItemDto[];
}

export interface CompanyAssignmentSlaDto {
  resolveDueAt: string;
  hoursRemaining: number;
  isBreached: boolean;
  severityLabel: string;
}

/** @deprecated Prefer deriving summary from singular `assignment` — legacy detail payloads. */
export interface CompanyAssignmentProgressSummaryDto {
  totalTeams: number;
  acceptedTeams: number;
  completedTeams: number;
  declinedTeams: number;
  pendingTeams: number;
  overallProgressPercent: number;
  startedAt?: string | null;
}

export interface CompanyAssignmentProgressUpdateDto {
  id: string;
  progressPercent: number;
  progressNote?: string | null;
  updatedAt: string;
  updatedByUserId: string;
  updatedByName: string;
  images?: CompanyAssignmentMediaItemDto[];
}

/** Canonical singular assignment on detail (`assignment`). */
export interface CompanyAssignmentDetailAssignmentDto {
  assignmentId: string;
  status: string;
  assignedAt: string;
  /** Thời điểm đội nhận việc — step «Đội nhận việc». */
  acceptedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  note?: string | null;
  declineReason?: string | null;
  checkedInAt?: string | null;
  checkedInLatitude?: number | null;
  checkedInLongitude?: number | null;
  checkedInNote?: string | null;
  progressPercent: number;
  progressNote?: string | null;
  progressUpdatedAt?: string | null;
  progressUpdatedByName?: string | null;
  teamId: string;
  teamName: string;
  teamLeaderName?: string | null;
  teamWasteTags?: CompanyAssignmentTeamWasteTagDto[];
  members?: CompanyAssignmentTeamMemberDto[];
  assignedByName: string;
  progressUpdates?: CompanyAssignmentProgressUpdateDto[];
}

/**
 * @deprecated Prefer `assignment` — legacy multi-team detail payloads.
 * Kept so mapper can fall back when Swagger singular field is absent.
 */
export interface CompanyAssignmentTeamDetailDto {
  assignmentId: string;
  status: string;
  assignedAt: string;
  acceptedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  note?: string | null;
  declineReason?: string | null;
  checkedInAt?: string | null;
  checkedInLatitude?: number | null;
  checkedInLongitude?: number | null;
  checkedInNote?: string | null;
  progressPercent: number;
  progressNote?: string | null;
  progressUpdatedAt?: string | null;
  progressUpdatedByName?: string | null;
  teamId: string;
  teamName: string;
  teamLeaderName?: string | null;
  teamWasteTags?: CompanyAssignmentTeamWasteTagDto[];
  members?: CompanyAssignmentTeamMemberDto[];
  assignedByName: string;
  progressUpdates?: CompanyAssignmentProgressUpdateDto[];
}

export interface CompanyAssignmentHistoryEntryDto {
  assignmentId: string;
  teamId: string;
  teamName: string;
  status: string;
  assignedAt: string;
  acceptedAt?: string | null;
  completedAt?: string | null;
  declineReason?: string | null;
  note?: string | null;
  teamWasteTags?: CompanyAssignmentTeamWasteTagDto[];
}

export interface CompanyAssignmentTimelineEntryDto {
  timestamp: string;
  fromStatus?: string | null;
  toStatus: string;
  changedByName?: string | null;
  reason?: string | null;
}

export interface CompanyAssignmentWasteTagDto {
  tagId: string;
  code: string;
  nameVi: string;
  nameEn?: string | null;
  iconUrl?: string | null;
}

/**
 * Wire DTO — chi tiết Company Manager.
 *
 * Canonical assign-queue (Swagger 2026-08):
 *   GET `/v1/reports/company-reports/{reportId}`
 * Tracking progress (cùng shape `data`):
 *   GET `/v1/reports/company-assignments/{reportId}`
 *
 * Fields: reportId…wasteTags, sla, citizenMedia, media.before/after,
 * assignment (+ progressUpdates[].images), assignmentHistory, canReassign, timeline.
 * Legacy (`summary`, `teamAssignments`, `images`/…) optional — mapper fallback.
 */
export interface CompanyAssignmentDetailDto {
  reportId: string;
  code: string;
  status: string;
  severity: string;
  categoryName: string;
  description: string;
  address: string;
  wardCode?: string | null;
  provinceCode?: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  verifiedAt?: string | null;
  verifiedByName?: string | null;
  dispatchedToCompanyAt?: string | null;
  dispatchSource?: CompanyAssignmentDispatchSourceDto | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  reopenedCount: number;
  priorityScore?: number;
  /** Một số payload Resolved/Closed có thể thiếu nested object — mapper phải fallback. */
  sla?: CompanyAssignmentSlaDto | null;
  citizenMedia?: CompanyAssignmentCitizenMediaDto[];
  media?: CompanyAssignmentMediaDto | null;
  assignment?: CompanyAssignmentDetailAssignmentDto | null;
  assignmentHistory?: CompanyAssignmentHistoryEntryDto[];
  canReassign?: boolean;
  timeline?: CompanyAssignmentTimelineEntryDto[];
  wasteTags?: CompanyAssignmentWasteTagDto[];

  /** @deprecated Prefer deriving from `assignment` — legacy payloads. */
  summary?: CompanyAssignmentProgressSummaryDto | null;
  /** @deprecated Prefer `assignment` — legacy multi-team payloads. */
  teamAssignments?: CompanyAssignmentTeamDetailDto[];
  /** @deprecated Prefer `citizenMedia`. */
  images?: CompanyAssignmentMediaItemDto[];
  /** @deprecated Prefer `citizenMedia`. */
  reportImages?: CompanyAssignmentMediaItemDto[];
  /** @deprecated Prefer `citizenMedia`. */
  reportMedia?: CompanyAssignmentMediaItemDto[];
}
