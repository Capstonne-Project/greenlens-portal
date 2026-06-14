import type {
  AssignReportBodyDto,
  DispatchReportBodyDto,
  ReassignReportBodyDto,
  RejectReportBodyDto,
  VerifyReportBodyDto,
} from '@/lib/api/dto/reportAction.dto';
import type {
  AssignReportInput,
  DispatchReportInput,
  ReassignReportInput,
  RejectReportInput,
  VerifyReportInput,
} from '@/lib/api/models/reportAction';
import apiService from '@/lib/api/core';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

function buildVerifyBody(body: VerifyReportInput): VerifyReportBodyDto {
  const payload: VerifyReportBodyDto = {};
  if (body.overrideSeverity) payload.overrideSeverity = body.overrideSeverity;
  if (body.overrideCategoryId?.trim()) {
    payload.overrideCategoryId = body.overrideCategoryId.trim();
  }
  const tagIds = body.wasteTagIds?.map(id => id.trim()).filter(Boolean);
  if (tagIds && tagIds.length > 0) payload.wasteTagIds = tagIds;
  return payload;
}

/** PUT /v1/reports/{id}/verify — 200 envelope; 404/422 message trong `response.data.message`. */
export async function adaptVerifyReport(
  id: string,
  body: VerifyReportInput
): Promise<ApiEnvelope<string>> {
  const res = await apiService.put<ApiEnvelope<string>>(
    `/v1/reports/${id}/verify`,
    buildVerifyBody(body)
  );
  return res.data;
}

export async function adaptRejectReport(id: string, body: RejectReportInput): Promise<void> {
  const payload: RejectReportBodyDto = { reason: body.reason.trim() };
  await apiService.put(`/v1/reports/${id}/reject`, payload);
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

/** POST /v1/reports/{id}/dispatch — một VP / request; gọi song song khi nhiều targetLocalOfficeId. */
export async function adaptDispatchReport(
  reportId: string,
  body: DispatchReportInput
): Promise<ApiEnvelope<string>> {
  const note = body.note?.trim();
  const officeIds = body.targetLocalOfficeIds.filter(id => id.trim().length > 0);
  if (officeIds.length === 0) {
    throw new Error('targetLocalOfficeIds is required');
  }

  const results = await Promise.all(
    officeIds.map(targetLocalOfficeId => {
      const payload: DispatchReportBodyDto = {
        targetLocalOfficeId,
        ...(note ? { note } : {}),
      };
      return apiService.post<ApiEnvelope<string>>(`/v1/reports/${reportId}/dispatch`, payload);
    })
  );

  return results[results.length - 1]!.data;
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
