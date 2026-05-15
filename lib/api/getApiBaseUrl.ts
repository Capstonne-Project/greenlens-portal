function trimBaseUrl(url: string | undefined): string {
  return url?.trim().replace(/\/$/, '') ?? '';
}

/**
 * Browser: `NEXT_PUBLIC_API_BASE_URL` (if set) or same-origin `/proxy-api` → Next rewrite.
 * Server (RSC / route handlers): `API_BACKEND_URL` or public base — no rewrite from Node.
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

  if (publicUrl) return publicUrl;

  if (process.env.NODE_ENV !== 'production') {
    return '/proxy-api';
  }

  return publicUrl;
}
