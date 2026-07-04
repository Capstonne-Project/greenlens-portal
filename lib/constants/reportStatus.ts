/**
 * Trạng thái vòng đời báo cáo ô nhiễm — khớp BE (PascalCase, không khoảng trắng).
 * BR-REP-020 / BR-REP-021.
 */
export const REPORT_STATUSES = [
  'Submitted',
  'Verified',
  'Dispatched',
  'Assigned',
  'InProgress',
  'Resolved',
  'Closed',
  'Rejected',
  'Duplicate',
  'PenaltyIssued',
  'ClosedNoViolation',
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Giá trị legacy / map API cũ → chuẩn FE. */
const REPORT_STATUS_ALIASES: Record<string, ReportStatus> = {
  'In Progress': 'InProgress',
};

export function normalizeReportStatus(raw: string): ReportStatus {
  const value = raw?.trim() ?? '';
  if ((REPORT_STATUSES as readonly string[]).includes(value)) {
    return value as ReportStatus;
  }
  return REPORT_STATUS_ALIASES[value] ?? 'Submitted';
}

/** Nhãn hiển thị UI — mã BE vẫn là PascalCase (`Submitted`, `InProgress`, …). */
export const REPORT_STATUS_LABEL_VI: Record<ReportStatus, string> = {
  Submitted: 'Đã gửi',
  Verified: 'Đã xác minh',
  Dispatched: 'Đã điều phối',
  Assigned: 'Đã phân công',
  InProgress: 'Đang xử lý',
  Resolved: 'Đã giải quyết',
  Closed: 'Đã đóng',
  Rejected: 'Đã từ chối',
  Duplicate: 'Trùng lặp',
  PenaltyIssued: 'Đã xử phạt',
  ClosedNoViolation: 'Đóng (không vi phạm)',
};

export function reportStatusLabelVi(status: ReportStatus | string): string {
  return REPORT_STATUS_LABEL_VI[normalizeReportStatus(String(status))];
}

export const REPORT_STATUS_BADGE_CLASSES: Record<ReportStatus, string> = {
  Submitted: 'bg-slate-100 text-slate-800',
  Verified: 'bg-emerald-100 text-emerald-900',
  Dispatched: 'bg-cyan-100 text-cyan-900',
  Assigned: 'bg-sky-100 text-sky-900',
  InProgress: 'bg-purple-100 text-purple-900',
  Resolved: 'bg-emerald-600/15 text-emerald-900',
  Closed: 'bg-zinc-100 text-zinc-700',
  Rejected: 'bg-red-100 text-red-900',
  Duplicate: 'bg-amber-100 text-amber-900',
  PenaltyIssued: 'bg-orange-100 text-orange-900',
  ClosedNoViolation: 'bg-slate-100 text-slate-600',
};

export const REPORT_STATUS_CHART_COLORS: Record<ReportStatus, string> = {
  Submitted: '#2e7d32',
  Verified: '#43a047',
  Dispatched: '#00838f',
  Assigned: '#0288d1',
  InProgress: '#66bb6a',
  Resolved: '#1b5e20',
  Closed: '#9e9e9e',
  Rejected: '#c62828',
  Duplicate: '#ef6c00',
  PenaltyIssued: '#e65100',
  ClosedNoViolation: '#78909c',
};

/** Báo cáo chưa kết thúc — dùng thống kê / bản đồ mở. */
export const OPEN_REPORT_STATUSES: ReportStatus[] = [
  'Submitted',
  'Verified',
  'Dispatched',
  'Assigned',
  'InProgress',
];

export const MODERATION_REPORT_STATUSES: ReportStatus[] = ['Submitted'];
