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
