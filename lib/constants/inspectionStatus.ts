/**
 * Status hồ sơ xử phạt — GET /v1/reports/{id}/inspections
 * (không phải status báo cáo rác).
 *
 * Field phụ thuộc status (BE):
 * - Draft/InProgress: chưa có violationLevel / penaltyAmount
 * - PenaltyIssued+: có mức + tiền (trừ ClosedNoViolation)
 * - Closed*: mới có closedAt
 */
export const INSPECTION_STATUSES = [
  'Draft',
  'InProgress',
  'PenaltyIssued',
  'PartiallyPaid',
  'Paid',
  'Overdue',
  'Closed',
  'ClosedNoViolation',
] as const;

export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

/** Badge VI — khớp tài liệu BE. */
export const INSPECTION_STATUS_LABEL_VI: Record<InspectionStatus, string> = {
  Draft: 'Chờ tiếp nhận',
  InProgress: 'Đang điều tra',
  PenaltyIssued: 'Đã xử phạt',
  PartiallyPaid: 'Nộp một phần',
  Paid: 'Đã nộp đủ',
  Overdue: 'Quá hạn nộp',
  Closed: 'Đã đóng',
  ClosedNoViolation: 'Không xử phạt',
};

/** Status đã ban hành QĐ → hiện mức + tiền phạt (trừ ClosedNoViolation). */
const PENALTY_FIELD_STATUSES = new Set<InspectionStatus>([
  'PenaltyIssued',
  'PartiallyPaid',
  'Paid',
  'Overdue',
  'Closed',
]);

const CLOSED_STATUSES = new Set<InspectionStatus>(['Closed', 'ClosedNoViolation']);

const SLA_WARN_STATUSES = new Set<InspectionStatus>(['Draft', 'InProgress']);

export function isInspectionStatus(value: string): value is InspectionStatus {
  return (INSPECTION_STATUSES as readonly string[]).includes(value);
}

export function inspectionStatusLabelVi(status: string): string {
  if (isInspectionStatus(status)) return INSPECTION_STATUS_LABEL_VI[status];
  return status;
}

/** Mức vi phạm + số tiền phạt / đã nộp — từ PenaltyIssued trở đi (không áp ClosedNoViolation). */
export function inspectionShowsPenaltyFields(status: string): boolean {
  return isInspectionStatus(status) && PENALTY_FIELD_STATUSES.has(status);
}

/** Ngày đóng — chỉ Closed / ClosedNoViolation. */
export function inspectionShowsClosedAt(status: string): boolean {
  return isInspectionStatus(status) && CLOSED_STATUSES.has(status);
}

/**
 * Cảnh báo SLA hạn xử lý quá hạn — chỉ khi còn Draft/InProgress
 * và `now > slaInspectionDueAt`.
 */
export function inspectionSlaIsOverdue(status: string, slaIso: string | null | undefined): boolean {
  if (!slaIso?.trim()) return false;
  if (!isInspectionStatus(status) || !SLA_WARN_STATUSES.has(status)) return false;
  const t = new Date(slaIso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() > t;
}

/**
 * Tên đối tượng vi phạm — ưu tiên master → violatorName.
 * `null` = chưa cập nhật (Draft thường vậy — UI hiện «Đối tượng: Chưa cập nhật»).
 */
export function resolveInspectionSubjectName(
  violatingEntityName: string | null | undefined,
  violatorName: string | null | undefined
): string | null {
  return violatingEntityName?.trim() || violatorName?.trim() || null;
}

/** Class badge theo status (PartiallyPaid = vàng, Overdue = đỏ, ClosedNoViolation = xám). */
export function inspectionStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Draft':
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80';
    case 'InProgress':
      return 'bg-sky-50 text-sky-800 ring-1 ring-sky-200/80';
    case 'PenaltyIssued':
      return 'bg-fuchsia-50 text-fuchsia-800 ring-1 ring-fuchsia-200/80';
    case 'PartiallyPaid':
      return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
    case 'Paid':
      return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
    case 'Overdue':
      return 'bg-red-50 text-red-800 ring-1 ring-red-200/80';
    case 'Closed':
      return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80';
    case 'ClosedNoViolation':
      return 'bg-stone-100 text-stone-600 ring-1 ring-stone-200/80';
    default:
      return 'bg-muted text-muted-foreground ring-1 ring-border';
  }
}
