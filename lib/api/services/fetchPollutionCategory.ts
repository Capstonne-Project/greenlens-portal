/**
 * L2 — Pollution categories (catalog + admin).
 */
import {
  adaptAdminPollutionCategories,
  adaptArchivePollutionCategory,
  adaptCatalogPollutionCategories,
  adaptCreatePollutionCategory,
  adaptDeletePollutionCategory,
  adaptUpdatePollutionCategory,
} from '@/lib/api/adapters/pollutionCategories.adapter';
import type {
  AdminPollutionCategoriesParams,
  ArchivePollutionCategoryInput,
  CreatePollutionCategoryInput,
  PollutionCategoryAdminList,
  PollutionCategoryList,
  PollutionCategoryMutationResult,
  UpdatePollutionCategoryInput,
} from '@/lib/api/models/pollutionCategory';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  AdminPollutionCategoriesParams,
  ArchivePollutionCategoryInput,
  CreatePollutionCategoryInput,
  PollutionCategory,
  PollutionCategoryAdminList,
  PollutionCategoryList,
  PollutionCategoryMutationResult,
  PollutionCategoryPagination,
  PollutionCategorySortBy,
  UpdatePollutionCategoryInput,
} from '@/lib/api/models/pollutionCategory';

export async function fetchCatalogPollutionCategories(): Promise<
  ApiEnvelope<PollutionCategoryList>
> {
  return adaptCatalogPollutionCategories();
}

/** GET /v1/admin/pollution-categories */
export async function fetchAdminPollutionCategories(
  params?: AdminPollutionCategoriesParams
): Promise<ApiEnvelope<PollutionCategoryAdminList>> {
  return adaptAdminPollutionCategories(params);
}

export async function createPollutionCategory(
  body: CreatePollutionCategoryInput
): Promise<ApiEnvelope<PollutionCategoryMutationResult>> {
  return adaptCreatePollutionCategory(body);
}

export async function updatePollutionCategory(
  id: string,
  body: UpdatePollutionCategoryInput
): Promise<void> {
  return adaptUpdatePollutionCategory(id, body);
}

export async function archivePollutionCategory(
  id: string,
  body: ArchivePollutionCategoryInput
): Promise<void> {
  return adaptArchivePollutionCategory(id, body);
}

export async function deletePollutionCategory(id: string): Promise<void> {
  return adaptDeletePollutionCategory(id);
}

const pollutionCategoryApi = {
  fetchCatalogPollutionCategories,
  fetchAdminPollutionCategories,
  createPollutionCategory,
  updatePollutionCategory,
  archivePollutionCategory,
  deletePollutionCategory,
};

export default pollutionCategoryApi;
