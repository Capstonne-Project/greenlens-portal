/** POST /v1/reports/{id}/inspections — body tạo hồ sơ nháp (BR-INS-001). */
export interface CreateInspectionReportInput {
  assignedTeamId: string;
  violationDescription?: string;
  violatorName?: string;
  violatorAddress?: string;
  violatorIdentity?: string;
}

/** POST /v1/reports/{id}/inspections — kết quả tạo hồ sơ. */
export interface CreateInspectionReportResult {
  code: string;
  message: string;
  status: number;
  /** Id hồ sơ InspectionReport vừa tạo. */
  inspectionId: string;
}
