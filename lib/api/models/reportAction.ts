import type { ReportSeverity } from '@/lib/api/models/adminReport';

/** PUT /v1/reports/{id}/verify — có thể override severity, category, gắn waste tags. */
export interface VerifyReportInput {
  overrideSeverity?: ReportSeverity;
  overrideCategoryId?: string;
  wasteTagIds?: string[];
}

export interface RejectReportInput {
  reason: string;
}

export interface AssignTeamEntry {
  teamId: string;
  note?: string;
}

export interface AssignReportInput {
  teams: AssignTeamEntry[];
}

/** PUT /v1/reports/{id}/reassign — chuyển giao đội (LEO/DEO). */
export interface ReassignReportInput {
  oldTeamId: string;
  newTeamId: string;
  /** Bắt buộc, tối thiểu 20 ký tự. */
  reason: string;
}

/** POST /v1/reports/{id}/dispatch — Verified → Dispatched (DEO). */
export interface DispatchReportInput {
  targetLocalOfficeIds: string[];
  note?: string;
}
