import type { DuplicateCandidatesDataDto } from '@/lib/api/dto/duplicateCandidate.dto';
import { mapDuplicateCandidatesDataDto } from '@/lib/api/mappers/duplicateCandidate.mapper';
import type {
  DuplicateCandidatesData,
  DuplicateCandidatesParams,
} from '@/lib/api/models/duplicateCandidate';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '@/lib/api/core';

function buildDuplicateCandidatesQuery(
  params?: DuplicateCandidatesParams
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
  if (params?.duplicateDetectionSource?.trim()) {
    query.duplicateDetectionSource = params.duplicateDetectionSource.trim();
  }
  if (params?.minAiSimilarityScore != null) {
    query.minAiSimilarityScore = params.minAiSimilarityScore;
  }
  if (params?.sortBy) query.sortBy = params.sortBy;
  if (params?.sortDir) query.sortDir = params.sortDir;
  return query;
}

/**
 * GET /v1/reports/duplicate-candidates — [LEO/DEO] danh sách báo cáo nghi ngờ trùng lặp.
 * BR-REP-031: báo cáo bị gắn cờ possible_duplicate (Tier 1 geo/time hoặc Tier 2 AI)
 * kèm báo cáo gốc để LEO so sánh và quyết định gộp/bác bỏ.
 */
export async function adaptFetchDuplicateCandidates(
  params?: DuplicateCandidatesParams
): Promise<ApiEnvelope<DuplicateCandidatesData>> {
  const res = await apiService.get<ApiEnvelope<DuplicateCandidatesDataDto>>(
    '/v1/reports/duplicate-candidates',
    buildDuplicateCandidatesQuery(params)
  );
  return mapApiEnvelope(res.data, mapDuplicateCandidatesDataDto);
}
