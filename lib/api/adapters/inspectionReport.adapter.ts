import type {
  CreateInspectionReportBodyDto,
  CreateInspectionReportResponseDto,
} from '@/lib/api/dto/inspectionReport.dto';
import { mapCreateInspectionReportResponse } from '@/lib/api/mappers/inspectionReport.mapper';
import type {
  CreateInspectionReportInput,
  CreateInspectionReportResult,
} from '@/lib/api/models/inspectionReport';
import apiService from '@/lib/api/core';

function toBodyDto(input: CreateInspectionReportInput): CreateInspectionReportBodyDto {
  const trimOrNull = (value?: string) => {
    const t = value?.trim();
    return t ? t : null;
  };

  return {
    assignedTeamId: input.assignedTeamId,
    violationDescription: trimOrNull(input.violationDescription),
    violatorName: trimOrNull(input.violatorName),
    violatorAddress: trimOrNull(input.violatorAddress),
    violatorIdentity: trimOrNull(input.violatorIdentity),
  };
}

/**
 * POST /v1/reports/{id}/inspections — [LEO] lập hồ sơ xử phạt nháp
 * gắn báo cáo đã Verified (BR-INS-001, BR-OFF-005).
 */
export async function adaptCreateInspectionReport(
  reportId: string,
  input: CreateInspectionReportInput
): Promise<CreateInspectionReportResult> {
  const res = await apiService.post<CreateInspectionReportResponseDto>(
    `/v1/reports/${reportId}/inspections`,
    toBodyDto(input)
  );
  return mapCreateInspectionReportResponse(res.data);
}
