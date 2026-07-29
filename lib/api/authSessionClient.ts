import type { LoginUserDto } from '@/lib/api/types/auth';

export type AuthSessionClientData = {
  accessToken: string;
  user: LoginUserDto;
};

/** Persist tokens via Route Handler → HttpOnly cookies (JS cannot read them). */
export async function persistAuthSession(
  accessToken: string,
  refreshToken: string
): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ accessToken, refreshToken }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Silent refresh via Route Handler (reads HttpOnly refresh cookie server-side). */
export async function refreshAuthSessionViaApi(): Promise<AuthSessionClientData | null> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: AuthSessionClientData };
    return body.data ?? null;
  } catch {
    return null;
  }
}

/** Clear HttpOnly auth cookies via Route Handler. */
export async function clearAuthSessionViaApi(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
  } catch {
    /* ignore — logout is best-effort */
  }
}
