import type { ReportSeverity, ReportStatus } from '@/lib/api/models/report';

/** Ảnh tiến trình / nghiệm thu. */
export interface ReportProgressImage {
  url: string;
  uploadedAt: string;
}

export interface ReportProgressSla {
  resolveDueAt: string;
  hoursRemaining: number;
  isBreached: boolean;
  severityLabel: string;
}

export interface ReportProgressSummary {
  totalTeams: number;
  acceptedTeams: number;
  completedTeams: number;
  declinedTeams: number;
  pendingTeams: number;
  overallProgressPercent: number;
  startedAt: string;
}

export interface ReportProgressAssignment {
  assignmentId: string;
  teamId: string;
  teamName: string;
  teamType: string;
  teamLeaderName: string;
  status: string;
  assignedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  declineReason: string | null;
  progressPercent: number;
  progressNote: string | null;
  progressUpdatedAt: string | null;
}

export interface ReportProgressMedia {
  beforeImages: ReportProgressImage[];
  progressImages: ReportProgressImage[];
  afterImages: ReportProgressImage[];
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
  summary: ReportProgressSummary;
  assignments: ReportProgressAssignment[];
  media: ReportProgressMedia;
  statusHistory: ReportProgressStatusHistory[];
}
