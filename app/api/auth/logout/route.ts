import { clearHttpOnlyAuthCookies } from '@/lib/storage/authSessionCookies.server';
import { NextResponse } from 'next/server';

/** POST /api/auth/logout — clear HttpOnly auth cookies. */
export async function POST() {
  await clearHttpOnlyAuthCookies();
  return NextResponse.json({
    code: 'OK',
    status: true,
    message: 'Logged out.',
    data: null,
  });
}
