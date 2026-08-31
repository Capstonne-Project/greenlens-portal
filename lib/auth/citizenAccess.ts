/**
 * Citizen session routing — public surfaces + map; staff portals blocked in `proxy.ts`.
 */

import { isPublicSurfacePath } from '@/lib/constants/publicRoutes';

/** Default landing after citizen login. */
export const CITIZEN_HOME_PATH = '/map';

const CITIZEN_EXTRA_PREFIXES = ['/renew-password'] as const;

/** Paths a logged-in citizen may visit (marketing home/map + renew-password). */
export function isCitizenAllowedPath(pathname: string): boolean {
  if (isPublicSurfacePath(pathname)) return true;
  return CITIZEN_EXTRA_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Safe internal relative path for post-login redirect (no open redirect). */
export function isSafeInternalReturnPath(path: string | null | undefined): path is string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return false;
  if (path.startsWith('/login') || path.startsWith('/register')) return false;
  return true;
}
