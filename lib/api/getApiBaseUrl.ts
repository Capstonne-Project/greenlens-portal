function trimBaseUrl(url: string | undefined): string {
  return url?.trim().replace(/\/$/, '') ?? '';
}

function isLocalBackendUrl(url: string): boolean {
  try {
    const { hostname, port } = new URL(url);
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return port === '5162' || port === '';
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Browser (dev): luôn `/proxy-api` → Next rewrite → `API_BACKEND_URL` (tránh CORS, DevTools hiện :3000).
 * Browser (prod): `NEXT_PUBLIC_API_BASE_URL` hoặc `/proxy-api`.
 * Server (RSC): `API_BACKEND_URL` hoặc public URL — gọi BE trực tiếp.
 */
export function getApiBaseUrl(): string {
  const publicUrl = trimBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  const internalUrl = trimBaseUrl(process.env.API_BACKEND_URL) || publicUrl;

  if (typeof window === 'undefined') {
    if (internalUrl) return internalUrl;
    if (process.env.NODE_ENV !== 'production') {
      return 'http://localhost:5162';
    }
    return '';
  }

  if (process.env.NODE_ENV !== 'production') {
    return '/proxy-api';
  }

  if (publicUrl && !isLocalBackendUrl(publicUrl)) {
    return publicUrl;
  }

  return '/proxy-api';
}
