import type { ViolationRecurrenceCandidatesDataDto } from '@/lib/api/dto/violationRecurrenceCandidate.dto';
import { mapViolationRecurrenceCandidatesDataDto } from '@/lib/api/mappers/violationRecurrenceCandidate.mapper';
import type {
  ViolationRecurrenceCandidatesData,
  ViolationRecurrenceCandidatesParams,
} from '@/lib/api/models/violationRecurrenceCandidate';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '@/lib/api/core';

/**
 * GET /v1/reports/violation-recurrence-candidates — [LEO/DEO] danh sách báo cáo nghi tái phạm.
 * BR-REP-034: cùng category, ≤50m, prior Closed trong 30 ngày; kèm media 2 bên để LEO so sánh.
 */
export async function adaptFetchViolationRecurrenceCandidates(
  params?: ViolationRecurrenceCandidatesParams
): Promise<ApiEnvelope<ViolationRecurrenceCandidatesData>> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;

  const res = await apiService.get<ApiEnvelope<ViolationRecurrenceCandidatesDataDto>>(
    '/v1/reports/violation-recurrence-candidates',
    query
  );
  return mapApiEnvelope(res.data, mapViolationRecurrenceCandidatesDataDto);
}
