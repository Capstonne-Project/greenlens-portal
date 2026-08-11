/**
 * L2 — Admin badges (gamification).
 */
import {
  adaptAdminBadges,
  adaptToggleAdminBadge,
  adaptUpdateAdminBadge,
} from '@/lib/api/adapters/adminBadges.adapter';
import type {
  AdminBadgeList,
  AdminBadgesParams,
  ToggleAdminBadgeInput,
  UpdateAdminBadgeInput,
} from '@/lib/api/models/adminBadge';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  AdminBadge,
  AdminBadgeList,
  AdminBadgePagination,
  AdminBadgesParams,
  AdminBadgeSortBy,
  ToggleAdminBadgeInput,
  UpdateAdminBadgeInput,
} from '@/lib/api/models/adminBadge';

export async function fetchAdminBadges(
  params?: AdminBadgesParams
): Promise<ApiEnvelope<AdminBadgeList>> {
  return adaptAdminBadges(params);
}

export async function updateAdminBadge(id: string, body: UpdateAdminBadgeInput): Promise<void> {
  return adaptUpdateAdminBadge(id, body);
}

export async function toggleAdminBadge(id: string, body: ToggleAdminBadgeInput): Promise<void> {
  return adaptToggleAdminBadge(id, body);
}

const adminBadgeApi = {
  fetchAdminBadges,
  updateAdminBadge,
  toggleAdminBadge,
};

export default adminBadgeApi;
