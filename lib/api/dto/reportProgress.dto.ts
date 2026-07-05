import type { ReportSeverityDto, ReportStatusDto } from '@/lib/api/dto/report.dto';

/** GET /v1/reports/{id}/progress — ảnh theo giai đoạn. */
export interface ReportProgressImageDto {
  url: string;
  uploadedAt: string;
}

export interface ReportProgressSlaDto {
  resolveDueAt: string;
  hoursRemaining: number;
  isBreached: boolean;
  severityLabel: string;
}

export interface ReportProgressSummaryDto {
  totalTeams: number;
  acceptedTeams: number;
  completedTeams: number;
  declinedTeams: number;
  pendingTeams: number;
  overallProgressPercent: number;
  startedAt: string;
}

/** Assignment trong tiến trình — có thêm leader, accept/complete, progress %. */
export interface ReportProgressAssignmentDto {
  assignmentId: string;
  teamId: string;
  teamName: string;
  teamType: string;
  teamLeaderName: string;
  status: string;
  assignedAt: string;
  acceptedAt?: string | null;
  completedAt?: string | null;
  declineReason?: string | null;
  progressPercent: number;
  progressNote?: string | null;
  progressUpdatedAt?: string | null;
}

export interface ReportProgressMediaDto {
  beforeImages: ReportProgressImageDto[];
  progressImages: ReportProgressImageDto[];
  afterImages: ReportProgressImageDto[];
}

export interface ReportProgressStatusHistoryDto {
  fromStatus: ReportStatusDto;
  toStatus: ReportStatusDto;
  changedAt: string;
  changedByName: string;
  note?: string | null;
}

/** GET /v1/reports/{id}/progress — data envelope. */
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
  summary: ReportProgressSummaryDto;
  assignments: ReportProgressAssignmentDto[];
  media: ReportProgressMediaDto;
  statusHistory: ReportProgressStatusHistoryDto[];
}

export interface ReportProgressResponseDto {
  code: string;
  message: string;
  status: number;
  data: ReportProgressDataDto;
}
