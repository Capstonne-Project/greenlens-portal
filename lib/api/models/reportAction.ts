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
