import type { CreateInspectionReportResponseDto } from '@/lib/api/dto/inspectionReport.dto';
import type { CreateInspectionReportResult } from '@/lib/api/models/inspectionReport';

export function mapCreateInspectionReportResponse(
  dto: CreateInspectionReportResponseDto
): CreateInspectionReportResult {
  return {
    code: dto.code ?? '',
    message: dto.message ?? '',
    status: Number(dto.status) || 0,
    inspectionId: dto.data ?? '',
  };
}
