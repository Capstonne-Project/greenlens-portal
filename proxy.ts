import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/otp', '/renew-password'];

const PROTECTED_ROUTES: Record<string, string[]> = {
  '/admin': ['admin'],
  '/officer': ['officer'],
  '/cleanup': ['cleanup'],
};

function getToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get('auth-token')?.value ??
    request.headers.get('authorization')?.replace('Bearer ', '')
  );
}

async function decodeToken(token: string): Promise<{ role?: string } | null> {
  try {
    // If JWT_SECRET is configured, verify properly; otherwise decode payload for UX guard only
    const secret = process.env.JWT_SECRET;
    if (secret) {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
      return payload as { role?: string };
    }
    // Fallback: decode base64 payload (UX guard only — real auth is enforced by BE)
    const payload = JSON.parse(atob(token.split('.')[1])) as { role?: string };
    return payload;
  } catch {
    return null;
  }
}

function getRoleDashboard(role: string | undefined): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'officer':
      return '/officer';
    case 'cleanup':
      return '/cleanup';
    default:
      return '/';
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = getToken(request);

  // Auth routes: redirect authenticated users to their dashboard
  if (AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    if (token) {
      const payload = await decodeToken(token);
      if (payload) {
        return NextResponse.redirect(new URL(getRoleDashboard(payload.role), request.url));
      }
    }
    return NextResponse.next();
  }

  // Protected routes: require valid token + correct role
  for (const [prefix, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(prefix)) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      const payload = await decodeToken(token);
      if (!payload || (payload.role && !allowedRoles.includes(payload.role))) {
        return NextResponse.redirect(new URL('/login', request.url));
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
