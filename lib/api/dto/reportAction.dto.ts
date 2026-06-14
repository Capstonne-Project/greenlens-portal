import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type ReportSeverityDto = 'Low' | 'Medium' | 'High' | 'Critical';

/** PUT /v1/reports/{id}/verify — [DEO] xác minh báo cáo (Submitted → Verified). */
export interface VerifyReportBodyDto {
  overrideSeverity?: ReportSeverityDto;
  overrideCategoryId?: string;
  wasteTagIds?: string[];
}

/** PUT /v1/reports/{id}/verify — envelope `data` là string (message ngắn từ BE). */
export type VerifyReportResponseDto = ApiEnvelope<string>;

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

export interface ReassignReportBodyDto {
  oldTeamId: string;
  newTeamId: string;
  reason: string;
}

/** POST /v1/reports/{id}/dispatch — DEO điều phối xuống VP phường/xã */
export interface DispatchReportBodyDto {
  targetLocalOfficeId: string;
  note?: string;
}
