export type ReportSeverityDto = 'Low' | 'Medium' | 'High' | 'Critical';

export interface VerifyReportBodyDto {
  overrideSeverity?: ReportSeverityDto;
  overrideCategoryId?: string;
}

export interface RejectReportBodyDto {
  reason: string;
}
