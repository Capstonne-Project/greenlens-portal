/**
 * Role hệ thống khớp BE (Swagger dropdown).
 * Citizen | DEO | LEO | Cleanup | Inspector | Admin
 */

export const SYSTEM_ROLES = [
  'Admin',
  'Citizen',
  'DEO',
  'LEO',
  'Cleanup',
  'Inspector',
  'CompanyManager',
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

/** Giá trị role cũ → role mới (tương thích dữ liệu/API legacy). */
export const LEGACY_ROLE_TO_CANONICAL: Record<string, SystemRole> = {
  Officer: 'Inspector',
  EnvironmentalOfficer: 'Inspector',
  'Environmental Officer': 'Inspector',
  CleanupTeam: 'Cleanup',
  'Cleanup Team': 'Cleanup',
};

export function normalizeApiRole(role: string): string {
  const trimmed = role.trim();
  if (!trimmed) return trimmed;
  const legacy = LEGACY_ROLE_TO_CANONICAL[trimmed];
  if (legacy) return legacy;
  const match = SYSTEM_ROLES.find(r => r.toLowerCase() === trimmed.toLowerCase());
  return match ?? trimmed;
}

export function isSystemRole(role: string): role is SystemRole {
  return SYSTEM_ROLES.some(r => r.toLowerCase() === role.trim().toLowerCase());
}
