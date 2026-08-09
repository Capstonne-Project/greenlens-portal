import type {
  AssignInspectionTeamBodyDto,
  AssignInspectionTeamResponseDto,
  CreateInspectionReportBodyDto,
  CreateInspectionReportResponseDto,
  InspectionDetailResponseDto,
  InspectionOfficerQueueDataDto,
  InspectionPaymentsHistoryResponseDto,
  RecordInspectionPaymentResponseDto,
  ReportInspectionsListResponseDto,
} from '@/lib/api/dto/inspectionReport.dto';
import {
  mapAssignInspectionTeamResponse,
  mapCreateInspectionReportResponse,
  mapInspectionDetailResponse,
  mapInspectionOfficerQueueDataDto,
  mapInspectionPaymentsHistoryResponse,
  mapRecordInspectionPaymentResponse,
  mapReportInspectionsListResponse,
} from '@/lib/api/mappers/inspectionReport.mapper';
import type {
  AssignInspectionTeamInput,
  AssignInspectionTeamResult,
  CreateInspectionReportInput,
  CreateInspectionReportResult,
  InspectionDetail,
  InspectionOfficerQueueData,
  InspectionOfficerQueueParams,
  InspectionPaymentsHistory,
  RecordInspectionPaymentInput,
  RecordInspectionPaymentResult,
  ReportInspectionsList,
} from '@/lib/api/models/inspectionReport';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';
import apiService, { mergeIdempotencyConfig, withOptionalIdempotency } from '@/lib/api/core';

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

/**
 * GET /v1/reports/{id}/inspections — [LEO/Inspector] danh sách hồ sơ xử phạt
 * liên kết báo cáo. Nghiệp vụ: tối đa 1 item / report.
 */
export async function adaptFetchReportInspections(
  reportId: string
): Promise<ReportInspectionsList> {
  const res = await apiService.get<ReportInspectionsListResponseDto>(
    `/v1/reports/${reportId}/inspections`
  );
  return mapReportInspectionsListResponse(res.data);
}

/**
 * GET /v1/inspections/{id} — [InspectionLEO] chi tiết hồ sơ xử phạt.
 */
export async function adaptFetchInspectionDetail(id: string): Promise<InspectionDetail> {
  const res = await apiService.get<InspectionDetailResponseDto>(`/v1/inspections/${id}`);
  return mapInspectionDetailResponse(res.data);
}

/**
 * GET /v1/inspections/{id}/payments — [Inspector/LEO] lịch sử nộp phạt (BR-INS-020).
 */
export async function adaptFetchInspectionPayments(id: string): Promise<InspectionPaymentsHistory> {
  const res = await apiService.get<InspectionPaymentsHistoryResponseDto>(
    `/v1/inspections/${id}/payments`
  );
  return mapInspectionPaymentsHistoryResponse(res.data);
}

/**
 * PUT /v1/inspections/{id}/assign-team — gán / đổi đội kiểm tra.
 */
export async function adaptAssignInspectionTeam(
  inspectionId: string,
  input: AssignInspectionTeamInput
): Promise<AssignInspectionTeamResult> {
  const body: AssignInspectionTeamBodyDto = {
    assignedTeamId: input.assignedTeamId,
  };
  const res = await apiService.put<AssignInspectionTeamResponseDto>(
    `/v1/inspections/${inspectionId}/assign-team`,
    body
  );
  return mapAssignInspectionTeamResponse(res.data);
}

/**
 * Upload ảnh biên lai tối đa 10MB — timeout mặc định 15s của L1 quá ngắn,
 * mạng chậm sẽ ECONNABORTED trong khi BE đã commit → user bấm lại → ghi trùng.
 */
const RECORD_PAYMENT_TIMEOUT_MS = 120_000;

/**
 * PUT /v1/inspections/{id}/record-payment — [LEO] ghi nhận nộp phạt (BR-INS-020, BR-ORG-012).
 * multipart/form-data — `receipt` (ảnh biên lai) bắt buộc.
 *
 * Endpoint KHÔNG idempotent (mỗi lần gọi tạo 1 PenaltyPayment). Truyền `idempotencyKey`
 * để interceptor 401-refresh-replay hoặc user retry sau timeout không ghi phạt 2 lần.
 */
export async function adaptRecordInspectionPayment(
  inspectionId: string,
  input: RecordInspectionPaymentInput
): Promise<RecordInspectionPaymentResult> {
  const buildFormData = () => {
    // Tạo mới mỗi lần retry — FormData chứa File stream có thể đã bị consume.
    const formData = new FormData();
    formData.append('paidAmount', String(input.paidAmount));
    formData.append('paidAt', input.paidAt);
    formData.append('receipt', input.receipt);
    if (input.note?.trim()) formData.append('note', input.note.trim());
    return formData;
  };

  const res = await withOptionalIdempotency(input.idempotencyKey, key =>
    // BE là PUT multipart — apiService.upload() chỉ hỗ trợ POST, nên gọi put() trực tiếp.
    // Content-Type phải set null: axios instance có default 'application/json' (core.ts),
    // mà axios chỉ tự sinh boundary cho FormData khi header này TRỐNG. Để nguyên default
    // → gửi application/json kèm body FormData → BE trả 415 UNSUPPORTED_MEDIA_TYPE.
    apiService.put<RecordInspectionPaymentResponseDto>(
      `/v1/inspections/${inspectionId}/record-payment`,
      buildFormData(),
      mergeIdempotencyConfig(key, {
        timeout: RECORD_PAYMENT_TIMEOUT_MS,
        headers: { 'Content-Type': null },
      })
    )
  );
  return mapRecordInspectionPaymentResponse(res.data);
}

function buildInspectionOfficerQueueQuery(
  params?: InspectionOfficerQueueParams
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.status) query.status = params.status;
  const assignedTeamId = params?.assignedTeamId?.trim();
  if (assignedTeamId) query.assignedTeamId = assignedTeamId;
  if (params?.unassignedOnly !== undefined) query.unassignedOnly = params.unassignedOnly;
  if (params?.slaBreached !== undefined) query.slaBreached = params.slaBreached;
  if (params?.fromDate?.trim()) query.fromDate = params.fromDate.trim();
  if (params?.toDate?.trim()) query.toDate = params.toDate.trim();
  const search = params?.search?.trim();
  if (search) query.search = search;
  if (params?.sortBy?.trim()) query.sortBy = params.sortBy.trim();
  if (params?.sortDir?.trim()) query.sortDir = params.sortDir.trim();
  return query;
}

/**
 * GET /v1/inspections/officer-queue — [LEO/DEO] hàng đợi hồ sơ xử phạt.
 */
export async function adaptFetchInspectionOfficerQueue(
  params?: InspectionOfficerQueueParams
): Promise<ApiEnvelope<InspectionOfficerQueueData>> {
  const res = await apiService.get<ApiEnvelope<InspectionOfficerQueueDataDto>>(
    '/v1/inspections/officer-queue',
    buildInspectionOfficerQueueQuery(params)
  );
  return mapApiEnvelope(res.data, mapInspectionOfficerQueueDataDto);
}
