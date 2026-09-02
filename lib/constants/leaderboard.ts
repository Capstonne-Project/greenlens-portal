import type { LeaderboardPeriod } from '@/lib/api/models/gamification';

export const LEADERBOARD_PERIOD_OPTIONS: { id: LeaderboardPeriod; label: string }[] = [
  { id: 'AllTime', label: 'Mọi thời gian' },
  { id: 'Monthly', label: 'Tháng này' },
  { id: 'Weekly', label: 'Tuần này' },
  { id: 'Yearly', label: 'Năm nay' },
];

export const LEADERBOARD_TOP_DEFAULT = 10;
