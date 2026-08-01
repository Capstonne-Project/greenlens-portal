import type { DuplicateCandidatesDataDto } from '@/lib/api/dto/duplicateCandidate.dto';
import { mapDuplicateCandidatesDataDto } from '@/lib/api/mappers/duplicateCandidate.mapper';
import type {
  DuplicateCandidatesData,
  DuplicateCandidatesParams,
} from '@/lib/api/models/duplicateCandidate';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '@/lib/api/core';

/**
 * GET /v1/reports/duplicate-candidates — [LEO/DEO] danh sách báo cáo nghi ngờ trùng lặp.
 * BR-REP-031: báo cáo bị gắn cờ possible_duplicate (Tier 1 geo/time hoặc Tier 2 AI)
 * kèm báo cáo gốc để LEO so sánh và quyết định gộp/bác bỏ.
 */
export async function adaptFetchDuplicateCandidates(
  params?: DuplicateCandidatesParams
): Promise<ApiEnvelope<DuplicateCandidatesData>> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;

  const res = await apiService.get<ApiEnvelope<DuplicateCandidatesDataDto>>(
    '/v1/reports/duplicate-candidates',
    query
  );
  return mapApiEnvelope(res.data, mapDuplicateCandidatesDataDto);
}
