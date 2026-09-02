export interface LockGamificationInput {
  reason?: string;
}

export interface LockGamificationResult {
  userId: string;
  isLocked: boolean;
  message: string;
}

export type LeaderboardPeriod = 'AllTime' | 'Weekly' | 'Monthly' | 'Yearly';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  points: number;
  level: number;
}

export interface LeaderboardData {
  period: LeaderboardPeriod;
  year: number | null;
  month: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  entries: LeaderboardEntry[];
}

export interface LeaderboardQueryParams {
  period?: LeaderboardPeriod;
  top?: number;
  year?: number;
  month?: number;
}

export interface TestNotificationTemplateInput {
  recipientEmail: string;
}

export interface TestNotificationTemplateResult {
  message: string;
  sent: boolean;
}
