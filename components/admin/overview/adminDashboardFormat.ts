/** Format helpers for admin dashboard overview (L6 — display only). */

/** API rates may be 0–100 or 0–1 fractions. */
export function normalizeRatePercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value >= 0 && value <= 1) return value * 100;
  return value;
}

export function formatRatePercent(value: number, digits = 1): string {
  return `${normalizeRatePercent(value).toFixed(digits)}%`;
}

export function formatOverviewNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('vi-VN').format(value);
}

export function formatHours(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(digits)} giờ`;
}

export function formatUpdatedAt(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  SLA_BREACH: 'Vi phạm SLA',
  OVERDUE_REPORTS: 'Báo cáo quá hạn',
  SUSPICIOUS_REPORTS: 'Báo cáo khả nghi',
  SlaBreach: 'Vi phạm SLA',
  SLABreach: 'Vi phạm SLA',
  SLA: 'Vi phạm SLA',
  Duplicate: 'Trùng lặp',
  Duplicates: 'Trùng lặp',
  Contract: 'Hợp đồng',
  Contracts: 'Hợp đồng',
  HighPending: 'Tồn đọng cao',
  PendingBacklog: 'Tồn đọng cao',
  System: 'Hệ thống',
  Performance: 'Hiệu suất',
  Geographic: 'Địa lý',
  Company: 'Doanh nghiệp',
  Officer: 'Cán bộ',
  Spam: 'Spam',
  Capacity: 'Công suất',
};

/** Human-readable alert type; unknown values stay readable without inventing meaning. */
export function alertTypeLabel(type: string): string {
  const key = type?.trim() ?? '';
  if (!key) return 'Cảnh báo';
  if (ALERT_TYPE_LABELS[key]) return ALERT_TYPE_LABELS[key];
  return humanizeToken(key);
}

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  OfficerVerified: 'Cán bộ xác minh',
  StatusChanged: 'Đổi trạng thái',
  TeamAssigned: 'Gán đội',
  ReportCreated: 'Tạo báo cáo',
  ReportResolved: 'Giải quyết',
  ReportClosed: 'Đóng',
  ReportRejected: 'Từ chối',
  assignment: 'Phân công',
  progress: 'Tiến độ',
  completed: 'Hoàn thành',
  declined: 'Từ chối',
};

export function activityTypeLabel(type: string): string {
  const key = type?.trim() ?? '';
  if (!key) return 'Hoạt động';
  if (ACTIVITY_TYPE_LABELS[key]) return ACTIVITY_TYPE_LABELS[key];
  return humanizeToken(key);
}

export function formatRelativeTimeVi(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(date);
}

function humanizeToken(key: string): string {
  const spaced = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return spaced || key;
}
