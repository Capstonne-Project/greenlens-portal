import type { OfficeListItem } from '@/lib/api/models/office';

export interface OfficeDepartmentGroup {
  departmentId: string;
  departmentName: string;
  offices: OfficeListItem[];
  wardCount: number;
  onboardedCount: number;
}

export function groupOfficesByDepartment(items: OfficeListItem[]): OfficeDepartmentGroup[] {
  const map = new Map<string, OfficeDepartmentGroup>();

  for (const office of items) {
    let group = map.get(office.departmentId);
    if (!group) {
      group = {
        departmentId: office.departmentId,
        departmentName: office.departmentName,
        offices: [],
        wardCount: 0,
        onboardedCount: 0,
      };
      map.set(office.departmentId, group);
    }
    group.offices.push(office);
    group.wardCount += 1;
    if (office.isOnboarded) group.onboardedCount += 1;
  }

  for (const group of map.values()) {
    group.offices.sort((a, b) => a.wardName.localeCompare(b.wardName, 'vi'));
  }

  return Array.from(map.values()).sort((a, b) =>
    a.departmentName.localeCompare(b.departmentName, 'vi')
  );
}

/** Lọc nhóm theo tên ủy ban / tỉnh (client-side). */
export function filterDepartmentGroups(
  groups: OfficeDepartmentGroup[],
  query: string
): OfficeDepartmentGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups.filter(g => g.departmentName.toLowerCase().includes(q));
}
