import type {
  SpamSuspectsListDataDto,
  SpamSuspectsListParamsDto,
} from '@/lib/api/dto/spamSuspect.dto';
import { mapSpamSuspectsListDataDto } from '@/lib/api/mappers/spamSuspect.mapper';
import type { SpamSuspectsList, SpamSuspectsListParams } from '@/lib/api/models/spamSuspect';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '@/lib/api/core';

function buildQuery(params?: SpamSuspectsListParamsDto): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.minReportsPerHour != null) query.minReportsPerHour = params.minReportsPerHour;
  if (params?.minRejected7Days != null) query.minRejected7Days = params.minRejected7Days;
  if (params?.minAiFlagged != null) query.minAiFlagged = params.minAiFlagged;
  return query;
}

/** GET /v1/admin/spam-suspects */
export async function adaptSpamSuspectsList(
  params?: SpamSuspectsListParams
): Promise<ApiEnvelope<SpamSuspectsList>> {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.max(1, params?.pageSize ?? 20);
  const query = buildQuery({
    page,
    pageSize,
    minReportsPerHour: params?.minReportsPerHour,
    minRejected7Days: params?.minRejected7Days,
    minAiFlagged: params?.minAiFlagged,
  });

  const res = await apiService.get<ApiEnvelope<SpamSuspectsListDataDto>>(
    '/v1/admin/spam-suspects',
    query
  );

  return mapApiEnvelope(res.data, data => mapSpamSuspectsListDataDto(data, page, pageSize));
}
