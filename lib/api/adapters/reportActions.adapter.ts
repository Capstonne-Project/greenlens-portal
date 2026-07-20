import type {
  AssignReportBodyDto,
  DispatchToCompanyBodyDto,
  ReassignReportBodyDto,
  VerifyReportBodyDto,
  VerifyReportResponseDto,
} from '@/lib/api/dto/reportAction.dto';
import type {
  AssignReportInput,
  DispatchToCompanyInput,
  ReassignReportInput,
  VerifyReportInput,
  VerifyReportResult,
} from '@/lib/api/models/reportAction';
import apiService from '@/lib/api/core';

function mapVerifyReportBody(body: VerifyReportInput): VerifyReportBodyDto {
  return {
    ...(body.overrideSeverity != null ? { overrideSeverity: body.overrideSeverity } : {}),
    ...(body.overrideCategoryId != null ? { overrideCategoryId: body.overrideCategoryId } : {}),
    ...(body.wasteTagIds != null ? { wasteTagIds: body.wasteTagIds } : {}),
  };
}

function mapVerifyReportResponse(dto: VerifyReportResponseDto): VerifyReportResult {
  return {
    code: dto.code,
    message: dto.message,
    status: dto.status,
    data: dto.data,
  };
}

export async function adaptAssignReport(reportId: string, body: AssignReportInput): Promise<void> {
  const payload: AssignReportBodyDto = {
    teams: body.teams.map(t => ({
      teamId: t.teamId,
      ...(t.note ? { note: t.note } : {}),
    })),
  };
  await apiService.post(`/v1/reports/${reportId}/assign`, payload);
}

/** POST /v1/reports/{id}/dispatch-to-company — LEO điều phối task đến công ty (204). */
export async function adaptDispatchToCompany(
  reportId: string,
  body: DispatchToCompanyInput
): Promise<void> {
  const payload: DispatchToCompanyBodyDto = {
    companyId: body.companyId,
    ...(body.note?.trim() ? { note: body.note.trim() } : {}),
  };
  await apiService.post(`/v1/reports/${reportId}/dispatch-to-company`, payload);
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

/** PUT /v1/reports/{id}/verify — LEO xác minh báo cáo. */
export async function adaptVerifyReport(
  reportId: string,
  body: VerifyReportInput
): Promise<VerifyReportResult> {
  const payload = mapVerifyReportBody(body);
  const res = await apiService.put<VerifyReportResponseDto>(
    `/v1/reports/${reportId}/verify`,
    payload
  );
  return mapVerifyReportResponse(res.data);
}
