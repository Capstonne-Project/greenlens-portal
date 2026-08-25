import { getApiBaseUrl } from '@/lib/api/getApiBaseUrl';
import type { AdminBadge } from '@/lib/api/models/adminBadge';

/** Resolve icon URL từ BE (https hoặc path tương đối qua proxy). */
export function resolveBadgeIconUrl(iconUrl: string | null | undefined): string | null {
  const raw = iconUrl?.trim();
  if (!raw || raw === 'string') return null;
  if (/^https:\/\//i.test(raw)) return raw;
  const base = getApiBaseUrl().replace(/\/$/, '');
  const path = raw.replace(/^\//, '');
  return `${base}/${path}`;
}

export type BadgeThresholdAxis = 'points' | 'reports' | 'streak' | 'actions' | 'none';

export interface BadgeThresholdInfo {
  axis: BadgeThresholdAxis;
  label: string;
  current: number | null;
}

const COMMUNITY_CODES = new Set(['duplicate_finder', 'community_voice', 'cleanup_hero']);
const STREAK_CODES = new Set(['streak_7d', 'streak_30d']);
const LEVEL_CODES = new Set(['rising_star', 'eco_expert', 'green_legend']);

/** Xác định trục ngưỡng theo code badge (BR-ADM-005 / BR-GAM-004). */
export function getBadgeThresholdInfo(badge: AdminBadge): BadgeThresholdInfo {
  const code = badge.code.toLowerCase();

  if (COMMUNITY_CODES.has(code) || badge.requiredActionCount != null) {
    return {
      axis: 'actions',
      label: 'Số hành động cộng đồng',
      current: badge.requiredActionCount,
    };
  }
  if (STREAK_CODES.has(code) || badge.requiredStreakDays != null) {
    return {
      axis: 'streak',
      label: 'Số ngày liên tiếp',
      current: badge.requiredStreakDays,
    };
  }
  if (LEVEL_CODES.has(code) || badge.requiredPoints != null) {
    return {
      axis: 'points',
      label: 'Tổng điểm',
      current: badge.requiredPoints,
    };
  }
  if (badge.requiredReportCount != null) {
    return {
      axis: 'reports',
      label: 'Số báo cáo đã xác minh',
      current: badge.requiredReportCount,
    };
  }

  return { axis: 'none', label: 'Ngưỡng thủ công', current: null };
}

export function formatBadgeThresholdValue(value: number | null): string {
  if (value == null) return '—';
  return value.toLocaleString('vi-VN');
}
