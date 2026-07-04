import type { ReportSeverity } from '@/lib/api/models/adminReport';

export interface VerifyReportInput {
  overrideSeverity?: ReportSeverity;
  overrideCategoryId?: string;
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
