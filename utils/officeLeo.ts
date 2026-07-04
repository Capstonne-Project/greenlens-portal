import type { AdminUser } from '@/lib/api/models/adminUser';
import type { OfficeListItem } from '@/lib/api/models/office';
import { normalizeApiRole } from '@/lib/constants/systemRoles';

export function collectAssignedOfficerIds(offices: OfficeListItem[]): Set<string> {
  const ids = new Set<string>();
  for (const office of offices) {
    if (office.officerId) ids.add(office.officerId);
  }
  return ids;
}

/** Chỉ LEO chưa được gán phụ trách văn phòng nào. */
export function filterUnassignedLeoUsers(
  users: AdminUser[],
  assignedOfficerIds: Set<string>
): AdminUser[] {
  return users.filter(u => normalizeApiRole(u.role) === 'LEO' && !assignedOfficerIds.has(u.id));
}
