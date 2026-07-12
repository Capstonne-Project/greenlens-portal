import type { SpamSuspect } from '@/lib/api/models/spamSuspect';

export function splitSuspectReasons(reasons: string): string[] {
  if (!reasons.trim()) return [];
  return reasons
    .split(/[,;|]/)
    .map(part => part.trim())
    .filter(Boolean);
}

export function formatSuspectMetric(value: number): string {
  return value.toLocaleString('vi-VN');
}

export function suspectBanLabel(isBanned: boolean): string {
  return isBanned ? 'Đã khóa' : 'Đang hoạt động';
}

export function suspectBanBadgeClass(isBanned: boolean): string {
  return isBanned
    ? 'border-red-200 bg-red-50 text-red-800'
    : 'border-emerald-200 bg-emerald-50 text-emerald-900';
}

export function suspectPrimaryReason(item: SpamSuspect): string {
  const parts = splitSuspectReasons(item.suspectReasons);
  return parts[0] ?? 'Nghi spam theo heuristic';
}
