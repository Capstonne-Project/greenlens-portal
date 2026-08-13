/**
 * Chỉ cho phép back về route nội bộ officer — chống open-redirect.
 * `from` là path+query tương đối (vd. `/officer/duplicates`, `/officer/inspections/{id}`).
 */
export function resolveSafeOfficerFrom(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const path = raw.trim();
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  if (!path.startsWith('/officer/') && path !== '/officer') return null;
  return path;
}

/** Gắn `?from=` (hoặc `&from=`) khi path nguồn hợp lệ. */
export function withOfficerFromQuery(href: string, fromPath: string): string {
  const from = resolveSafeOfficerFrom(fromPath);
  if (!from) return href;
  const sep = href.includes('?') ? '&' : '?';
  return `${href}${sep}from=${encodeURIComponent(from)}`;
}

/** Chi tiết theo dõi xử lý — `/officer/tracking/{id}` (+ `from` nếu có). */
export function officerTrackingDetailHref(reportId: string, fromPath?: string | null): string {
  const href = `/officer/tracking/${encodeURIComponent(reportId)}`;
  return fromPath ? withOfficerFromQuery(href, fromPath) : href;
}
