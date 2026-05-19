import type { ReportSeverity, ReportStatus } from '@/lib/api/models/adminReport';
import { REPORT_STATUS_LABEL_VI } from '@/utils/adminOverview';

export function reportStatusLabelVi(status: ReportStatus): string {
  return REPORT_STATUS_LABEL_VI[status] ?? status;
}

export function reportStatusBadgeClasses(status: ReportStatus): string {
  switch (status) {
    case 'Submitted':
      return 'bg-slate-100 text-slate-800';
    case 'Verified':
      return 'bg-emerald-100 text-emerald-900';
    case 'In Progress':
      return 'bg-sky-100 text-sky-900';
    case 'Resolved':
      return 'bg-emerald-600/15 text-emerald-900';
    case 'Closed':
      return 'bg-zinc-100 text-zinc-700';
    case 'Rejected':
      return 'bg-red-100 text-red-900';
    case 'Duplicate':
      return 'bg-amber-100 text-amber-900';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

const SEVERITY_LEVEL: Record<ReportSeverity, number> = {
  Low: 2,
  Medium: 3,
  High: 4,
  Critical: 5,
};

export function severityBarCount(severity: ReportSeverity): number {
  return SEVERITY_LEVEL[severity] ?? 2;
}

export function severityBarColor(severity: ReportSeverity): string {
  switch (severity) {
    case 'Low':
      return 'bg-emerald-500';
    case 'Medium':
      return 'bg-lime-500';
    case 'High':
      return 'bg-orange-500';
    case 'Critical':
      return 'bg-red-500';
    default:
      return 'bg-muted';
  }
}

export function formatReportRelativeTime(iso: string): string {
  if (!iso?.trim()) return '—';
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return '—';
  const diffMs = Date.now() - created.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày`;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(created);
}

export function reportListTitle(item: { categoryName: string; code: string }): string {
  return item.categoryName?.trim() || item.code;
}
