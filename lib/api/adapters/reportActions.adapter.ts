import type { AssignReportBodyDto, ReassignReportBodyDto } from '@/lib/api/dto/reportAction.dto';
import type { AssignReportInput, ReassignReportInput } from '@/lib/api/models/reportAction';
import apiService from '@/lib/api/core';

export async function adaptAssignReport(reportId: string, body: AssignReportInput): Promise<void> {
  const payload: AssignReportBodyDto = {
    teams: body.teams.map(t => ({
      teamId: t.teamId,
      ...(t.note ? { note: t.note } : {}),
    })),
  };
  await apiService.post(`/v1/reports/${reportId}/assign`, payload);
}

/** PUT /v1/reports/{id}/reassign — chuyển giao đội cùng loại (LEO/DEO). */
export async function adaptReassignReport(
  reportId: string,
  body: ReassignReportInput
): Promise<void> {
  const payload: ReassignReportBodyDto = {
    oldTeamId: body.oldTeamId,
    newTeamId: body.newTeamId,
    reason: body.reason.trim(),
  };
  await apiService.put(`/v1/reports/${reportId}/reassign`, payload);
}
