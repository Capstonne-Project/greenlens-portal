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

/**
 * Legacy client-readable token cookies (pre-HttpOnly migration).
 * HttpOnly cookies are invisible here — use only for one-time migration.
 */
export function getLegacyAccessTokenFromCookie(): string | undefined {
  return readCookie(AUTH_COOKIE_ACCESS);
}

export function getLegacyRefreshTokenFromCookie(): string | undefined {
  return readCookie(AUTH_COOKIE_REFRESH);
}

/** True when FE must gate dashboard until password change. */
export function getMustChangePasswordFromCookie(): boolean {
  return readCookie(AUTH_COOKIE_MUST_CHANGE_PASSWORD) === '1';
}

const ONE_DAY_SEC = 60 * 60 * 24;

function cookieFlags(maxAgeSec: number): string {
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? '; Secure' : '';
  return `Path=/; Max-Age=${maxAgeSec}; SameSite=Lax${secure}`;
}

/** Flag cookie only (not a secret) — still client-writable for UX gating. */
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

/** Clear legacy non-HttpOnly token cookies left from older clients. */
export function clearLegacyClientAuthCookies(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE_ACCESS}=; Path=/; Max-Age=0`;
  document.cookie = `${AUTH_COOKIE_REFRESH}=; Path=/; Max-Age=0`;
  clearMustChangePasswordCookie();
}
