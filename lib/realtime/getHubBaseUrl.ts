/**
 * Absolute base URL for SignalR (WebSocket). Browser `/proxy-api` is HTTP-only —
 * hub connects directly to BE origin with JWT query `access_token`.
 */
export function getSignalRHubBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SIGNALR_HUB_BASE?.trim().replace(/\/$/, '');
  if (explicit) return explicit;

  const publicApi = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, '');
  if (publicApi && !publicApi.startsWith('/')) return publicApi;

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:5162';
  }

  return '';
}

export function buildNotificationHubUrl(accessToken: string): string | null {
  const base = getSignalRHubBaseUrl();
  if (!base || !accessToken.trim()) return null;
  const url = new URL('/hubs/notifications', `${base}/`);
  url.searchParams.set('access_token', accessToken.trim());
  return url.toString();
}

export function isSignalREnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_SIGNALR === 'true';
}
