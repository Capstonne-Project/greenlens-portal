import { setHttpOnlyAuthCookies } from '@/lib/storage/authSessionCookies.server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const sessionBodySchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    // Same-origin navigations / some browsers omit Origin on same-site POST
    const fetchSite = request.headers.get('sec-fetch-site');
    return fetchSite === 'same-origin' || fetchSite === 'none' || fetchSite == null;
  }
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

/** POST /api/auth/session — store tokens as HttpOnly cookies after login/refresh. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { code: 'CSRF_REJECTED', status: false, message: 'Origin không hợp lệ.' },
      { status: 403 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'INVALID_JSON', status: false, message: 'Body phải là JSON.' },
      { status: 400 }
    );
  }

  const parsed = sessionBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', status: false, message: 'accessToken và refreshToken bắt buộc.' },
      { status: 400 }
    );
  }

  await setHttpOnlyAuthCookies(parsed.data.accessToken, parsed.data.refreshToken);

  return NextResponse.json({
    code: 'OK',
    status: true,
    message: 'Session cookies set.',
    data: null,
  });
}
