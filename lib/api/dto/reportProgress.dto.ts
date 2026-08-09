import type { ReportSeverityDto, ReportStatusDto } from '@/lib/api/dto/report.dto';
import type { MediaType } from '@/lib/constants/mediaType';

/**
 * GET /v1/reports/{id}/progress
 * Khớp Swagger (2026-08-10): assignment singular, assignedCompany, members;
 * bỏ summary / progressImages / images flat.
 */

export interface ReportProgressImageDto {
  id: string;
  /** BE MediaType: Image | Video | Before | Progress | After | Inspection | ReopenEvidence */
  mediaType: MediaType | string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface ReportProgressSlaDto {
  resolveDueAt: string | null;
  hoursRemaining: number;
  isBreached: boolean;
  severityLabel: string;
}

export interface ReportProgressAssignedCompanyDto {
  companyId: string;
  companyName: string;
  dispatchedAt: string;
}

export interface ReportProgressMemberDto {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  isLeader: boolean;
  joinedAt: string;
}

export interface ReportProgressUpdateDto {
  id: string;
  progressPercent: number;
  progressNote: string | null;
  updatedAt: string;
  updatedByUserId: string;
  updatedByName: string;
  images: ReportProgressImageDto[];
}

export interface ReportProgressAssignmentDto {
  assignmentId: string;
  teamId: string;
  teamName: string;
  teamType: string;
  isCompanyTeam: boolean;
  companyId: string | null;
  companyName: string | null;
  localOfficeId: string | null;
  localOfficeName: string | null;
  teamLeaderName: string;
  assignedById: string;
  assignedByName: string;
  status: string;
  assignedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  declineReason: string | null;
  progressPercent: number;
  progressNote: string | null;
  progressUpdatedAt: string | null;
  members: ReportProgressMemberDto[];
  progressUpdates: ReportProgressUpdateDto[];
}

export interface ReportProgressMediaDto {
  submissionImages: ReportProgressImageDto[];
  beforeImages: ReportProgressImageDto[];
  afterImages: ReportProgressImageDto[];
  inspectionImages: ReportProgressImageDto[];
  reopenEvidenceImages: ReportProgressImageDto[];
}

export interface ReportProgressStatusHistoryDto {
  fromStatus: ReportStatusDto;
  toStatus: ReportStatusDto;
  changedAt: string;
  changedByName: string;
  note: string | null;
}

export interface ReportProgressDataDto {
  reportId: string;
  code: string;
  status: ReportStatusDto;
  severity: ReportSeverityDto;
  categoryName: string;
  address: string;
  wardCode: string;
  description: string;
  sla: ReportProgressSlaDto;
  assignedCompany: ReportProgressAssignedCompanyDto | null;
  assignment: ReportProgressAssignmentDto | null;
  media: ReportProgressMediaDto;
  statusHistory: ReportProgressStatusHistoryDto[];
}

export interface ReportProgressResponseDto {
  code: string;
  message: string;
  status: number;
  data: ReportProgressDataDto;
}
