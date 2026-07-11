import type {
  CreatePenaltyFrameworkBodyDto,
  CreatePenaltyFrameworkDataDto,
  PenaltyFrameworksListDataDto,
  PenaltyFrameworksListParamsDto,
} from '@/lib/api/dto/penaltyFramework.dto';
import {
  mapCreatePenaltyFrameworkDataDto,
  mapPenaltyFrameworksListDataDto,
} from '@/lib/api/mappers/penaltyFramework.mapper';
import type {
  CreatedPenaltyFramework,
  CreatePenaltyFrameworkInput,
  PenaltyFrameworksList,
  PenaltyFrameworksListParams,
} from '@/lib/api/models/penaltyFramework';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

function buildPenaltyFrameworksQuery(
  params?: PenaltyFrameworksListParamsDto
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.categoryId?.trim()) query.categoryId = params.categoryId.trim();
  if (params?.violationLevel?.trim()) query.violationLevel = params.violationLevel.trim();
  if (params?.isActive !== undefined) query.isActive = params.isActive;
  return query;
}

function buildCreatePenaltyFrameworkBody(
  body: CreatePenaltyFrameworkInput
): CreatePenaltyFrameworkBodyDto {
  const payload: CreatePenaltyFrameworkBodyDto = {
    categoryId: body.categoryId.trim(),
    violationLevel: body.violationLevel.trim(),
    minAmount: body.minAmount,
    maxAmount: body.maxAmount,
    effectiveFrom: body.effectiveFrom.trim(),
  };

  if (body.effectiveTo !== undefined) {
    payload.effectiveTo = body.effectiveTo?.trim() || null;
  }

  return payload;
}

/** GET /v1/admin/penalty-frameworks — danh sách khung xử phạt. */
export async function adaptPenaltyFrameworksList(
  params?: PenaltyFrameworksListParams
): Promise<ApiEnvelope<PenaltyFrameworksList>> {
  const res = await apiService.get<ApiEnvelope<PenaltyFrameworksListDataDto>>(
    '/v1/admin/penalty-frameworks',
    buildPenaltyFrameworksQuery(params)
  );
  return mapApiEnvelope(res.data, mapPenaltyFrameworksListDataDto);
}

/** POST /v1/admin/penalty-frameworks — tạo khung xử phạt. */
export async function adaptCreatePenaltyFramework(
  body: CreatePenaltyFrameworkInput
): Promise<ApiEnvelope<CreatedPenaltyFramework>> {
  const payload = buildCreatePenaltyFrameworkBody(body);
  const res = await apiService.post<ApiEnvelope<CreatePenaltyFrameworkDataDto>>(
    '/v1/admin/penalty-frameworks',
    payload
  );
  return mapApiEnvelope(res.data, mapCreatePenaltyFrameworkDataDto);
}
