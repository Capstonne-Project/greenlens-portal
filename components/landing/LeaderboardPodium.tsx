import Image from 'next/image';
import { Crown, Medal } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/api/models/gamification';
import { cn } from '@/lib/utils';
import {
  formatLeaderboardPoints,
  leaderboardDisplayName,
  leaderboardInitials,
} from '@/utils/leaderboardUi';

function PodiumAvatar({ entry, rank }: { entry: LeaderboardEntry; rank: 1 | 2 | 3 }) {
  const hasAvatar = Boolean(entry.avatarUrl?.trim());

  return (
    <div
      className={cn(
        'landing-leaderboard-podium__avatar',
        rank === 1 && 'landing-leaderboard-podium__avatar--1',
        rank === 2 && 'landing-leaderboard-podium__avatar--2',
        rank === 3 && 'landing-leaderboard-podium__avatar--3'
      )}
    >
      {hasAvatar ? (
        <Image
          src={entry.avatarUrl!}
          alt=""
          width={96}
          height={96}
          sizes="(max-width: 639px) 64px, 96px"
          className="size-full object-cover"
          priority={rank === 1}
          unoptimized
        />
      ) : (
        <span className="landing-leaderboard-podium__avatar-fallback" aria-hidden>
          {leaderboardInitials(entry)}
        </span>
      )}
    </div>
  );
}

function RankBadge({ rank }: { rank: 1 | 2 | 3 }) {
  return (
    <span
      className={cn(
        'landing-leaderboard-podium__badge',
        rank === 1 && 'landing-leaderboard-podium__badge--1',
        rank === 2 && 'landing-leaderboard-podium__badge--2',
        rank === 3 && 'landing-leaderboard-podium__badge--3'
      )}
      aria-label={`Hạng ${rank}`}
    >
      {rank === 1 ? (
        <Crown className="size-3.5 sm:size-4" aria-hidden />
      ) : (
        <Medal className="size-3.5 sm:size-4" aria-hidden />
      )}
    </span>
  );
}

function PodiumSlot({ entry, rank }: { entry: LeaderboardEntry | undefined; rank: 1 | 2 | 3 }) {
  if (!entry) {
    return (
      <div
        className={cn(
          'landing-leaderboard-podium__slot landing-leaderboard-podium__slot--empty',
          `landing-leaderboard-podium__slot--${rank}`
        )}
        aria-hidden
      />
    );
  }

  const name = leaderboardDisplayName(entry);

  return (
    <article
      className={cn(
        'landing-leaderboard-podium__slot',
        `landing-leaderboard-podium__slot--${rank}`
      )}
    >
      <div className="landing-leaderboard-podium__profile">
        <PodiumAvatar entry={entry} rank={rank} />
        <p className="landing-leaderboard-podium__name" title={name}>
          {name}
        </p>
        <RankBadge rank={rank} />
        <p className="landing-leaderboard-podium__meta">Cấp {entry.level}</p>
      </div>
      <div className="landing-leaderboard-podium__stand">
        <p className="landing-leaderboard-podium__points tabular-nums">
          {formatLeaderboardPoints(entry.points)}
        </p>
        <p className="landing-leaderboard-podium__points-label">điểm</p>
      </div>
    </article>
  );
}

/** Top-3 podium — 2nd | 1st | 3rd layout. */
export function LeaderboardPodium({ entries }: { entries: LeaderboardEntry[] }) {
  const byRank = (rank: number) => entries.find(entry => entry.rank === rank);

  return (
    <div className="landing-leaderboard-podium" role="region" aria-label="Top 3 bảng xếp hạng">
      <PodiumSlot entry={byRank(2)} rank={2} />
      <PodiumSlot entry={byRank(1)} rank={1} />
      <PodiumSlot entry={byRank(3)} rank={3} />
    </div>
  );
}
