export type ReportSeverityDto = 'Low' | 'Medium' | 'High' | 'Critical';

export interface VerifyReportBodyDto {
  overrideSeverity?: ReportSeverityDto;
  overrideCategoryId?: string;
}

export interface RejectReportBodyDto {
  reason: string;
}

export interface AssignTeamEntryDto {
  teamId: string;
  note?: string;
}

export interface AssignReportBodyDto {
  teams: AssignTeamEntryDto[];
}
