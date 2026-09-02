import apiService from '@/lib/api/core';
import type { GetCitizenReportCommentsDataDto } from '@/lib/api/dto/citizenReportComment.dto';
import { mapGetCitizenReportCommentsDataDto } from '@/lib/api/mappers/citizenReportComment.mapper';
import type { CitizenReportComments } from '@/lib/api/models/citizenReportComment';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

export interface FetchCitizenReportCommentsParams {
  reportId: string;
  page?: number;
  pageSize?: number;
}

/** GET /v1/reports/{reportId}/comments — public, xem không cần đăng nhập (AllowAnonymous). */
export async function adaptCitizenReportComments(
  params: FetchCitizenReportCommentsParams
): Promise<ApiEnvelope<CitizenReportComments>> {
  const { reportId, page = 1, pageSize = 20 } = params;
  const res = await apiService.get<ApiEnvelope<GetCitizenReportCommentsDataDto>>(
    `/v1/reports/${encodeURIComponent(reportId)}/comments`,
    { page, pageSize }
  );
  return mapApiEnvelope(res.data, mapGetCitizenReportCommentsDataDto);
}
