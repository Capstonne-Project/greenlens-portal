import type { AuditLogListItem } from '@/lib/api/models/auditLog';

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
  return item.actorName || item.actorEmail || item.actorId || 'Hệ thống';
}

export function truncateUserAgent(ua: string | null, max = 48): string {
  if (!ua) return '—';
  if (ua.length <= max) return ua;
  return `${ua.slice(0, Math.max(0, max - 1))}…`;
}

export function getAuditActionBadgeClass(action: string): string {
  switch (action.toLowerCase()) {
    case 'create':
      return 'border-emerald-200 bg-emerald-100 text-emerald-900';
    case 'update':
      return 'border-amber-200 bg-amber-100 text-amber-900';
    case 'delete':
      return 'border-rose-200 bg-rose-100 text-rose-900';
    case 'toggle':
      return 'border-teal-200 bg-teal-100 text-teal-900';
    case 'login':
      return 'border-sky-200 bg-sky-100 text-sky-900';
    case 'logout':
      return 'border-slate-200 bg-slate-100 text-slate-700';
    case 'ban':
      return 'border-red-200 bg-red-100 text-red-900';
    case 'unban':
      return 'border-lime-200 bg-lime-100 text-lime-900';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-700';
  }
}
