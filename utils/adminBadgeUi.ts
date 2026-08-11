import { getApiBaseUrl } from '@/lib/api/getApiBaseUrl';

/** Resolve icon URL từ BE (https hoặc path tương đối qua proxy). */
export function resolveBadgeIconUrl(iconUrl: string | null | undefined): string | null {
  const raw = iconUrl?.trim();
  if (!raw || raw === 'string') return null;
  if (/^https:\/\//i.test(raw)) return raw;
  const base = getApiBaseUrl().replace(/\/$/, '');
  const path = raw.replace(/^\//, '');
  return `${base}/${path}`;
}
