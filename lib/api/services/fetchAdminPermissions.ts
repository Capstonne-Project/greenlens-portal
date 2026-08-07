/**
 * L2 — Admin permissions catalog (read-only).
 */
import { adaptAdminPermissionsList } from '@/lib/api/adapters/adminPermissions.adapter';
import type { AdminPermissionsList } from '@/lib/api/models/adminPermission';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type { AdminPermission, AdminPermissionsList } from '@/lib/api/models/adminPermission';

export async function fetchAdminPermissions(): Promise<ApiEnvelope<AdminPermissionsList>> {
  return adaptAdminPermissionsList();
}

export default { fetchAdminPermissions };
