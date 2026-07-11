/**
 * L2 — Penalty frameworks (admin).
 */
import {
  adaptCreatePenaltyFramework,
  adaptPenaltyFrameworksList,
} from '@/lib/api/adapters/penaltyFrameworks.adapter';
import type {
  CreatedPenaltyFramework,
  CreatePenaltyFrameworkInput,
  PenaltyFrameworksList,
  PenaltyFrameworksListParams,
} from '@/lib/api/models/penaltyFramework';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  CreatedPenaltyFramework,
  CreatePenaltyFrameworkInput,
  PenaltyFramework,
  PenaltyFrameworkPagination,
  PenaltyFrameworksList,
  PenaltyFrameworksListParams,
} from '@/lib/api/models/penaltyFramework';

/** GET /v1/admin/penalty-frameworks — danh sách khung xử phạt. */
export async function fetchPenaltyFrameworks(
  params?: PenaltyFrameworksListParams
): Promise<ApiEnvelope<PenaltyFrameworksList>> {
  return adaptPenaltyFrameworksList(params);
}

/** POST /v1/admin/penalty-frameworks — tạo khung xử phạt. */
export async function createPenaltyFramework(
  body: CreatePenaltyFrameworkInput
): Promise<ApiEnvelope<CreatedPenaltyFramework>> {
  return adaptCreatePenaltyFramework(body);
}

const penaltyFrameworkApi = {
  fetchPenaltyFrameworks,
  createPenaltyFramework,
};

export default penaltyFrameworkApi;
