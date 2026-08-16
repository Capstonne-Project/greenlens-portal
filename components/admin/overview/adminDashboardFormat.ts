/** Format helpers for admin dashboard overview (L6 — display only). */

import { ASSIGNMENT_STATUS_LABEL } from '@/lib/constants/reportAssignment';
import { REPORT_STATUS_LABEL_VI, type ReportStatus } from '@/lib/constants/reportStatus';

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
  SlaOverdue: 'Quá hạn SLA',
  SlaWarning: 'Cảnh báo SLA',
  SLA: 'Vi phạm SLA',
  Overdue: 'Quá hạn',
  OverdueReports: 'Báo cáo quá hạn',
  PendingVerification: 'Chờ xác minh',
  UnassignedOver24h: 'Chưa phân công',
  Unassigned: 'Chưa phân công',
  CommunityPendingVerification: 'Cộng đồng chờ duyệt',
  Duplicate: 'Trùng lặp',
  Duplicates: 'Trùng lặp',
  DuplicateSpike: 'Trùng lặp tăng đột biến',
  Contract: 'Hợp đồng',
  Contracts: 'Hợp đồng',
  ContractExpiry: 'Hợp đồng sắp hết hạn',
  HighPending: 'Tồn đọng cao',
  PendingBacklog: 'Tồn đọng cao',
  HighQueue: 'Hàng đợi cao',
  System: 'Hệ thống',
  Performance: 'Hiệu suất',
  Geographic: 'Địa lý',
  Company: 'Doanh nghiệp',
  Officer: 'Cán bộ',
  Spam: 'Spam',
  Capacity: 'Công suất',
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  OfficerVerified: 'Cán bộ xác minh',
  StatusChanged: 'Đổi trạng thái',
  ReportStatusChanged: 'Đổi trạng thái',
  TeamAssigned: 'Gán đội',
  CompanyAssigned: 'Gán công ty',
  ReportCreated: 'Tạo báo cáo',
  ReportSubmitted: 'Đã gửi',
  ReportVerified: 'Đã xác minh',
  ReportAssigned: 'Đã phân công',
  ReportDispatched: 'Đã điều phối',
  ReportInProgress: 'Đang xử lý',
  ReportResolved: 'Đã giải quyết',
  ReportClosed: 'Đã đóng',
  ReportRejected: 'Đã từ chối',
  ReportReopened: 'Đã mở lại',
  DuplicateMarked: 'Đánh dấu trùng',
  assignment: 'Phân công',
  progress: 'Tiến độ',
  completed: 'Hoàn thành',
  declined: 'Từ chối',
  verified: 'Đã xác minh',
  assigned: 'Đã phân công',
  created: 'Tạo mới',
};

/** Human-readable alert type; unknown values stay readable without inventing meaning. */
export function alertTypeLabel(type: string): string {
  const key = type?.trim() ?? '';
  if (!key) return 'Cảnh báo';
  if (ALERT_TYPE_LABELS[key]) return ALERT_TYPE_LABELS[key];
  if (key in REPORT_STATUS_LABEL_VI) {
    return REPORT_STATUS_LABEL_VI[key as ReportStatus];
  }
  return localizeDashboardText(humanizeToken(key));
}

export function activityTypeLabel(type: string): string {
  const key = type?.trim() ?? '';
  if (!key) return 'Hoạt động';
  if (ACTIVITY_TYPE_LABELS[key]) return ACTIVITY_TYPE_LABELS[key];
  if (key in REPORT_STATUS_LABEL_VI) {
    return REPORT_STATUS_LABEL_VI[key as ReportStatus];
  }
  if (ASSIGNMENT_STATUS_LABEL[key]) return ASSIGNMENT_STATUS_LABEL[key];
  return localizeDashboardText(humanizeToken(key));
}

const STATUS_TOKEN_PAIRS = [
  ...Object.entries(REPORT_STATUS_LABEL_VI),
  ...Object.entries(ASSIGNMENT_STATUS_LABEL),
].sort((a, b) => b[0].length - a[0].length);

const DASHBOARD_EN_PHRASES: readonly [RegExp, string][] = [
  [/\bsla overdue\b/gi, 'quá hạn SLA'],
  [/\bpending verification\b/gi, 'chờ xác minh'],
  [/\bSLA breach(?:es)?\b/gi, 'vi phạm SLA'],
  [/\boverdue SLA\b/gi, 'quá hạn SLA'],
  [/\bunassigned\b/gi, 'chưa phân công'],
  [/\bhas been\b/gi, 'đã'],
  [/\bhave been\b/gi, 'đã'],
  [/\bwas changed to\b/gi, 'đổi sang'],
  [/\bchanged to\b/gi, 'đổi sang'],
  [/\bwas assigned to\b/gi, 'được phân công cho'],
  [/\bassigned to\b/gi, 'phân công cho'],
  [/\bwas verified\b/gi, 'đã được xác minh'],
  [/\bwas resolved\b/gi, 'đã được giải quyết'],
  [/\bwas rejected\b/gi, 'đã bị từ chối'],
  [/\bwas closed\b/gi, 'đã được đóng'],
  [/\bwas submitted\b/gi, 'đã được gửi'],
  [/\bwas reopened\b/gi, 'đã được mở lại'],
  [/\breports?\b/gi, 'báo cáo'],
  [/\balerts?\b/gi, 'cảnh báo'],
  [/\boverdue\b/gi, 'quá hạn'],
  [/\bpending\b/gi, 'đang chờ'],
  [/\bverified\b/gi, 'đã xác minh'],
  [/\bresolved\b/gi, 'đã giải quyết'],
  [/\brejected\b/gi, 'đã từ chối'],
  [/\bclosed\b/gi, 'đã đóng'],
  [/\bsubmitted\b/gi, 'đã gửi'],
  [/\bassigned\b/gi, 'đã phân công'],
  [/\bdispatched\b/gi, 'đã điều phối'],
];

/** Dịch token/cụm tiếng Anh còn sót trong message cảnh báo / mô tả hoạt động từ BE. */
export function localizeDashboardText(text: string): string {
  const source = text?.trim() ?? '';
  if (!source) return source;

  let out = source.replace(/\bIn Progress\b/gi, 'Đang xử lý');
  for (const [en, vi] of STATUS_TOKEN_PAIRS) {
    out = out.replace(new RegExp(`\\b${en}\\b`, 'g'), vi);
  }
  for (const [pattern, vi] of DASHBOARD_EN_PHRASES) {
    out = out.replace(pattern, vi);
  }
  return out.replace(/\s{2,}/g, ' ').trim();
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
