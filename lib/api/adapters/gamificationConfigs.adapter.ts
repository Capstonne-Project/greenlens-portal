import type { UpdateGamificationConfigBodyDto } from '@/lib/api/dto/gamificationConfig.dto';
import type { GamificationConfigListDataDto } from '@/lib/api/dto/gamificationConfig.dto';
import { mapGamificationConfigListDataDto } from '@/lib/api/mappers/gamificationConfig.mapper';
import type {
  GamificationConfig,
  UpdateGamificationConfigInput,
} from '@/lib/api/models/gamificationConfig';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '@/lib/api/core';

const DEFAULT_LIST_QUERY = {
  page: 1,
  pageSize: 100,
  sortBy: 'actionType',
  sortDesc: false,
} as const;

/** GET /v1/admin/gamification-configs — data.items (phân trang BE). */
export async function adaptGamificationConfigsList(): Promise<ApiEnvelope<GamificationConfig[]>> {
  const res = await apiService.get<ApiEnvelope<GamificationConfigListDataDto>>(
    '/v1/admin/gamification-configs',
    DEFAULT_LIST_QUERY
  );
  return mapApiEnvelope(res.data, mapGamificationConfigListDataDto);
}

/** PUT /v1/admin/gamification-configs/{id} */
export async function adaptUpdateGamificationConfig(
  id: string,
  body: UpdateGamificationConfigInput
): Promise<ApiEnvelope<null>> {
  const payload: UpdateGamificationConfigBodyDto = {
    points: body.points,
    description: body.description.trim(),
    isActive: body.isActive,
  };
  const res = await apiService.put<ApiEnvelope<unknown>>(
    `/v1/admin/gamification-configs/${encodeURIComponent(id)}`,
    payload
  );
  return {
    code: res.data.code,
    message: res.data.message,
    status: res.data.status,
    data: null,
  };
}
