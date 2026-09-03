import { CITIZEN_LANDING_PATH, isCitizenAllowedPath } from '@/lib/auth/citizenAccess';
import { matchOfficerRouteAcl } from '@/lib/constants/officerRoles';
import { isPublicSurfacePath } from '@/lib/constants/publicRoutes';
import type { AuthUser } from '@/lib/store/authStore';

/** Redirect khi sai cổng / sai quyền (UX guard — BE enforce thật). */
export const PROXY_LOGIN_PATH = '/login';

export const PROXY_RENEW_PASSWORD_PATH = '/renew-password';

export const PROXY_AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/otp',
  PROXY_RENEW_PASSWORD_PATH,
] as const;

/** Staff portals — mỗi bucket FE khớp `AuthUser['role']`. */
export const PROXY_STAFF_PORTAL_GUARDS: ReadonlyArray<{
  prefix: string;
  role: AuthUser['role'];
}> = [
  { prefix: '/admin', role: 'admin' },
  { prefix: '/company', role: 'company' },
  { prefix: '/officer', role: 'officer' },
  { prefix: '/cleanup', role: 'cleanup' },
];

export function isProxyAuthRoute(pathname: string): boolean {
  return PROXY_AUTH_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isProxyRenewPasswordPath(pathname: string): boolean {
  return (
    pathname === PROXY_RENEW_PASSWORD_PATH ||
    pathname.startsWith(`${PROXY_RENEW_PASSWORD_PATH}/`)
  );
}

/** Cổng staff nếu path thuộc `/admin` | `/officer` | `/company` | `/cleanup`. */
export function getStaffPortalRoleForPath(pathname: string): AuthUser['role'] | null {
  for (const { prefix, role } of PROXY_STAFF_PORTAL_GUARDS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return role;
    }
  }
  return null;
}

/**
 * Path được phép khi đã đăng nhập (ngoài auth routes).
 * - Citizen: marketing/community public surfaces + renew-password
 * - Admin / company / cleanup: đúng prefix portal
 * - Officer (DEO/LEO): `/officer/*` + sub-ACL DEO vs LEO
 */
export function isPathAllowedForRole(
  pathname: string,
  role: AuthUser['role'],
  rawRole?: string | null
): boolean {
  if (isProxyRenewPasswordPath(pathname)) {
    return true;
  }

  switch (role) {
    case 'citizen':
      return isCitizenAllowedPath(pathname);
    case 'admin':
      return pathname === '/admin' || pathname.startsWith('/admin/');
    case 'company':
      return pathname === '/company' || pathname.startsWith('/company/');
    case 'officer': {
      if (pathname !== '/officer' && !pathname.startsWith('/officer/')) {
        return false;
      }
      return matchOfficerRouteAcl(pathname, rawRole ?? undefined) !== 'deny';
    }
    case 'cleanup':
      return pathname === '/cleanup' || pathname.startsWith('/cleanup/');
    default:
      return false;
  }
}

/** Guest được vào không cần session (marketing + auth forms). */
export function isGuestAccessiblePath(pathname: string): boolean {
  return isPublicSurfacePath(pathname) || isProxyAuthRoute(pathname);
}

/**
 * Redirect khi đã đăng nhập nhưng path không thuộc cổng của role.
 * Citizen → marketing home `/`; staff sai cổng → `/login`.
 */
export function resolveRoleViolationRedirect(role: AuthUser['role'] | null): string {
  if (role === 'citizen') {
    return CITIZEN_LANDING_PATH;
  }
  return PROXY_LOGIN_PATH;
}
