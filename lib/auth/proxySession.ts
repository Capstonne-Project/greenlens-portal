import {
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_MUST_CHANGE_PASSWORD,
  AUTH_COOKIE_REFRESH,
} from '@/lib/constants/authCookies';
import { mapApiRoleToAuth } from '@/lib/auth/mapUser';
import type { AuthUser } from '@/lib/store/authStore';
import { decodeJwt, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export type ProxyTokenInfo = {
  mapped: AuthUser['role'] | null;
  rawRole: string | null;
};

export function getAccessToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get(AUTH_COOKIE_ACCESS)?.value ??
    request.headers.get('authorization')?.replace(/^Bearer /i, '')
  );
}

/** UX guard — BE vẫn enforce; cho silent refresh khi access hết hạn. */
export function hasRefreshToken(request: NextRequest): boolean {
  return Boolean(request.cookies.get(AUTH_COOKIE_REFRESH)?.value);
}

export function mustChangePassword(request: NextRequest): boolean {
  return request.cookies.get(AUTH_COOKIE_MUST_CHANGE_PASSWORD)?.value === '1';
}

function roleRawFromPayload(payload: Record<string, unknown>): string | null {
  const claim = payload[ROLE_CLAIM];
  if (typeof claim === 'string' && claim) return claim;
  if (typeof payload.role === 'string' && payload.role) return payload.role;
  return null;
}

/** Bucket FE + raw BE role (DEO/LEO) — UX only. */
export async function getTokenRoleInfo(token: string): Promise<ProxyTokenInfo> {
  const secret = process.env.JWT_SECRET;
  try {
    if (secret) {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
      const raw = roleRawFromPayload(payload as Record<string, unknown>);
      return { mapped: raw ? mapApiRoleToAuth(raw) : null, rawRole: raw };
    }

    if (process.env.NODE_ENV === 'production') {
      return { mapped: null, rawRole: null };
    }

    const payload = decodeJwt(token);
    const raw = roleRawFromPayload(payload as Record<string, unknown>);
    return { mapped: raw ? mapApiRoleToAuth(raw) : null, rawRole: raw };
  } catch {
    return { mapped: null, rawRole: null };
  }
}
