/**
 * L2 — Waste tags (admin).
 */
import {
  adaptAdminWasteTags,
  adaptCatalogWasteTags,
  adaptCreateWasteTag,
  adaptDeleteWasteTag,
  adaptToggleWasteTag,
  adaptUpdateWasteTag,
  type AdminWasteTagsParams,
} from '@/lib/api/adapters/wasteTags.adapter';
import type {
  CreateWasteTagInput,
  ToggleWasteTagInput,
  UpdateWasteTagInput,
  WasteTagList,
  WasteTagMutationResult,
} from '@/lib/api/models/wasteTag';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type { AdminWasteTagsParams };

export type {
  CreateWasteTagInput,
  ToggleWasteTagInput,
  UpdateWasteTagInput,
  WasteTag,
  WasteTagList,
  WasteTagMutationResult,
} from '@/lib/api/models/wasteTag';

export async function fetchCatalogWasteTags(): Promise<ApiEnvelope<WasteTagList>> {
  return adaptCatalogWasteTags();
}

export async function fetchAdminWasteTags(
  params?: AdminWasteTagsParams
): Promise<ApiEnvelope<WasteTagList>> {
  return adaptAdminWasteTags(params);
}

export async function createWasteTag(
  body: CreateWasteTagInput
): Promise<ApiEnvelope<WasteTagMutationResult>> {
  return adaptCreateWasteTag(body);
}

export async function updateWasteTag(id: string, body: UpdateWasteTagInput): Promise<void> {
  return adaptUpdateWasteTag(id, body);
}

export async function toggleWasteTag(id: string, body: ToggleWasteTagInput): Promise<void> {
  return adaptToggleWasteTag(id, body);
}

export async function deleteWasteTag(id: string): Promise<void> {
  return adaptDeleteWasteTag(id);
}

const wasteTagApi = {
  fetchCatalogWasteTags,
  fetchAdminWasteTags,
  createWasteTag,
  updateWasteTag,
  toggleWasteTag,
  deleteWasteTag,
};

export default wasteTagApi;
