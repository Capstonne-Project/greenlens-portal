import { HCMC_WARD_NAMES_BY_LENGTH } from '@/lib/constants/hcmcWardNames';
import { STALE_UPDATE_DAYS, TRACKING_EXCLUDED_STATUSES } from '@/lib/constants/officerTracking';
import type { ReportQueueItem, ReportStatus } from '@/lib/api/models/report';

function normalizeForWardMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function formatPhuongLabel(name: string): string {
  return `P. ${name.trim()}`;
}

/** Khớp tên phường trong address khi không có tiền tố "Phường" / "P.". */
function matchWardNameInAddress(address: string): string | null {
  const normalizedAddress = normalizeForWardMatch(address);
  for (const ward of HCMC_WARD_NAMES_BY_LENGTH) {
    if (normalizedAddress.includes(normalizeForWardMatch(ward))) {
      return ward;
    }
  }
  return null;
}

const EXCLUDED = new Set<ReportStatus>(TRACKING_EXCLUDED_STATUSES);

export function isTrackingReport(item: ReportQueueItem): boolean {
  return !EXCLUDED.has(item.status);
}

export function filterTrackingReports(items: ReportQueueItem[]): ReportQueueItem[] {
  return items.filter(isTrackingReport);
}

export function isStaleReport(item: ReportQueueItem, now = Date.now()): boolean {
  if (item.status !== 'InProgress') return false;
  const created = new Date(item.createdAt).getTime();
  const staleMs = STALE_UPDATE_DAYS * 24 * 60 * 60 * 1000;
  return now - created >= staleMs;
}

export function formatTrackingSla(isoString: string): { text: string; overdue: boolean } {
  const due = new Date(isoString);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();

  if (diffMs < 0) {
    const overdueH = Math.floor(-diffMs / 3_600_000);
    if (overdueH >= 24) {
      const days = Math.floor(overdueH / 24);
      const hours = overdueH % 24;
      return {
        text: hours > 0 ? `Quá hạn ${days} ngày ${hours}h` : `Quá hạn ${days} ngày`,
        overdue: true,
      };
    }
    return { text: `Quá hạn ${overdueH}h`, overdue: true };
  }

  const totalH = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(totalH / 24);
  const hours = totalH % 24;
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);

  if (days > 0) {
    return { text: hours > 0 ? `${days} ngày ${hours}h` : `${days} ngày`, overdue: false };
  }
  if (totalH > 0) {
    return {
      text: minutes > 0 ? `${totalH}h ${minutes}m` : `${totalH}h`,
      overdue: false,
    };
  }
  return { text: `${minutes}m`, overdue: false };
}

/**
 * Cột vị trí: lấy phường từ `address`, hiển thị `P. {tên}`.
 * - Có "Phường" / "P." → lấy phần tên sau tiền tố
 * - Chỉ có tên (VD: "Bến Thành") → khớp danh sách phường HCM
 */
export function extractLocationLabel(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) return '—';

  const inline = trimmed.match(/(?:Phường|P\.)\s*([^,;]+)/iu);
  if (inline?.[1]) {
    const name = inline[1].trim();
    if (name) return formatPhuongLabel(name);
  }

  const parts = trimmed
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);
  for (const part of parts) {
    const seg = part.match(/^(?:Phường|P\.)\s*(.+)$/iu);
    if (seg?.[1]) {
      const name = seg[1].trim();
      if (name) return formatPhuongLabel(name);
    }
  }

  const matched = matchWardNameInAddress(trimmed);
  if (matched) return formatPhuongLabel(matched);

  return '—';
}

export function formatCheckInTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export type TrackingRowTone = 'default' | 'stale' | 'overdue' | 'escalate';

export function getTrackingRowTone(item: ReportQueueItem): TrackingRowTone {
  if (item.status === 'PenaltyIssued') return 'escalate';
  const sla = formatTrackingSla(item.slaVerifyDueAt);
  if (sla.overdue) return 'overdue';
  if (isStaleReport(item)) return 'stale';
  return 'default';
}

export function getTrackingStatusLabel(item: ReportQueueItem): string {
  if (isStaleReport(item)) return 'Chưa update 3 ngày';
  const labels: Partial<Record<ReportStatus, string>> = {
    Assigned: 'Đã phân công',
    InProgress: 'Đang xử lý',
    Resolved: 'Đã giải quyết',
    Closed: 'Đã đóng',
    Rejected: 'Từ chối',
    Duplicate: 'Trùng lặp',
    PenaltyIssued: 'Escalate',
    ClosedNoViolation: 'Đóng — Không vi phạm',
  };
  return labels[item.status] ?? item.status;
}

export interface TrackingSummaryStats {
  inProgress: number;
  stale: number;
  overdueSla: number;
  escalate: number;
  highSeverity: number;
  completed: number;
}

export function computeTrackingSummary(items: ReportQueueItem[]): TrackingSummaryStats {
  const tracking = filterTrackingReports(items);
  let inProgress = 0;
  let stale = 0;
  let overdueSla = 0;
  let escalate = 0;
  let highSeverity = 0;
  let completed = 0;

  for (const item of tracking) {
    if (item.status === 'InProgress') inProgress += 1;
    if (isStaleReport(item)) stale += 1;
    if (formatTrackingSla(item.slaVerifyDueAt).overdue) overdueSla += 1;
    if (item.status === 'PenaltyIssued') escalate += 1;
    if (item.severity === 'High' || item.severity === 'Critical') highSeverity += 1;
    if (
      item.status === 'Resolved' ||
      item.status === 'Closed' ||
      item.status === 'ClosedNoViolation'
    ) {
      completed += 1;
    }
  }

  return { inProgress, stale, overdueSla, escalate, highSeverity, completed };
}
