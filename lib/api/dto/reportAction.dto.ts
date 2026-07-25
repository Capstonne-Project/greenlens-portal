export interface AssignTeamEntryDto {
  teamId: string;
  note?: string;
}

export interface AssignReportBodyDto {
  teams: AssignTeamEntryDto[];
}

/** POST /v1/reports/{id}/dispatch-to-company — body Swagger. */
export interface DispatchToCompanyBodyDto {
  companyId: string;
  note?: string;
}

export interface ReassignReportBodyDto {
  oldTeamId: string;
  newTeamId: string;
  reason: string;
}

/** PUT /v1/reports/{id}/verify — body Swagger. */
export interface VerifyReportBodyDto {
  overrideSeverity?: string;
  overrideCategoryId?: string;
  wasteTagIds?: string[];
}

/** PUT /v1/reports/{id}/verify — envelope response (200 / 404). */
export type VerifyReportResponseDto = {
  code: string;
  message: string;
  status: number;
  data: string;
};

/** POST /v1/reports/{id}/confirm-duplicate — body Swagger. */
export interface ConfirmDuplicateBodyDto {
  primaryReportId: string;
}

/** POST confirm/dismiss-duplicate — envelope response. */
export type DuplicateActionResponseDto = VerifyReportResponseDto;
