import type { RejectReportBodyDto, VerifyReportBodyDto } from '@/lib/api/dto/reportAction.dto';
import type { RejectReportInput, VerifyReportInput } from '@/lib/api/models/reportAction';
import apiService from '@/lib/api/core';

function buildVerifyBody(body: VerifyReportInput): VerifyReportBodyDto {
  const payload: VerifyReportBodyDto = {};
  if (body.overrideSeverity) payload.overrideSeverity = body.overrideSeverity;
  if (body.overrideCategoryId?.trim()) {
    payload.overrideCategoryId = body.overrideCategoryId.trim();
  }
  return payload;
}

export async function adaptVerifyReport(id: string, body: VerifyReportInput): Promise<void> {
  await apiService.put(`/v1/reports/${id}/verify`, buildVerifyBody(body));
}

export async function adaptRejectReport(id: string, body: RejectReportInput): Promise<void> {
  const payload: RejectReportBodyDto = { reason: body.reason.trim() };
  await apiService.put(`/v1/reports/${id}/reject`, payload);
}
