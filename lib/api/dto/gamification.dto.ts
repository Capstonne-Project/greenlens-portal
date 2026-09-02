export interface LockGamificationBodyDto {
  reason?: string;
}

export interface LockGamificationResultDto {
  userId?: string;
  isLocked?: boolean;
  message?: string;
}

/** GET /v1/gamification/leaderboard — query `period` enum. */
export type LeaderboardPeriodDto = 'AllTime' | 'Weekly' | 'Monthly' | 'Yearly';

/** GET /v1/gamification/leaderboard — `data.entries[]`. */
export interface LeaderboardEntryDto {
  rank: number;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  points: number;
  level: number;
}

/** GET /v1/gamification/leaderboard — `data` payload. */
export interface LeaderboardResponseDto {
  period: LeaderboardPeriodDto;
  year: number | null;
  month: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  entries: LeaderboardEntryDto[] | null;
}

export interface TestNotificationTemplateBodyDto {
  recipientEmail?: string;
  email?: string;
  userId?: string;
}

export interface TestNotificationTemplateResultDto {
  message?: string;
  sent?: boolean;
}
