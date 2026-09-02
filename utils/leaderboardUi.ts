import type { LeaderboardEntry } from '@/lib/api/models/gamification';

const FALLBACK_DISPLAY_NAME = 'Công dân GreenLens';

const pointsFormatter = new Intl.NumberFormat('vi-VN');
const periodDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatLeaderboardPoints(value: number): string {
  return pointsFormatter.format(value);
}

export function formatLeaderboardPeriodDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return periodDateFormatter.format(date);
}

export function leaderboardDisplayName(entry: Pick<LeaderboardEntry, 'displayName'>): string {
  const name = entry.displayName?.trim();
  return name && name.length > 0 ? name : FALLBACK_DISPLAY_NAME;
}

export function leaderboardInitials(entry: Pick<LeaderboardEntry, 'displayName'>): string {
  const name = leaderboardDisplayName(entry);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
