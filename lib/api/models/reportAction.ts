import type { ReportSeverity } from '@/lib/api/models/adminReport';

export interface VerifyReportInput {
  overrideSeverity?: ReportSeverity;
  overrideCategoryId?: string;
}

export interface RejectReportInput {
  reason: string;
}
