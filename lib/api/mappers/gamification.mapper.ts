import type { LeaderboardEntryDto, LeaderboardResponseDto } from '@/lib/api/dto/gamification.dto';
import type { LeaderboardData, LeaderboardEntry } from '@/lib/api/models/gamification';

export function mapLeaderboardEntryDto(dto: LeaderboardEntryDto): LeaderboardEntry {
  return {
    rank: dto.rank,
    userId: dto.userId,
    displayName: dto.displayName ?? null,
    avatarUrl: dto.avatarUrl ?? null,
    points: dto.points,
    level: dto.level,
  };
}

/** GET /v1/gamification/leaderboard — normalize nullable `entries`. */
export function mapLeaderboardResponseDto(dto: LeaderboardResponseDto): LeaderboardData {
  return {
    period: dto.period,
    year: dto.year ?? null,
    month: dto.month ?? null,
    periodStart: dto.periodStart ?? null,
    periodEnd: dto.periodEnd ?? null,
    entries: Array.isArray(dto.entries) ? dto.entries.map(mapLeaderboardEntryDto) : [],
  };
}
