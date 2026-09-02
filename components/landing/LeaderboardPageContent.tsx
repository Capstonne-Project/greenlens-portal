'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { LeaderboardPodium } from '@/components/landing/LeaderboardPodium';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { LeaderboardEntry, LeaderboardPeriod } from '@/lib/api/models/gamification';
import { LEADERBOARD_PERIOD_OPTIONS } from '@/lib/constants/leaderboard';
import { useLeaderboard } from '@/hooks/useGamification';
import { cn } from '@/lib/utils';
import {
  formatLeaderboardPeriodDate,
  formatLeaderboardPoints,
  leaderboardDisplayName,
  leaderboardInitials,
} from '@/utils/leaderboardUi';

function LeaderboardListItem({ entry }: { entry: LeaderboardEntry }) {
  const name = leaderboardDisplayName(entry);
  const hasAvatar = Boolean(entry.avatarUrl?.trim());

  return (
    <li className="landing-leaderboard-list__item">
      <span className="landing-leaderboard-list__rank tabular-nums">{entry.rank}</span>
      <span className="landing-leaderboard-list__user">
        <span className="landing-leaderboard-list__avatar" aria-hidden>
          {hasAvatar ? (
            <Image
              src={entry.avatarUrl!}
              alt=""
              width={40}
              height={40}
              sizes="40px"
              className="size-full object-cover"
              unoptimized
            />
          ) : (
            leaderboardInitials(entry)
          )}
        </span>
        <span className="landing-leaderboard-list__identity">
          <span className="landing-leaderboard-list__name" title={name}>
            {name}
          </span>
          <span className="landing-leaderboard-list__level-inline">Cấp {entry.level}</span>
        </span>
      </span>
      <span className="landing-leaderboard-list__points">
        <span className="tabular-nums">{formatLeaderboardPoints(entry.points)}</span>
        <span className="landing-leaderboard-list__points-unit">điểm</span>
      </span>
      <span className="landing-leaderboard-list__level">
        <span className="landing-leaderboard-level-badge">Cấp {entry.level}</span>
      </span>
    </li>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-8" aria-hidden>
      <div className="flex items-end justify-center gap-2 sm:gap-4">
        <Skeleton className="h-36 w-[28%] max-w-28 rounded-t-xl bg-white/10 sm:h-48" />
        <Skeleton className="h-44 w-[32%] max-w-32 rounded-t-xl bg-white/10 sm:h-56" />
        <Skeleton className="h-32 w-[28%] max-w-28 rounded-t-xl bg-white/10 sm:h-44" />
      </div>
      <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-2 sm:p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/10 sm:h-12" />
        ))}
      </div>
    </div>
  );
}

export function LeaderboardPageContent() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('AllTime');
  const { data, isLoading, isError, refetch, isFetching, isPlaceholderData } = useLeaderboard({
    period,
  });

  const entries = data?.entries ?? [];
  const topThree = entries.filter(entry => entry.rank <= 3).sort((a, b) => a.rank - b.rank);
  const rest = entries.filter(entry => entry.rank > 3);

  const periodLabel = LEADERBOARD_PERIOD_OPTIONS.find(option => option.id === period)?.label;
  const showPeriodDates = !isPlaceholderData;
  const periodStart = showPeriodDates ? formatLeaderboardPeriodDate(data?.periodStart) : null;
  const periodEnd = showPeriodDates ? formatLeaderboardPeriodDate(data?.periodEnd) : null;
  const isRefreshing = isFetching && !isLoading;

  return (
    <div className="landing-hit landing-shell pt-12 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:pb-16 lg:pb-20">
      <div
        className="mx-auto flex w-full min-w-0 max-w-4xl flex-col items-center gap-6 sm:gap-8"
        aria-busy={isLoading || isRefreshing}
      >
        <header className="flex w-full max-w-2xl flex-col items-center gap-2.5 px-1 text-center sm:gap-3">
          <h1 className="landing-audiences__title">Bảng xếp hạng</h1>
          <p className="landing-how-subtitle max-w-xl text-pretty">
            Top công dân đóng góp báo cáo ô nhiễm đã xác minh. Báo cáo ẩn danh không tính điểm.
          </p>
        </header>

        <div
          className="landing-leaderboard-period-toggle"
          role="radiogroup"
          aria-label="Chọn kỳ xếp hạng"
        >
          {LEADERBOARD_PERIOD_OPTIONS.map(option => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={period === option.id}
              onClick={() => setPeriod(option.id)}
              className={cn(
                'landing-leaderboard-period-toggle__btn',
                period === option.id && 'landing-leaderboard-period-toggle__btn--active'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <LeaderboardSkeleton />
        ) : isError && entries.length === 0 ? (
          <div className="landing-glass w-full max-w-2xl space-y-4 rounded-2xl px-5 py-8 text-center sm:px-6 sm:py-10">
            <p className="text-sm text-pretty text-white">
              Chưa tải được bảng xếp hạng từ máy chủ. Thử lại sau hoặc đăng nhập nếu API yêu cầu
              phiên.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => void refetch()}
            >
              Thử lại
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div
            className="landing-glass flex w-full max-w-2xl flex-col items-center gap-4 rounded-2xl px-5 py-10 text-center sm:px-6 sm:py-12"
            role="status"
          >
            <div
              className="flex size-14 items-center justify-center rounded-full bg-lime-400/10 ring-1 ring-lime-200/20"
              aria-hidden
            >
              <Trophy className="size-7 text-lime-200/70" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium text-white">Chưa có dữ liệu xếp hạng</p>
              <p className="text-sm text-pretty text-stone-300/90">
                Kỳ {periodLabel?.toLowerCase() ?? 'này'} chưa ghi nhận điểm. Danh sách sẽ cập nhật
                khi có công dân tham gia.
              </p>
            </div>
          </div>
        ) : (
          <>
            {(periodStart || periodEnd || isRefreshing || isError) && (
              <div className="landing-leaderboard-status" role="status">
                <Trophy className="mt-0.5 size-4 shrink-0 text-lime-200" aria-hidden />
                <div className="min-w-0 text-sm text-pretty text-stone-200/90">
                  {periodLabel ? (
                    <span className="font-medium text-white">{periodLabel}</span>
                  ) : null}
                  {periodStart && periodEnd ? (
                    <span>
                      {periodLabel ? ' · ' : ''}
                      {periodStart} — {periodEnd}
                    </span>
                  ) : null}
                  {isRefreshing ? <span className="text-stone-400"> · Đang cập nhật…</span> : null}
                  {isError ? (
                    <>
                      <span className="text-stone-300"> · Không tải được kỳ này.</span>{' '}
                      <button
                        type="button"
                        className="cursor-pointer font-medium text-lime-200 underline-offset-2 hover:underline"
                        onClick={() => void refetch()}
                      >
                        Thử lại
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            )}

            {topThree.length > 0 ? <LeaderboardPodium entries={topThree} /> : null}

            {rest.length > 0 ? (
              <div className="landing-leaderboard-list-wrap w-full min-w-0">
                <div className="landing-leaderboard-list__head" aria-hidden>
                  <span>Hạng</span>
                  <span>Công dân</span>
                  <span>Điểm</span>
                  <span>Cấp</span>
                </div>
                <ol className="landing-leaderboard-list" aria-label="Xếp hạng từ hạng 4">
                  {rest.map(entry => (
                    <LeaderboardListItem key={`${entry.userId}-${entry.rank}`} entry={entry} />
                  ))}
                </ol>
              </div>
            ) : null}
          </>
        )}
      </div>

      <p className="mx-auto mt-8 max-w-2xl px-1 text-center text-xs text-pretty text-stone-400 sm:mt-10">
        Điểm cập nhật theo quy tắc gamification của hệ thống. Chỉ hiển thị tên hiển thị công khai —
        không lộ thông tin nhạy cảm.
      </p>
    </div>
  );
}
