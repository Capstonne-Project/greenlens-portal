export interface AssignTeamEntry {
  teamId: string;
  note?: string;
}

export interface AssignReportInput {
  teams: AssignTeamEntry[];
}

/** POST /v1/reports/{id}/dispatch-to-company — LEO điều phối task đến công ty DVMT. */
export interface DispatchToCompanyInput {
  companyId: string;
  note?: string;
}

/** PUT /v1/reports/{id}/reassign — chuyển giao đội (LEO/DEO). */
export interface ReassignReportInput {
  oldTeamId: string;
  newTeamId: string;
  /** Bắt buộc, tối thiểu 20 ký tự. */
  reason: string;
}

/** PUT /v1/reports/{id}/verify — LEO xác minh báo cáo (Submitted → Verified). */
export interface VerifyReportInput {
  overrideSeverity?: string;
  overrideCategoryId?: string;
  wasteTagIds?: string[];
}

export interface VerifyReportResult {
  code: string;
  message: string;
  status: number;
  data: string;
}

/** POST /v1/reports/{id}/confirm-duplicate — BR-REP-032 gộp vào báo cáo gốc. */
export interface ConfirmDuplicateInput {
  /** ID báo cáo gốc (primary). */
  primaryReportId: string;
}

/** Envelope dùng chung cho confirm / dismiss duplicate. */
export type DuplicateActionResult = VerifyReportResult;
