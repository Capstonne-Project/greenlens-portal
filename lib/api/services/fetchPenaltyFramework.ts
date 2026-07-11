/**
 * L2 — Penalty frameworks (admin).
 */
import {
  adaptCreatePenaltyFramework,
  adaptPenaltyFrameworksList,
  adaptTogglePenaltyFramework,
  adaptUpdatePenaltyFramework,
} from '@/lib/api/adapters/penaltyFrameworks.adapter';
import type {
  CreatedPenaltyFramework,
  CreatePenaltyFrameworkInput,
  PenaltyFrameworksList,
  PenaltyFrameworksListParams,
  TogglePenaltyFrameworkInput,
  UpdatePenaltyFrameworkInput,
} from '@/lib/api/models/penaltyFramework';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  CreatedPenaltyFramework,
  CreatePenaltyFrameworkInput,
  PenaltyFramework,
  PenaltyFrameworkPagination,
  PenaltyFrameworksList,
  PenaltyFrameworksListParams,
  TogglePenaltyFrameworkInput,
  UpdatePenaltyFrameworkInput,
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

/** PUT /v1/admin/penalty-frameworks/{id} — cập nhật khung xử phạt. */
export async function updatePenaltyFramework(
  id: string,
  body: UpdatePenaltyFrameworkInput
): Promise<ApiEnvelope<string | null>> {
  return adaptUpdatePenaltyFramework(id, body);
}

/** PATCH /v1/admin/penalty-frameworks/{id}/toggle — bật/tắt khung xử phạt. */
export async function togglePenaltyFramework(
  id: string,
  body: TogglePenaltyFrameworkInput
): Promise<ApiEnvelope<string | null>> {
  return adaptTogglePenaltyFramework(id, body);
}

const penaltyFrameworkApi = {
  fetchPenaltyFrameworks,
  createPenaltyFramework,
  updatePenaltyFramework,
  togglePenaltyFramework,
};

export default penaltyFrameworkApi;
