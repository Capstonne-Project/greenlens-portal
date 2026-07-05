/**
 * UserRole khớp BE: Citizen | DEO | LEO | Cleaner | Inspector | Admin
 */

export const SYSTEM_ROLES = [
  'Admin',
  'Citizen',
  'DEO',
  'LEO',
  'Cleaner',
  'Cleanup',
  'Inspector',
  'CompanyManager',
] as const;

/** Alias khớp tên enum BE (`UserRole`). */
export type UserRole = (typeof SYSTEM_ROLES)[number];

export type SystemRole = UserRole;

/** Giá trị role cũ → role chuẩn (tương thích JWT/DB legacy). */
export const LEGACY_ROLE_TO_CANONICAL: Record<string, UserRole> = {
  CleanupTeam: 'Cleaner',
  'Cleanup Team': 'Cleaner',
  Officer: 'Inspector',
  EnvironmentalOfficer: 'Inspector',
  'Environmental Officer': 'Inspector',
};

export function normalizeApiRole(role: string): string {
  const trimmed = role.trim();
  if (!trimmed) return trimmed;
  const legacy = LEGACY_ROLE_TO_CANONICAL[trimmed];
  if (legacy) return legacy;
  const match = SYSTEM_ROLES.find(r => r.toLowerCase() === trimmed.toLowerCase());
  return match ?? trimmed;
}

export function isSystemRole(role: string): role is UserRole {
  return SYSTEM_ROLES.some(r => r.toLowerCase() === role.trim().toLowerCase());
}

export function isUserRole(role: string): role is UserRole {
  return isSystemRole(role);
}
