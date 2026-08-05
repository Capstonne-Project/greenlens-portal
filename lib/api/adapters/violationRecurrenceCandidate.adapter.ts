import type { ViolationRecurrenceCandidatesDataDto } from '@/lib/api/dto/violationRecurrenceCandidate.dto';
import { mapViolationRecurrenceCandidatesDataDto } from '@/lib/api/mappers/violationRecurrenceCandidate.mapper';
import type {
  ViolationRecurrenceCandidatesData,
  ViolationRecurrenceCandidatesParams,
} from '@/lib/api/models/violationRecurrenceCandidate';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '@/lib/api/core';

function buildViolationRecurrenceCandidatesQuery(
  params?: ViolationRecurrenceCandidatesParams
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.status) query.status = params.status;
  if (params?.severity) query.severity = params.severity;
  if (params?.categoryId?.trim()) query.categoryId = params.categoryId.trim();
  if (params?.wardCode?.trim()) query.wardCode = params.wardCode.trim();
  if (params?.fromDate?.trim()) query.fromDate = params.fromDate.trim();
  if (params?.toDate?.trim()) query.toDate = params.toDate.trim();
  const search = params?.search?.trim();
  if (search) query.search = search;
  if (params?.minDaysSincePriorClosed != null) {
    query.minDaysSincePriorClosed = params.minDaysSincePriorClosed;
  }
  if (params?.maxDaysSincePriorClosed != null) {
    query.maxDaysSincePriorClosed = params.maxDaysSincePriorClosed;
  }
  if (params?.sortBy) query.sortBy = params.sortBy;
  if (params?.sortDir) query.sortDir = params.sortDir;
  return query;
}

/**
 * GET /v1/reports/violation-recurrence-candidates — [LEO/DEO] danh sách báo cáo nghi tái phạm.
 * BR-REP-034: cùng category, ≤25m, prior Closed trong 30 ngày; kèm media 2 bên để LEO so sánh.
 */
export async function adaptFetchViolationRecurrenceCandidates(
  params?: ViolationRecurrenceCandidatesParams
): Promise<ApiEnvelope<ViolationRecurrenceCandidatesData>> {
  const res = await apiService.get<ApiEnvelope<ViolationRecurrenceCandidatesDataDto>>(
    '/v1/reports/violation-recurrence-candidates',
    buildViolationRecurrenceCandidatesQuery(params)
  );
  return mapApiEnvelope(res.data, mapViolationRecurrenceCandidatesDataDto);
}
