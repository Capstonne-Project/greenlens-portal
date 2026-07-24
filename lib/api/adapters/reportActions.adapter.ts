import type {
  AssignReportBodyDto,
  ConfirmDuplicateBodyDto,
  DispatchToCompanyBodyDto,
  DuplicateActionResponseDto,
  ReassignReportBodyDto,
  VerifyReportBodyDto,
  VerifyReportResponseDto,
} from '@/lib/api/dto/reportAction.dto';
import type {
  AssignReportInput,
  ConfirmDuplicateInput,
  DispatchToCompanyInput,
  DuplicateActionResult,
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

function mapDuplicateActionResponse(dto: DuplicateActionResponseDto): DuplicateActionResult {
  return {
    code: dto.code,
    message: dto.message,
    status: dto.status,
    data: dto.data,
  };
}

/** POST /v1/reports/{id}/confirm-duplicate — BR-REP-032 xác nhận & gộp trùng. */
export async function adaptConfirmDuplicate(
  reportId: string,
  body: ConfirmDuplicateInput
): Promise<DuplicateActionResult> {
  const payload: ConfirmDuplicateBodyDto = { primaryReportId: body.primaryReportId };
  const res = await apiService.post<DuplicateActionResponseDto>(
    `/v1/reports/${reportId}/confirm-duplicate`,
    payload
  );
  return mapDuplicateActionResponse(res.data);
}

/** POST /v1/reports/{id}/dismiss-duplicate — BR-REP-031 bác bỏ nghi trùng. */
export async function adaptDismissDuplicate(reportId: string): Promise<DuplicateActionResult> {
  const res = await apiService.post<DuplicateActionResponseDto>(
    `/v1/reports/${reportId}/dismiss-duplicate`
  );
  return mapDuplicateActionResponse(res.data);
}
