import type { ReportSeverity, ReportStatus } from '@/lib/api/models/adminReport';
import { REPORT_STATUS_BADGE_CLASSES, reportStatusLabelVi } from '@/lib/constants/reportStatus';

export { reportStatusLabelVi };

export function reportStatusBadgeClasses(status: ReportStatus): string {
  return REPORT_STATUS_BADGE_CLASSES[status] ?? 'bg-muted text-muted-foreground';
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
