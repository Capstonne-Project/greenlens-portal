import type {
  RejectReopenRequestBodyDto,
  ReopenRequestActionResponseDto,
  ReopenRequestsDataDto,
} from '@/lib/api/dto/reopenRequest.dto';
import { mapReopenRequestsDataDto } from '@/lib/api/mappers/reopenRequest.mapper';
import type {
  RejectReopenRequestInput,
  ReopenRequestActionResult,
  ReopenRequestsData,
  ReopenRequestsParams,
} from '@/lib/api/models/reopenRequest';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '@/lib/api/core';

function buildReopenRequestsQuery(
  params?: ReopenRequestsParams
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.status) query.status = params.status;
  return query;
}

function mapReopenRequestActionResponse(
  dto: ReopenRequestActionResponseDto
): ReopenRequestActionResult {
  return {
    code: dto.code,
    message: dto.message,
    status: dto.status,
    data: dto.data,
  };
}

/** GET /v1/reports/reopen-requests — [LEO/DEO] danh sách yêu cầu mở lại báo cáo. */
export async function adaptFetchReopenRequests(
  params?: ReopenRequestsParams
): Promise<ApiEnvelope<ReopenRequestsData>> {
  const res = await apiService.get<ApiEnvelope<ReopenRequestsDataDto>>(
    '/v1/reports/reopen-requests',
    buildReopenRequestsQuery(params)
  );
  return mapApiEnvelope(res.data, mapReopenRequestsDataDto);
}

/** POST /v1/reports/{id}/reopen-requests/{requestId}/approve — [LEO/DEO] duyệt mở lại. */
export async function adaptApproveReopenRequest(
  reportId: string,
  requestId: string
): Promise<ReopenRequestActionResult> {
  const res = await apiService.post<ReopenRequestActionResponseDto>(
    `/v1/reports/${reportId}/reopen-requests/${requestId}/approve`
  );
  return mapReopenRequestActionResponse(res.data);
}

/** POST /v1/reports/{id}/reopen-requests/{requestId}/reject — [LEO/DEO] từ chối mở lại. */
export async function adaptRejectReopenRequest(
  reportId: string,
  requestId: string,
  body: RejectReopenRequestInput
): Promise<ReopenRequestActionResult> {
  const payload: RejectReopenRequestBodyDto = {
    reason: body.reason.trim(),
  };
  const res = await apiService.post<ReopenRequestActionResponseDto>(
    `/v1/reports/${reportId}/reopen-requests/${requestId}/reject`,
    payload
  );
  return mapReopenRequestActionResponse(res.data);
}
