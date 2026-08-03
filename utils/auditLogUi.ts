import { AUDIT_EXPORT_MAX_DAYS } from '@/lib/constants/auditLogs';
import type { AuditLogListItem } from '@/lib/api/models/auditLog';

/** Chuyển input date (YYYY-MM-DD) → ISO UTC đầu ngày. */
export function toUtcIsoStartOfDay(dateInput: string): string {
  const [y, m, d] = dateInput.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)).toISOString();
}

/** Chuyển input date (YYYY-MM-DD) → ISO UTC cuối ngày. */
export function toUtcIsoEndOfDay(dateInput: string): string {
  const [y, m, d] = dateInput.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999)).toISOString();
}

export function auditDateRangeDays(fromInput: string, toInput: string): number | null {
  if (!fromInput || !toInput) return null;
  const from = new Date(toUtcIsoStartOfDay(fromInput)).getTime();
  const to = new Date(toUtcIsoEndOfDay(toInput)).getTime();
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return null;
  return Math.ceil((to - from) / (24 * 60 * 60 * 1000));
}

export function isAuditExportRangeValid(fromInput: string, toInput: string): boolean {
  const days = auditDateRangeDays(fromInput, toInput);
  return days != null && days > 0 && days <= AUDIT_EXPORT_MAX_DAYS;
}

export function formatAuditDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Không rõ';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatActorLabel(item: AuditLogListItem): string {
  return item.actorName || item.userEmail || item.userId || 'Hệ thống';
}

export function truncateUserAgent(ua: string | null, max = 48): string {
  if (!ua) return '—';
  if (ua.length <= max) return ua;
  return `${ua.slice(0, Math.max(0, max - 1))}…`;
}

export function getAuditActionBadgeClass(action: string): string {
  const normalized = action.toLowerCase();

  if (normalized.includes('delete') || normalized.includes('reject')) {
    return 'border-rose-200 bg-rose-100 text-rose-900';
  }
  if (
    normalized.includes('ban') ||
    normalized.includes('hide') ||
    normalized.includes('issuepenalty')
  ) {
    return 'border-red-200 bg-red-100 text-red-900';
  }
  if (
    normalized.includes('create') ||
    normalized.includes('verify') ||
    normalized.includes('unhide')
  ) {
    return 'border-emerald-200 bg-emerald-100 text-emerald-900';
  }
  if (
    normalized.includes('update') ||
    normalized.includes('assign') ||
    normalized.includes('reassign')
  ) {
    return 'border-amber-200 bg-amber-100 text-amber-900';
  }
  if (
    normalized.includes('toggle') ||
    normalized.includes('record') ||
    normalized.includes('approve')
  ) {
    return 'border-teal-200 bg-teal-100 text-teal-900';
  }
  if (normalized.includes('login')) {
    return 'border-sky-200 bg-sky-100 text-sky-900';
  }
  if (normalized.includes('logout')) {
    return 'border-slate-200 bg-slate-100 text-slate-700';
  }
  return 'border-slate-200 bg-slate-100 text-slate-700';
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
