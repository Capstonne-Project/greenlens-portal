import type { ReportDetailResponseDto } from '@/lib/api/dto/report.dto';
import type { ReportProgressDataDto } from '@/lib/api/dto/reportProgress.dto';
import type { ReportDetail } from '@/lib/api/models/report';
import type { ReportProgress } from '@/lib/api/models/reportProgress';
import { mapReportDetailDto } from '@/lib/api/mappers/report.mapper';
import { mapReportProgressDataDto } from '@/lib/api/mappers/reportProgress.mapper';
import apiService from '@/lib/api/core';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { normalizeReportStatus } from '@/lib/constants/reportStatus';

export async function adaptFetchReportDetail(id: string): Promise<ReportDetail> {
  const res = await apiService.get<ReportDetailResponseDto>(`/v1/reports/${id}`);
  const mapped = mapReportDetailDto(res.data.data);
  return {
    ...mapped,
    status: normalizeReportStatus(String(mapped.status)),
  };
}

/** GET /v1/reports/{id}/progress — [LEO] tiến trình xử lý báo cáo. */
export async function adaptFetchReportProgress(id: string): Promise<ReportProgress> {
  const res = await apiService.get<ApiEnvelope<ReportProgressDataDto>>(
    `/v1/reports/${id}/progress`
  );
  return mapReportProgressDataDto(res.data.data);
}
