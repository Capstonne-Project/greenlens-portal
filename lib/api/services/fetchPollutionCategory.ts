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
  type AdminPollutionCategoriesParams,
} from '@/lib/api/adapters/pollutionCategories.adapter';
import type {
  ArchivePollutionCategoryInput,
  CreatePollutionCategoryInput,
  PollutionCategoryList,
  PollutionCategoryMutationResult,
  UpdatePollutionCategoryInput,
} from '@/lib/api/models/pollutionCategory';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type { AdminPollutionCategoriesParams };

export type {
  ArchivePollutionCategoryInput,
  CreatePollutionCategoryInput,
  PollutionCategory,
  PollutionCategoryList,
  PollutionCategoryMutationResult,
  UpdatePollutionCategoryInput,
} from '@/lib/api/models/pollutionCategory';

export async function fetchCatalogPollutionCategories(): Promise<
  ApiEnvelope<PollutionCategoryList>
> {
  return adaptCatalogPollutionCategories();
}

export async function fetchAdminPollutionCategories(
  params?: AdminPollutionCategoriesParams
): Promise<ApiEnvelope<PollutionCategoryList>> {
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

export default {
  fetchCatalogPollutionCategories,
  fetchAdminPollutionCategories,
  createPollutionCategory,
  updatePollutionCategory,
  archivePollutionCategory,
  deletePollutionCategory,
};
