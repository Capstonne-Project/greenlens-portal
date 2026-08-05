import type {
  BlockedWordMutationDto,
  BlockedWordsListDataDto,
  CreateBlockedWordBodyDto,
  UpdateBlockedWordBodyDto,
} from '@/lib/api/dto/blockedWord.dto';
import {
  mapBlockedWordMutationDto,
  mapBlockedWordsListDataDto,
} from '@/lib/api/mappers/blockedWord.mapper';
import type {
  BlockedWordMutationResult,
  BlockedWordsList,
  BlockedWordsListParams,
  CreateBlockedWordInput,
  UpdateBlockedWordInput,
} from '@/lib/api/models/blockedWord';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

function buildQuery(params?: BlockedWordsListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.isActive === true) query.isActive = true;
  if (params?.isActive === false) query.isActive = false;
  return query;
}

/** GET /v1/admin/blocked-words */
export async function adaptBlockedWordsList(
  params?: BlockedWordsListParams
): Promise<ApiEnvelope<BlockedWordsList>> {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.max(1, params?.pageSize ?? 20);
  const res = await apiService.get<ApiEnvelope<BlockedWordsListDataDto>>(
    '/v1/admin/blocked-words',
    buildQuery({ ...params, page, pageSize })
  );
  return mapApiEnvelope(res.data, data => mapBlockedWordsListDataDto(data, page, pageSize));
}

/** POST /v1/admin/blocked-words */
export async function adaptCreateBlockedWord(
  body: CreateBlockedWordInput
): Promise<ApiEnvelope<BlockedWordMutationResult>> {
  const payload: CreateBlockedWordBodyDto = { word: body.word.trim() };
  const res = await apiService.post<ApiEnvelope<BlockedWordMutationDto>>(
    '/v1/admin/blocked-words',
    payload
  );
  return mapApiEnvelope(res.data, mapBlockedWordMutationDto);
}

/** PUT /v1/admin/blocked-words/{id} */
export async function adaptUpdateBlockedWord(
  id: string,
  body: UpdateBlockedWordInput
): Promise<ApiEnvelope<null>> {
  const payload: UpdateBlockedWordBodyDto = {
    word: body.word.trim(),
    ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
  };
  const res = await apiService.put<ApiEnvelope<unknown>>(
    `/v1/admin/blocked-words/${encodeURIComponent(id)}`,
    payload
  );
  return {
    code: res.data.code,
    message: res.data.message,
    status: res.data.status,
    data: null,
  };
}

/** DELETE /v1/admin/blocked-words/{id} */
export async function adaptDeleteBlockedWord(id: string): Promise<ApiEnvelope<null>> {
  const res = await apiService.delete<ApiEnvelope<unknown>>(
    `/v1/admin/blocked-words/${encodeURIComponent(id)}`
  );
  return {
    code: res.data.code,
    message: res.data.message,
    status: res.data.status,
    data: null,
  };
}
