import type { DuplicateCandidateDetailResponseDto } from '@/lib/api/dto/duplicateCandidateDetail.dto';
import { mapDuplicateCandidateDetailDto } from '@/lib/api/mappers/duplicateCandidateDetail.mapper';
import type { DuplicateCandidateDetail } from '@/lib/api/models/duplicateCandidateDetail';
import apiService from '@/lib/api/core';

/**
 * GET /v1/reports/{id}/duplicate-candidate-detail — BR-REP-031/032.
 * `id` = báo cáo nghi trùng (không phải primary).
 */
export async function adaptFetchDuplicateCandidateDetail(
  reportId: string
): Promise<DuplicateCandidateDetail> {
  const res = await apiService.get<DuplicateCandidateDetailResponseDto>(
    `/v1/reports/${reportId}/duplicate-candidate-detail`
  );
  return mapDuplicateCandidateDetailDto(res.data.data);
}
