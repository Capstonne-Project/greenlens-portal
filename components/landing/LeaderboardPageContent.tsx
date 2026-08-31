'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Medal, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { LeaderboardEntry, LeaderboardPeriod } from '@/lib/api/services/fetchGamification';
import { APP_NAME } from '@/lib/constants/brand';
import { LEADERBOARD_PERIOD_OPTIONS } from '@/lib/constants/leaderboard';
import { PUBLIC_SITE_CTA } from '@/lib/constants/publicSite';
import { useLeaderboard } from '@/hooks/useGamification';
import { cn } from '@/lib/utils';

function formatPoints(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function displayName(entry: LeaderboardEntry): string {
  const name = entry.displayName?.trim();
  return name && name.length > 0 ? name : 'Công dân GreenLens';
}

function initials(entry: LeaderboardEntry): string {
  const name = displayName(entry);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <Medal className="size-5 text-amber-500" aria-label="Hạng 1" />;
  }
  if (rank === 2) {
    return <Medal className="size-5 text-slate-400" aria-label="Hạng 2" />;
  }
  if (rank === 3) {
    return <Medal className="size-5 text-amber-700" aria-label="Hạng 3" />;
  }
  return (
    <span className="inline-flex size-5 items-center justify-center text-sm font-semibold text-slate-500 tabular-nums">
      {rank}
    </span>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const name = displayName(entry);
  const hasAvatar = Boolean(entry.avatarUrl?.trim());

  return (
    <li className="flex items-center gap-3 rounded-xl px-3 py-3 sm:gap-4 sm:px-4">
      <div className="flex w-8 shrink-0 justify-center">
        <RankBadge rank={entry.rank} />
      </div>

      <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
        {hasAvatar ? (
          <Image
            src={entry.avatarUrl!}
            alt=""
            width={40}
            height={40}
            className="size-full object-cover"
            unoptimized
          />
        ) : (
          initials(entry)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">Cấp {entry.level}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-semibold text-emerald-700 tabular-nums">{formatPoints(entry.points)}</p>
        <p className="text-xs text-slate-500">điểm</p>
      </div>
    </li>
  );
}

function LeaderboardSkeleton() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 rounded-xl px-4 py-3">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-14" />
        </li>
      ))}
    </ul>
  );
}

export function LeaderboardPageContent() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('AllTime');
  const { data, isLoading, isError, refetch, isFetching } = useLeaderboard({ period });

  const entries = data?.entries ?? [];

  return (
    <div className="landing-hit landing-shell flex-1 py-12 sm:py-16">
      <section className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase">
          Cộng đồng · {APP_NAME}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Bảng xếp hạng công dân
        </h1>
        <p className="text-slate-600 text-pretty">
          Top người đóng góp báo cáo ô nhiễm đã xác minh. Báo cáo ẩn danh không tính điểm (BR-GAM).
          Đăng nhập để leo hạng khi gửi báo cáo hợp lệ.
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        {LEADERBOARD_PERIOD_OPTIONS.map(option => (
          <button
            key={option.id}
            type="button"
            onClick={() => setPeriod(option.id)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              period === option.id
                ? 'bg-emerald-600 text-white'
                : 'bg-white/80 text-slate-600 ring-1 ring-black/[0.06] hover:bg-emerald-50 hover:text-emerald-900'
            )}
            aria-pressed={period === option.id}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="landing-glass mt-8 overflow-hidden rounded-2xl">
        <div className="flex items-center gap-2 border-b border-black/[0.04] px-4 py-3 sm:px-5">
          <Trophy className="size-4 text-emerald-600" aria-hidden />
          <p className="text-sm font-medium text-slate-700">
            {LEADERBOARD_PERIOD_OPTIONS.find(o => o.id === period)?.label ?? 'Bảng xếp hạng'}
            {isFetching && !isLoading ? (
              <span className="ml-2 text-xs font-normal text-slate-400">Đang cập nhật…</span>
            ) : null}
          </p>
        </div>

        {isLoading ? (
          <div className="p-2 sm:p-3">
            <LeaderboardSkeleton />
          </div>
        ) : isError ? (
          <div className="space-y-4 px-4 py-10 text-center sm:px-6">
            <p className="text-sm text-slate-600">
              Chưa tải được bảng xếp hạng từ máy chủ. Thử lại sau hoặc đăng nhập nếu API yêu cầu
              phiên.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Thử lại
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="px-4 py-10 text-center sm:px-6">
            <p className="text-sm text-slate-600">
              Chưa có dữ liệu cho kỳ này. Hãy là người đầu tiên gửi báo cáo được xác minh.
            </p>
            <Button asChild className="mt-4 bg-emerald-600 text-white hover:bg-emerald-500">
              <Link href={PUBLIC_SITE_CTA.register.href}>{PUBLIC_SITE_CTA.register.label}</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-black/[0.04] p-1 sm:p-2">
            {entries.map(entry => (
              <LeaderboardRow key={`${entry.userId}-${entry.rank}`} entry={entry} />
            ))}
          </ul>
        )}
      </div>

      <p className="mt-6 max-w-2xl text-xs text-slate-500">
        Điểm cập nhật theo quy tắc gamification của hệ thống. Chỉ hiển thị tên hiển thị công khai —
        không lộ thông tin nhạy cảm.
      </p>
    </div>
  );
}
