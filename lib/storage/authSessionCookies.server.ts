import {
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_MUST_CHANGE_PASSWORD,
  AUTH_COOKIE_REFRESH,
} from '@/lib/constants/authCookies';
import { cookies } from 'next/headers';

const ONE_DAY_SEC = 60 * 60 * 24;
const SEVEN_DAYS_SEC = ONE_DAY_SEC * 7;

function baseCookieOptions(maxAge: number) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

/** Set access + refresh as HttpOnly cookies (server / Route Handlers only). */
export async function setHttpOnlyAuthCookies(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const jar = await cookies();
  jar.set(AUTH_COOKIE_ACCESS, accessToken, baseCookieOptions(ONE_DAY_SEC));
  jar.set(AUTH_COOKIE_REFRESH, refreshToken, baseCookieOptions(SEVEN_DAYS_SEC));
}

export async function getHttpOnlyRefreshToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE_REFRESH)?.value;
}

export async function clearHttpOnlyAuthCookies(): Promise<void> {
  const jar = await cookies();
  jar.set(AUTH_COOKIE_ACCESS, '', { ...baseCookieOptions(0), maxAge: 0 });
  jar.set(AUTH_COOKIE_REFRESH, '', { ...baseCookieOptions(0), maxAge: 0 });
  jar.set(AUTH_COOKIE_MUST_CHANGE_PASSWORD, '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
