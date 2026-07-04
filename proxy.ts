import { AUTH_COOKIE_ACCESS } from '@/lib/constants/authCookies';
import { getDashboardPathByRole, mapApiRoleToAuth } from '@/lib/auth/mapUser';
import type { AuthUser } from '@/lib/store/authStore';
import { decodeJwt, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/otp', '/renew-password'];

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
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const mapped = await getMappedRole(token);
    if (mapped && mapped !== 'citizen') {
      return NextResponse.redirect(new URL(getDashboardPathByRole(mapped), request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    if (token) {
      const mapped = await getMappedRole(token);
      if (mapped && mapped !== 'citizen') {
        return NextResponse.redirect(new URL(getDashboardPathByRole(mapped), request.url));
      }
    }
    return NextResponse.next();
  }

  for (const { prefix, role: required } of PROTECTED) {
    if (pathname.startsWith(prefix)) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      const mapped = await getMappedRole(token);
      if (!mapped) {
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
