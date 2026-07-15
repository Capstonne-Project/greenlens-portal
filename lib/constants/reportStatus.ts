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

/** Soft badge — management dashboard / ops queue. */
export const REPORT_STATUS_BADGE_CLASSES: Record<ReportStatus, string> = {
  Submitted: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
  Verified: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
  Dispatched: 'bg-teal-50 text-teal-800 ring-1 ring-teal-200/80',
  Assigned: 'bg-sky-50 text-sky-800 ring-1 ring-sky-200/80',
  InProgress: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200/80',
  Resolved: 'bg-green-50 text-green-800 ring-1 ring-green-200/80',
  Closed: 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80',
  Rejected: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80',
  Duplicate: 'bg-orange-50 text-orange-800 ring-1 ring-orange-200/80',
  PenaltyIssued: 'bg-fuchsia-50 text-fuchsia-800 ring-1 ring-fuchsia-200/80',
  ClosedNoViolation: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200/80',
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
