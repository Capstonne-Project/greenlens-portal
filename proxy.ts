import { CITIZEN_HOME_PATH, isCitizenAllowedPath } from '@/lib/auth/citizenAccess';
import {
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_REFRESH,
  AUTH_COOKIE_MUST_CHANGE_PASSWORD,
} from '@/lib/constants/authCookies';
import { isPublicSurfacePath } from '@/lib/constants/publicRoutes';
import { matchOfficerRouteAcl, OFFICER_ACL_FALLBACK_PATH } from '@/lib/constants/officerRoles';
import { getDashboardPathByRole, mapApiRoleToAuth } from '@/lib/auth/mapUser';
import type { AuthUser } from '@/lib/store/authStore';
import { decodeJwt, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/otp',
  '/renew-password',
];
const RENEW_PASSWORD_PATH = '/renew-password';

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

const PROTECTED: { prefix: string; role: AuthUser['role'] }[] = [
  { prefix: '/admin', role: 'admin' },
  { prefix: '/company', role: 'company' },
  { prefix: '/officer', role: 'officer' },
  { prefix: '/cleanup', role: 'cleanup' },
];

function getAccessToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get(AUTH_COOKIE_ACCESS)?.value ??
    request.headers.get('authorization')?.replace(/^Bearer /i, '')
  );
}

// UX guard only — real auth is enforced by BE. When the access token is
// missing/expired but a refresh cookie is still present, let the request
// through so the client can silently refresh (L1) instead of forcing logout.
function hasRefreshToken(request: NextRequest): boolean {
  return Boolean(request.cookies.get(AUTH_COOKIE_REFRESH)?.value);
}
function mustChangePassword(request: NextRequest): boolean {
  return request.cookies.get(AUTH_COOKIE_MUST_CHANGE_PASSWORD)?.value === '1';
}

function roleRawFromPayload(payload: Record<string, unknown>): string | null {
  const claim = payload[ROLE_CLAIM];
  if (typeof claim === 'string' && claim) return claim;
  if (typeof payload.role === 'string' && payload.role) return payload.role;
  return null;
}

/** Bucket FE + raw BE role (DEO/LEO) — UX only. */
async function getTokenRoleInfo(
  token: string
): Promise<{ mapped: AuthUser['role'] | null; rawRole: string | null }> {
  const secret = process.env.JWT_SECRET;
  try {
    if (secret) {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
      const raw = roleRawFromPayload(payload as Record<string, unknown>);
      return { mapped: raw ? mapApiRoleToAuth(raw) : null, rawRole: raw };
    }

    // Production: fail closed — require JWT_SECRET to verify signatures.
    if (process.env.NODE_ENV === 'production') {
      return { mapped: null, rawRole: null };
    }

    // Local/dev UX only — BE still enforces auth on API calls.
    const payload = decodeJwt(token);
    const raw = roleRawFromPayload(payload as Record<string, unknown>);
    return { mapped: raw ? mapApiRoleToAuth(raw) : null, rawRole: raw };
  } catch {
    return { mapped: null, rawRole: null };
  }
}

/** Logged-in citizens may only use the public map (+ renew-password when required). */
async function redirectCitizenIfOutOfScope(
  request: NextRequest,
  pathname: string,
  token: string | undefined
): Promise<NextResponse | null> {
  if (!token) return null;

  if (mustChangePassword(request)) {
    if (pathname === RENEW_PASSWORD_PATH || pathname.startsWith(`${RENEW_PASSWORD_PATH}/`)) {
      return null;
    }
    // Public marketing surfaces stay reachable; renew-password enforced on staff/citizen app routes.
    if (isPublicSurfacePath(pathname)) {
      return null;
    }
    return NextResponse.redirect(new URL(RENEW_PASSWORD_PATH, request.url));
  }

  const { mapped } = await getTokenRoleInfo(token);
  if (mapped !== 'citizen') return null;

  if (isCitizenAllowedPath(pathname)) return null;

  return NextResponse.redirect(new URL(CITIZEN_HOME_PATH, request.url));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = getAccessToken(request);

  const citizenRedirect = await redirectCitizenIfOutOfScope(request, pathname, token);
  if (citizenRedirect) return citizenRedirect;

  // Public home — always `HomeLanding`; never redirect away (marketing entry point).
  if (pathname === '/') {
    return NextResponse.next();
  }

  const isRenewPassword =
    pathname === RENEW_PASSWORD_PATH || pathname.startsWith(`${RENEW_PASSWORD_PATH}/`);

  if (AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    if (token) {
      const { mapped } = await getTokenRoleInfo(token);

      // CM/staff with temp password may stay on renew-password until activated
      if (isRenewPassword && mustChangePassword(request)) {
        return NextResponse.next();
      }

      if (isRenewPassword && !mustChangePassword(request)) {
        if (mapped) {
          return NextResponse.redirect(new URL(getDashboardPathByRole(mapped), request.url));
        }
      }

      if (mapped) {
        if (mustChangePassword(request)) {
          return NextResponse.redirect(new URL(RENEW_PASSWORD_PATH, request.url));
        }
        return NextResponse.redirect(new URL(getDashboardPathByRole(mapped), request.url));
      }
    } else if (isRenewPassword) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  }

  // Public marketing / community — guest + logged-in citizen; never redirect to /login.
  if (isPublicSurfacePath(pathname)) {
    return NextResponse.next();
  }

  for (const { prefix, role: required } of PROTECTED) {
    if (pathname.startsWith(prefix)) {
      if (!token) {
        if (hasRefreshToken(request)) return NextResponse.next();
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if (mustChangePassword(request)) {
        return NextResponse.redirect(new URL(RENEW_PASSWORD_PATH, request.url));
      }

      const { mapped, rawRole } = await getTokenRoleInfo(token);

      if (!mapped) {
        if (hasRefreshToken(request)) return NextResponse.next();
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if (mapped !== required) {
        return NextResponse.redirect(new URL(getDashboardPathByRole(mapped), request.url));
      }

      // Officer sub-role ACL (DEO vs LEO) — redirect, no Access Denied page.
      if (required === 'officer') {
        const acl = matchOfficerRouteAcl(pathname, rawRole ?? undefined);
        if (acl === 'deny') {
          return NextResponse.redirect(new URL(OFFICER_ACL_FALLBACK_PATH, request.url));
        }
      }

      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|fonts|icons|robots.txt|sitemap.xml).*)',
  ],
};
