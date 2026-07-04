/**
 * L2 — Admin users service (thin).
 * HTTP + normalize: adapters. FE contract: models. UI/hooks không import DTO.
 */
import {
  adaptAdminAllUsers,
  adaptAdminUsersList,
  adaptChangeAdminUserRole,
  adaptCreateAdminUser,
  adaptDeleteAdminUser,
  adaptUpdateAdminUser,
  clearAdminAllUsersCache,
} from '@/lib/api/adapters/adminUsers.adapter';
import type {
  AdminUser,
  AdminUserMutationResult,
  AdminUsersList,
  AdminUsersListParams,
  CreateAdminUserInput,
  UpdateAdminUserInput,
} from '@/lib/api/models/adminUser';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  AdminUser,
  AdminUserMutationResult,
  AdminUsersList,
  AdminUsersListParams,
  CreateAdminUserInput,
  UpdateAdminUserInput,
  PaginationMeta,
} from '@/lib/api/models/adminUser';

/** @deprecated Dùng `AdminUser` từ `@/lib/api/models/adminUser` */
export type AdminUserItem = AdminUser;
/** @deprecated Dùng `AdminUsersList` */
export type AdminUsersPaged = AdminUsersList;
/** @deprecated Dùng `AdminUsersListParams` */
export type AdminUsersQueryParams = AdminUsersListParams;
/** @deprecated Dùng `CreateAdminUserInput` */
export type CreateAdminUserBody = CreateAdminUserInput;
/** @deprecated Dùng `UpdateAdminUserInput` */
export type UpdateAdminUserBody = UpdateAdminUserInput;
/** @deprecated Dùng `AdminUserMutationResult` */
export type AdminUserMutationData = AdminUserMutationResult;
/** @deprecated Dùng `AdminUserMutationResult` */
export type CreateAdminUserData = AdminUserMutationResult & {
  email: string;
  fullName: string;
  role: string;
};

export { clearAdminAllUsersCache };

export async function fetchAdminUsers(
  params?: AdminUsersListParams
): Promise<ApiEnvelope<AdminUsersList>> {
  return adaptAdminUsersList(params);
}

export async function fetchAdminAllUsers(): Promise<ApiEnvelope<AdminUser[]>> {
  return adaptAdminAllUsers();
}

export async function createAdminUser(
  body: CreateAdminUserInput
): Promise<
  ApiEnvelope<AdminUserMutationResult & { email: string; fullName: string; role: string }>
> {
  return adaptCreateAdminUser(body);
}

export async function updateAdminUser(
  id: string,
  body: UpdateAdminUserInput
): Promise<ApiEnvelope<AdminUserMutationResult>> {
  return adaptUpdateAdminUser(id, body);
}

export async function deleteAdminUser(id: string): Promise<ApiEnvelope<AdminUserMutationResult>> {
  return adaptDeleteAdminUser(id);
}

export async function changeAdminUserRole(id: string, newRole: string): Promise<void> {
  return adaptChangeAdminUserRole(id, newRole);
}

export default {
  fetchAdminUsers,
  fetchAdminAllUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  changeAdminUserRole,
};
