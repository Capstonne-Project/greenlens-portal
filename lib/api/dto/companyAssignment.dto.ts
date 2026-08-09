/** GET /v1/reports/company-assignments — list item (Swagger / BE). */
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
  thumbnailUrl?: string | null;
  coverImageUrl?: string | null;
  imageUrl?: string | null;
  /** Ảnh báo cáo gốc (citizen upload) — BE trả trong list. */
  media?: CompanyAssignmentReportMediaDto[];
  /** Một số BE trả mảng thumbnail giống LEO tracking. */
  thumbnails?: string[] | null;
}

export interface CompanyAssignmentTeamSummaryDto {
  teamId: string;
  teamName: string;
  memberCount: number;
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
export interface CompanyAssignmentMediaItemDto {
  url: string;
  uploadedAt: string;
}

export interface CompanyAssignmentMediaDto {
  beforeImages?: CompanyAssignmentMediaItemDto[];
  progressImages?: CompanyAssignmentMediaItemDto[];
  afterImages?: CompanyAssignmentMediaItemDto[];
}

export interface CompanyAssignmentSlaDto {
  resolveDueAt: string;
  hoursRemaining: number;
  isBreached: boolean;
  severityLabel: string;
}

export interface CompanyAssignmentProgressSummaryDto {
  totalTeams: number;
  acceptedTeams: number;
  completedTeams: number;
  declinedTeams: number;
  pendingTeams: number;
  overallProgressPercent: number;
  startedAt?: string | null;
}

export interface CompanyAssignmentTeamMemberDto {
  userId: string;
  fullName: string;
  isLeader: boolean;
}

export interface CompanyAssignmentTeamDetailDto {
  assignmentId: string;
  status: string;
  assignedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  note?: string | null;
  declineReason?: string | null;
  progressPercent: number;
  progressNote?: string | null;
  progressUpdatedAt?: string | null;
  progressUpdatedByName?: string | null;
  teamId: string;
  teamName: string;
  members?: CompanyAssignmentTeamMemberDto[];
  assignedByName: string;
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
  iconUrl?: string | null;
}

export interface CompanyAssignmentDetailDto {
  reportId: string;
  code: string;
  status: string;
  severity: string;
  categoryName: string;
  description: string;
  address: string;
  wardCode?: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  dispatchedToCompanyAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  reopenedCount: number;
  sla: CompanyAssignmentSlaDto;
  summary: CompanyAssignmentProgressSummaryDto;
  media: CompanyAssignmentMediaDto;
  /** Ảnh báo cáo gốc (citizen) — optional trên detail BE. */
  images?: CompanyAssignmentMediaItemDto[];
  reportImages?: CompanyAssignmentMediaItemDto[];
  reportMedia?: CompanyAssignmentMediaItemDto[];
  teamAssignments?: CompanyAssignmentTeamDetailDto[];
  timeline?: CompanyAssignmentTimelineEntryDto[];
  wasteTags?: CompanyAssignmentWasteTagDto[];
}
