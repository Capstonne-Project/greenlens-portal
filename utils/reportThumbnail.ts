import type { CompanyAssignmentDetail } from '@/lib/api/models/company';
import type { ReportMedia } from '@/lib/api/models/report';

const PLACEHOLDER_URLS = new Set(['string', 'null', 'undefined']);

/** Host BE seed — URL hợp lệ nhưng không có file thật (404). */
const DEV_UNREACHABLE_HOSTS = new Set(['example.com']);

/** Loại URL placeholder / rỗng từ Swagger seed. */
export function isUsableMediaUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || PLACEHOLDER_URLS.has(trimmed.toLowerCase())) return false;
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/');
}

function isImageMediaType(type: unknown): boolean {
  if (typeof type !== 'string' || !type.trim()) return true;
  const normalized = type.trim().toLowerCase();
  return normalized.includes('image') || normalized.includes('photo');
}

/** BE seed URL (example.com) → ảnh local dev để UI không trống. Production giữ URL gốc. */
export function resolveDisplayReportImageUrl(url: string | null | undefined): string | null {
  const normalized = normalizeMediaUrl(url);
  if (!normalized) return null;

  if (process.env.NODE_ENV === 'development') {
    try {
      const { hostname } = new URL(normalized);
      if (DEV_UNREACHABLE_HOSTS.has(hostname)) {
        return '/images/login-hero1.png';
      }
    } catch {
      return normalized;
    }
  }

  return normalized;
}

/** Chuẩn hoá URL ảnh — relative path → CDN hoặc API base. */
export function normalizeMediaUrl(value: unknown): string | null {
  if (!isUsableMediaUrl(value)) return null;

  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const base =
    process.env.NEXT_PUBLIC_CDN_BASE_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
    '';
  if (!base) return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return `${base}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

/** Lấy URL ảnh đầu tiên từ media báo cáo gốc (citizen upload). */
export function pickFirstReportMediaUrl(
  media: Pick<ReportMedia, 'url' | 'mediaType'>[] | undefined | null
): string | null {
  if (!media?.length) return null;

  const image = media.find(item => {
    const url = normalizeMediaUrl(item.url);
    if (!url) return false;
    return isImageMediaType(item.mediaType);
  });

  return (
    normalizeMediaUrl(image?.url) ??
    normalizeMediaUrl(media.find(m => normalizeMediaUrl(m.url))?.url) ??
    null
  );
}

type MediaBuckets = Pick<CompanyAssignmentDetail, 'media' | 'reportImages'>;

/** Fallback: ảnh citizen → ảnh minh chứng cleanup (before → progress → after). */
export function pickAssignmentDetailMediaUrl(
  detail: MediaBuckets | null | undefined
): string | null {
  if (!detail) return null;

  for (const image of detail.reportImages ?? []) {
    const url = normalizeMediaUrl(image.url);
    if (url) return url;
  }

  if (!detail.media) return null;

  for (const key of ['beforeImages', 'progressImages', 'afterImages'] as const) {
    const first = detail.media[key]?.find(img => normalizeMediaUrl(img.url));
    if (first?.url) return normalizeMediaUrl(first.url);
  }

  return null;
}
