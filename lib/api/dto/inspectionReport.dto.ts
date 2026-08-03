/** POST /v1/reports/{id}/inspections — request body (Swagger). */
export interface CreateInspectionReportBodyDto {
  assignedTeamId: string;
  violationDescription?: string | null;
  violatorName?: string | null;
  violatorAddress?: string | null;
  violatorIdentity?: string | null;
}

/**
 * POST /v1/reports/{id}/inspections — envelope 200.
 * `data` = id hồ sơ xử phạt (UUID string).
 */
export interface CreateInspectionReportResponseDto {
  code: string;
  message: string;
  status: number;
  data: string;
}
