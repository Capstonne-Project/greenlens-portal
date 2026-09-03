import { getDashboardPathByRole } from '@/lib/auth/mapUser';
import {
  getStaffPortalRoleForPath,
  isGuestAccessiblePath,
  isPathAllowedForRole,
  isProxyAuthRoute,
  isProxyRenewPasswordPath,
  PROXY_LOGIN_PATH,
  PROXY_RENEW_PASSWORD_PATH,
  resolveRoleViolationRedirect,
} from '@/lib/auth/proxyRouteGuard';
import {
  getAccessToken,
  getTokenRoleInfo,
  hasRefreshToken,
  mustChangePassword,
} from '@/lib/auth/proxySession';
import type { AuthUser } from '@/lib/store/authStore';
import { NextRequest, NextResponse } from 'next/server';

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  return NextResponse.redirect(new URL(pathname, request.url));
}

function redirectToLogin(request: NextRequest): NextResponse {
  return redirectTo(request, PROXY_LOGIN_PATH);
}

function redirectForRoleViolation(
  request: NextRequest,
  role: AuthUser['role'] | null
): NextResponse {
  return redirectTo(request, resolveRoleViolationRedirect(role));
}

async function resolveSession(request: NextRequest) {
  const token = getAccessToken(request);
  if (!token) {
    return { token: undefined, mapped: null, rawRole: null };
  }
  const { mapped, rawRole } = await getTokenRoleInfo(token);
  return { token, mapped, rawRole };
}

/**
 * Auth forms — guest OK; logged-in → dashboard (trừ renew-password bắt buộc).
 */
async function handleAuthRoute(request: NextRequest, pathname: string): Promise<NextResponse> {
  const { token, mapped } = await resolveSession(request);

  if (!token) {
    if (isProxyRenewPasswordPath(pathname)) {
      return redirectToLogin(request);
    }
    return NextResponse.next();
  }

  if (isProxyRenewPasswordPath(pathname)) {
    if (mustChangePassword(request)) {
      return NextResponse.next();
    }
    if (mapped) {
      return redirectTo(request, getDashboardPathByRole(mapped));
    }
    return redirectToLogin(request);
  }

  if (mapped) {
    if (mustChangePassword(request)) {
      return redirectTo(request, PROXY_RENEW_PASSWORD_PATH);
    }
    return redirectTo(request, getDashboardPathByRole(mapped));
  }

  if (hasRefreshToken(request)) {
    return NextResponse.next();
  }

  return redirectToLogin(request);
}

/**
 * Next.js 16 edge proxy — role-based route guard (UX only; BE enforce auth).
 *
 * - Admin → `/admin/*`
 * - DEO/LEO → `/officer/*` (+ sub-ACL)
 * - Company → `/company/*`
 * - Citizen → public surfaces; vào cổng staff → `/`
 * - Staff sai cổng / sai sub-role → `/login`
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/proxy-api/')) {
    return NextResponse.next();
  }

  if (isProxyAuthRoute(pathname)) {
    return handleAuthRoute(request, pathname);
  }

  const { token, mapped, rawRole } = await resolveSession(request);

  if (token && mustChangePassword(request)) {
    if (!isProxyRenewPasswordPath(pathname) && !isGuestAccessiblePath(pathname)) {
      return redirectTo(request, PROXY_RENEW_PASSWORD_PATH);
    }
  }

  const staffPortalRole = getStaffPortalRoleForPath(pathname);

  if (staffPortalRole) {
    if (!token) {
      if (hasRefreshToken(request)) return NextResponse.next();
      return redirectToLogin(request);
    }

    if (!mapped) {
      if (hasRefreshToken(request)) return NextResponse.next();
      return redirectToLogin(request);
    }

    if (mapped !== staffPortalRole || !isPathAllowedForRole(pathname, mapped, rawRole)) {
      return redirectForRoleViolation(request, mapped);
    }

    return NextResponse.next();
  }

  if (token && mapped) {
    if (!isPathAllowedForRole(pathname, mapped, rawRole)) {
      return redirectForRoleViolation(request, mapped);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|proxy-api|_next/static|_next/image|favicon.ico|images|fonts|icons|robots.txt|sitemap.xml).*)',
  ],
};
