import type { ReportSeverity, ReportStatus } from '@/lib/api/models/report';
import type { MediaType } from '@/lib/constants/mediaType';

/**
 * FE model — GET /v1/reports/{id}/progress
 * Đồng bộ Swagger 2026-08-10 (assignment singular + assignedCompany + members).
 */

export interface ReportProgressImage {
  id: string;
  mediaType: MediaType | string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface ReportProgressSla {
  resolveDueAt: string | null;
  hoursRemaining: number;
  isBreached: boolean;
  severityLabel: string;
}

export interface ReportProgressAssignedCompany {
  companyId: string;
  companyName: string;
  dispatchedAt: string;
}

export interface ReportProgressMember {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  isLeader: boolean;
  joinedAt: string;
}

export interface ReportProgressUpdate {
  id: string;
  progressPercent: number;
  progressNote: string | null;
  updatedAt: string;
  updatedByUserId: string;
  updatedByName: string;
  images: ReportProgressImage[];
}

export interface ReportProgressAssignment {
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
  members: ReportProgressMember[];
  progressUpdates: ReportProgressUpdate[];
}

export interface ReportProgressMedia {
  submissionImages: ReportProgressImage[];
  beforeImages: ReportProgressImage[];
  afterImages: ReportProgressImage[];
  inspectionImages: ReportProgressImage[];
  reopenEvidenceImages: ReportProgressImage[];
}

export interface ReportProgressStatusHistory {
  fromStatus: ReportStatus;
  toStatus: ReportStatus;
  changedAt: string;
  changedByName: string;
  note: string | null;
}

/** GET /v1/reports/{id}/progress — [LEO] tiến trình xử lý báo cáo. */
export interface ReportProgress {
  reportId: string;
  code: string;
  status: ReportStatus;
  severity: ReportSeverity;
  categoryName: string;
  address: string;
  wardCode: string;
  description: string;
  sla: ReportProgressSla;
  assignedCompany: ReportProgressAssignedCompany | null;
  /** Đội đang phụ trách — null nếu chưa phân công. */
  assignment: ReportProgressAssignment | null;
  media: ReportProgressMedia;
  statusHistory: ReportProgressStatusHistory[];
}
