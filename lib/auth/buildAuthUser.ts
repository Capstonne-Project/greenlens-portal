import { mapApiRoleToAuth } from '@/lib/auth/mapUser';
import { isSystemRole, normalizeApiRole, type UserRole } from '@/lib/constants/systemRoles';
import type { AuthUser } from '@/lib/store/authStore';

/** Map response login/JWT → session FE (route bucket + role BE). */
export function buildAuthUserFromApi(dto: {
  id: string;
  email: string;
  fullName: string;
  role: string;
  mustChangePassword?: boolean;
}): AuthUser {
  const canonical = normalizeApiRole(dto.role);
  return {
    id: dto.id,
    email: dto.email,
    name: dto.fullName,
    role: mapApiRoleToAuth(dto.role),
    systemRole: isSystemRole(canonical) ? canonical : undefined,
    mustChangePassword: Boolean(dto.mustChangePassword),
  };
}

export function buildAuthUserFromTokenClaims(claims: {
  sub?: string;
  email?: string;
  name?: string;
  roleRaw: string;
}): AuthUser | null {
  const email = claims.email?.trim() ?? '';
  const sub = claims.sub?.trim() ?? '';
  if (!email && !sub) return null;

  const displayName = claims.name?.trim() || (email ? email.split('@')[0] : '') || 'Người dùng';

  const canonical = normalizeApiRole(claims.roleRaw || 'Citizen');

  return {
    id: sub || email,
    email: email || sub,
    name: displayName,
    role: mapApiRoleToAuth(claims.roleRaw || 'Citizen'),
    systemRole: isSystemRole(canonical) ? canonical : undefined,
  };
}

export function getSystemRole(user: AuthUser | null): UserRole | undefined {
  return user?.systemRole;
}
