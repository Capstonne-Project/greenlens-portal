import { normalizeApiRole, type UserRole } from '@/lib/constants/systemRoles';

/** UserRole BE thuộc cổng officer (DEO / LEO / Inspector). */
export const OFFICER_API_ROLES = ['DEO', 'LEO', 'Inspector'] as const;

export type OfficerApiRole = (typeof OFFICER_API_ROLES)[number];

export const OFFICER_ROLE_LABEL_VI: Record<OfficerApiRole, string> = {
  DEO: 'Cán bộ sở (DEO)',
  LEO: 'Cán bộ phường (LEO)',
  Inspector: 'Thanh tra (Inspector)',
};

export function parseOfficerApiRole(role: string | undefined): OfficerApiRole | null {
  if (!role?.trim()) return null;
  const canonical = normalizeApiRole(role);
  if (canonical === 'DEO' || canonical === 'LEO' || canonical === 'Inspector') {
    return canonical;
  }
  return null;
}

export function isOfficerApiRole(role: UserRole | string): role is OfficerApiRole {
  return parseOfficerApiRole(role) !== null;
}

/** Subtitle navbar officer từ `AuthUser.systemRole`. */
export function officerPortalSubtitle(systemRole: UserRole | undefined): string {
  const officerRole = parseOfficerApiRole(systemRole);
  if (officerRole) return OFFICER_ROLE_LABEL_VI[officerRole];
  return 'Cổng cán bộ';
}

/** Màn xác minh báo cáo — chỉ DEO (cán bộ sở). */
export function canAccessVerifyQueue(systemRole: UserRole | string | undefined): boolean {
  return parseOfficerApiRole(systemRole) === 'DEO';
}

/** Layout phân công DEO — báo cáo + đơn vị VP (không tab đội/thành viên). */
export function isDeoOfficer(systemRole: UserRole | string | undefined): boolean {
  return parseOfficerApiRole(systemRole) === 'DEO';
}
