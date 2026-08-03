import type { ApiEnvelope, LoginSuccessData, LoginUserDto } from '@/lib/api/types/auth';
import {
  clearHttpOnlyAuthCookies,
  getHttpOnlyRefreshToken,
  setHttpOnlyAuthCookies,
} from '@/lib/storage/authSessionCookies.server';
import { NextResponse } from 'next/server';

function getServerApiBase(): string {
  return (
    process.env.API_BACKEND_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
    'http://localhost:5162'
  );
}

export type RefreshClientPayload = {
  accessToken: string;
  user: LoginUserDto;
};

/** POST /api/auth/refresh — rotate session using HttpOnly refresh cookie. */
export async function POST() {
  const refreshToken = await getHttpOnlyRefreshToken();
  if (!refreshToken) {
    return NextResponse.json(
      { code: 'NO_REFRESH', status: false, message: 'Không có refresh token.' },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(`${getServerApiBase()}/v1/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    if (!res.ok) {
      await clearHttpOnlyAuthCookies();
      return NextResponse.json(
        { code: 'REFRESH_FAILED', status: false, message: 'Refresh thất bại.' },
        { status: 401 }
      );
    }

    const envelope = (await res.json()) as ApiEnvelope<LoginSuccessData>;
    const data = envelope.data;
    if (!data?.accessToken || !data?.refreshToken || !data?.user) {
      await clearHttpOnlyAuthCookies();
      return NextResponse.json(
        {
          code: 'INVALID_REFRESH_PAYLOAD',
          status: false,
          message: 'Payload refresh không hợp lệ.',
        },
        { status: 502 }
      );
    }

    await setHttpOnlyAuthCookies(data.accessToken, data.refreshToken);

    // Never return refreshToken to the browser — stays HttpOnly only
    const clientData: RefreshClientPayload = {
      accessToken: data.accessToken,
      user: data.user,
    };

    return NextResponse.json({
      code: envelope.code ?? 'OK',
      status: true,
      message: envelope.message ?? 'Refreshed.',
      data: clientData,
    });
  } catch {
    return NextResponse.json(
      { code: 'REFRESH_ERROR', status: false, message: 'Không thể làm mới phiên.' },
      { status: 502 }
    );
  }
}
