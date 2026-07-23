import {
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_MUST_CHANGE_PASSWORD,
  AUTH_COOKIE_REFRESH,
} from '@/lib/constants/authCookies';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapeRegExp(name)}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Read access token from document cookie (client only). */
export function getAccessTokenFromCookie(): string | undefined {
  return readCookie(AUTH_COOKIE_ACCESS);
}

/** Read refresh token from document cookie (client only). */
export function getRefreshTokenFromCookie(): string | undefined {
  return readCookie(AUTH_COOKIE_REFRESH);
}

/** True when FE must gate dashboard until password change. */
export function getMustChangePasswordFromCookie(): boolean {
  return readCookie(AUTH_COOKIE_MUST_CHANGE_PASSWORD) === '1';
}

const ONE_DAY_SEC = 60 * 60 * 24;
const SEVEN_DAYS_SEC = ONE_DAY_SEC * 7;

function cookieFlags(maxAgeSec: number): string {
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? '; Secure' : '';
  return `Path=/; Max-Age=${maxAgeSec}; SameSite=Lax${secure}`;
}

/** Persist tokens in cookies for middleware / reload (non-httpOnly — readable by client). */
export function setAuthCookies(accessToken: string, refreshToken: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE_ACCESS}=${encodeURIComponent(accessToken)}; ${cookieFlags(ONE_DAY_SEC)}`;
  document.cookie = `${AUTH_COOKIE_REFRESH}=${encodeURIComponent(refreshToken)}; ${cookieFlags(SEVEN_DAYS_SEC)}`;
}

export function setMustChangePasswordCookie(value: boolean): void {
  if (typeof document === 'undefined') return;
  if (value) {
    document.cookie = `${AUTH_COOKIE_MUST_CHANGE_PASSWORD}=1; ${cookieFlags(ONE_DAY_SEC)}`;
  } else {
    clearMustChangePasswordCookie();
  }
}

export function clearMustChangePasswordCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE_MUST_CHANGE_PASSWORD}=; Path=/; Max-Age=0`;
}

export function clearAuthCookies(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE_ACCESS}=; Path=/; Max-Age=0`;
  document.cookie = `${AUTH_COOKIE_REFRESH}=; Path=/; Max-Age=0`;
  clearMustChangePasswordCookie();
}
