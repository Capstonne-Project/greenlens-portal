import {
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_MUST_CHANGE_PASSWORD,
  AUTH_COOKIE_REFRESH,
} from '@/lib/constants/authCookies';
import { getDashboardPathByRole, mapApiRoleToAuth } from '@/lib/auth/mapUser';
import type { AuthUser } from '@/lib/store/authStore';
import { decodeJwt, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/otp', '/renew-password'];
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

async function getMappedRole(token: string): Promise<AuthUser['role'] | null> {
  const secret = process.env.JWT_SECRET;
  try {
    if (secret) {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
      const raw =
        (typeof payload[ROLE_CLAIM] === 'string' && payload[ROLE_CLAIM]) ||
        (typeof payload.role === 'string' && payload.role);
      return raw ? mapApiRoleToAuth(raw) : null;
    }
    // Production: fail closed — require JWT_SECRET to verify signatures.
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
    // Local/dev UX only — BE still enforces auth on API calls.
    const payload = decodeJwt(token);
    const raw =
      (typeof payload[ROLE_CLAIM] === 'string' && payload[ROLE_CLAIM]) ||
      (typeof payload.role === 'string' && payload.role);
    return raw ? mapApiRoleToAuth(raw) : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = getAccessToken(request);

  if (pathname === '/') {
    if (!token) {
      if (hasRefreshToken(request)) return NextResponse.next();
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (mustChangePassword(request)) {
      return NextResponse.redirect(new URL(RENEW_PASSWORD_PATH, request.url));
    }
    const mapped = await getMappedRole(token);
    if (mapped && mapped !== 'citizen') {
      return NextResponse.redirect(new URL(getDashboardPathByRole(mapped), request.url));
    }
    if (!mapped && hasRefreshToken(request)) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isRenewPassword =
    pathname === RENEW_PASSWORD_PATH || pathname.startsWith(`${RENEW_PASSWORD_PATH}/`);

  if (AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    if (token) {
      // CM/staff with temp password may stay on renew-password until activated
      if (isRenewPassword && mustChangePassword(request)) {
        return NextResponse.next();
      }
      if (isRenewPassword && !mustChangePassword(request)) {
        const mapped = await getMappedRole(token);
        if (mapped) {
          return NextResponse.redirect(new URL(getDashboardPathByRole(mapped), request.url));
        }
      }
      const mapped = await getMappedRole(token);
      if (mapped && mapped !== 'citizen') {
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

  for (const { prefix, role: required } of PROTECTED) {
    if (pathname.startsWith(prefix)) {
      if (!token) {
        if (hasRefreshToken(request)) return NextResponse.next();
        return NextResponse.redirect(new URL('/login', request.url));
      }
      if (mustChangePassword(request)) {
        return NextResponse.redirect(new URL(RENEW_PASSWORD_PATH, request.url));
      }
      const mapped = await getMappedRole(token);
      if (!mapped) {
        if (hasRefreshToken(request)) return NextResponse.next();
        return NextResponse.redirect(new URL('/login', request.url));
      }
      if (mapped !== required) {
        return NextResponse.redirect(new URL(getDashboardPathByRole(mapped), request.url));
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
