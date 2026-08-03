import type {
  DismissViolationRecurrenceResponseDto,
  ViolationRecurrenceComparisonResponseDto,
} from '@/lib/api/dto/violationRecurrence.dto';
import type {
  DismissViolationRecurrenceResult,
  ViolationRecurrenceComparison,
} from '@/lib/api/models/violationRecurrence';
import {
  mapDismissViolationRecurrenceResponse,
  mapViolationRecurrenceComparisonDto,
} from '@/lib/api/mappers/violationRecurrence.mapper';
import apiService from '@/lib/api/core';

/**
 * GET /v1/reports/{id}/violation-recurrence-comparison — BR-REP-034.
 * `id` = báo cáo hiện tại đang bị gắn cờ tái phát (không phải prior Closed).
 */
export async function adaptFetchViolationRecurrenceComparison(
  reportId: string
): Promise<ViolationRecurrenceComparison> {
  const res = await apiService.get<ViolationRecurrenceComparisonResponseDto>(
    `/v1/reports/${reportId}/violation-recurrence-comparison`
  );
  return mapViolationRecurrenceComparisonDto(res.data.data);
}

/**
 * POST /v1/reports/{id}/dismiss-violation-recurrence — BR-REP-034.
 * LEO bác bỏ nghi tái phát (rác tái phát thông thường, không mở thanh tra).
 */
export async function adaptDismissViolationRecurrence(
  reportId: string
): Promise<DismissViolationRecurrenceResult> {
  const res = await apiService.post<DismissViolationRecurrenceResponseDto>(
    `/v1/reports/${reportId}/dismiss-violation-recurrence`
  );
  return mapDismissViolationRecurrenceResponse(res.data);
}
