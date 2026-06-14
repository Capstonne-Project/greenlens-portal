import { buildAuthUserFromTokenClaims } from '@/lib/auth/buildAuthUser';
import type { AuthUser } from '@/lib/store/authStore';
import { decodeJwt } from 'jose';

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

/** Decode JWT access token (UX only — BE validates). */
export function getUserFromAccessToken(token: string): AuthUser | null {
  try {
    const p = decodeJwt(token);
    const email = typeof p.email === 'string' ? p.email : '';
    const roleRaw =
      typeof p[ROLE_CLAIM] === 'string' ? p[ROLE_CLAIM] : typeof p.role === 'string' ? p.role : '';
    const sub = typeof p.sub === 'string' ? p.sub : '';
    const displayName =
      typeof p.unique_name === 'string'
        ? p.unique_name
        : typeof p.name === 'string'
          ? p.name
          : undefined;

    return buildAuthUserFromTokenClaims({
      sub,
      email,
      name: displayName,
      roleRaw: roleRaw || 'Citizen',
    });
  } catch {
    return null;
  }
}
