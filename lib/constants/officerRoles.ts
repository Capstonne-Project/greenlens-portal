import { normalizeApiRole, type UserRole } from '@/lib/constants/systemRoles';

/** UserRole BE được phép vào cổng `/officer` — chỉ DEO và LEO. */
export const OFFICER_API_ROLES = ['DEO', 'LEO'] as const;

export type OfficerApiRole = (typeof OFFICER_API_ROLES)[number];

export const OFFICER_ROLE_LABEL_VI: Record<OfficerApiRole, string> = {
  DEO: 'Cán bộ sở (DEO)',
  LEO: 'Cán bộ phường (LEO)',
};

/** Default home khi sai sub-role ACL (proxy redirect). */
export const OFFICER_ACL_FALLBACK_PATH = '/officer/map';

/**
 * Sub-route ACL trong cổng `/officer` — UX guard (proxy).
 * Path không khớp rule nào → cho cả DEO + LEO (shared: map, dashboard, kpi, …).
 * Match longest prefix.
 */
export const OFFICER_ROUTE_ACL: ReadonlyArray<{
  prefix: string;
  roles: readonly OfficerApiRole[];
}> = [
  { prefix: '/officer/verify', roles: ['LEO'] },
  { prefix: '/officer/assign', roles: ['LEO'] },
  { prefix: '/officer/tracking', roles: ['LEO'] },
  { prefix: '/officer/workforce', roles: ['LEO'] },
  { prefix: '/officer/companies', roles: ['DEO'] },
  { prefix: '/officer/reports', roles: ['DEO'] },
];

export function parseOfficerApiRole(role: string | undefined): OfficerApiRole | null {
  if (!role?.trim()) return null;
  const canonical = normalizeApiRole(role);
  if (canonical === 'DEO' || canonical === 'LEO') {
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

/** Danh sách doanh nghiệp trong map shell — chỉ DEO. */
export function canAccessCompanies(systemRole: UserRole | string | undefined): boolean {
  return parseOfficerApiRole(systemRole) === 'DEO';
}

/** Danh sách văn phòng MT (my-offices) — chỉ DEO. */
export function canAccessDeoReports(systemRole: UserRole | string | undefined): boolean {
  return parseOfficerApiRole(systemRole) === 'DEO';
}

/** Layout phân công DEO — báo cáo + đơn vị VP (không tab đội/thành viên). */
export function isDeoOfficer(systemRole: UserRole | string | undefined): boolean {
  return parseOfficerApiRole(systemRole) === 'DEO';
}

/** Phân công / theo dõi / xác minh queue — chỉ LEO. */
export function isLeoOfficer(systemRole: UserRole | string | undefined): boolean {
  return parseOfficerApiRole(systemRole) === 'LEO';
}

/** Hàng đợi xác minh — chỉ LEO (DEO xác minh qua bản đồ). */
export function canAccessVerifyQueue(systemRole: UserRole | string | undefined): boolean {
  return isLeoOfficer(systemRole);
}

/**
 * UX ACL cho `/officer/*`.
 * - `allow`: role được vào (hoặc path shared / chưa liệt kê)
 * - `deny`: path có rule và role không khớp → proxy redirect
 * - `skip`: chưa parse được DEO/LEO (để silent-refresh / token lạ qua, BE vẫn enforce)
 */
export function matchOfficerRouteAcl(
  pathname: string,
  systemRole: string | undefined
): 'allow' | 'deny' | 'skip' {
  const role = parseOfficerApiRole(systemRole);
  if (!role) return 'skip';

  let best: (typeof OFFICER_ROUTE_ACL)[number] | null = null;
  for (const rule of OFFICER_ROUTE_ACL) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      if (!best || rule.prefix.length > best.prefix.length) {
        best = rule;
      }
    }
  }

  if (!best) return 'allow';
  return best.roles.includes(role) ? 'allow' : 'deny';
}
