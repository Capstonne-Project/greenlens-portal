'use client';

import { useSpamSuspectsList } from '@/hooks/useSpamSuspects';
import type { SpamSuspectsListParams, SpamSuspectsPagination } from '@/lib/api/models/spamSuspect';
import { SPAM_SUSPECT_DEFAULTS, SPAM_SUSPECTS_PAGE_SIZE } from '@/lib/constants/spamSuspects';
import { cn } from '@/lib/utils';
import {
  formatSuspectMetric,
  splitSuspectReasons,
  suspectBanBadgeClass,
  suspectBanLabel,
} from '@/utils/spamSuspectUi';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const EMPTY_PAGINATION: SpamSuspectsPagination = {
  page: 1,
  pageSize: SPAM_SUSPECTS_PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

function parseThreshold(raw: string, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

export function AdminSpamSuspectsView() {
  const [page, setPage] = useState(1);
  const [minReportsPerHour, setMinReportsPerHour] = useState(
    String(SPAM_SUSPECT_DEFAULTS.minReportsPerHour)
  );
  const [minRejected7Days, setMinRejected7Days] = useState(
    String(SPAM_SUSPECT_DEFAULTS.minRejected7Days)
  );
  const [minAiFlagged, setMinAiFlagged] = useState(String(SPAM_SUSPECT_DEFAULTS.minAiFlagged));

  const params = useMemo<SpamSuspectsListParams>(
    () => ({
      page,
      pageSize: SPAM_SUSPECTS_PAGE_SIZE,
      minReportsPerHour: parseThreshold(minReportsPerHour, SPAM_SUSPECT_DEFAULTS.minReportsPerHour),
      minRejected7Days: parseThreshold(minRejected7Days, SPAM_SUSPECT_DEFAULTS.minRejected7Days),
      minAiFlagged: parseThreshold(minAiFlagged, SPAM_SUSPECT_DEFAULTS.minAiFlagged),
    }),
    [minAiFlagged, minRejected7Days, minReportsPerHour, page]
  );

  const listQuery = useSpamSuspectsList(params);
  const items = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? EMPTY_PAGINATION;
  const aiThreshold = params.minAiFlagged ?? SPAM_SUSPECT_DEFAULTS.minAiFlagged;

  const resetFilters = () => {
    setMinReportsPerHour(String(SPAM_SUSPECT_DEFAULTS.minReportsPerHour));
    setMinRejected7Days(String(SPAM_SUSPECT_DEFAULTS.minRejected7Days));
    setMinAiFlagged(String(SPAM_SUSPECT_DEFAULTS.minAiFlagged));
    setPage(1);
  };

  const errorMessage =
    listQuery.error instanceof Error
      ? listQuery.error.message
      : 'Không tải được danh sách nghi spam.';

  return (
    <div className="w-full min-w-0 space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Dashboard heuristic: gửi &gt;{SPAM_SUSPECT_DEFAULTS.minReportsPerHour}/giờ, từ chối &gt;
          {SPAM_SUSPECT_DEFAULTS.minRejected7Days}/7 ngày, AI gắn cờ ≥
          {SPAM_SUSPECT_DEFAULTS.minAiFlagged}. Chỉ xem — không khóa tài khoản từ màn này.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Tổng nghi spam',
            value: pagination.totalItems.toLocaleString('vi-VN'),
            hint: 'Theo ngưỡng hiện tại',
          },
          {
            label: 'Trên trang',
            value: String(items.length),
            hint: `Tối đa ${SPAM_SUSPECTS_PAGE_SIZE}/trang`,
          },
          {
            label: 'Đã khóa',
            value: String(items.filter(i => i.isBanned).length),
            hint: 'Trong trang hiện tại',
          },
          {
            label: 'AI gắn cờ cao',
            value: String(items.filter(i => i.aiFlaggedCount >= aiThreshold).length),
            hint: `≥ ${aiThreshold} flag`,
          },
        ].map(card => (
          <article
            key={card.label}
            className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-950">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-950">
          <Filter className="size-4 text-emerald-700" aria-hidden />
          Ngưỡng heuristic
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
          <div className="space-y-2">
            <label htmlFor="spam-min-hour" className="text-sm font-medium">
              Báo cáo / giờ (tối thiểu)
            </label>
            <input
              id="spam-min-hour"
              type="number"
              min={0}
              value={minReportsPerHour}
              onChange={e => {
                setMinReportsPerHour(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="spam-min-reject" className="text-sm font-medium">
              Từ chối / 7 ngày (tối thiểu)
            </label>
            <input
              id="spam-min-reject"
              type="number"
              min={0}
              value={minRejected7Days}
              onChange={e => {
                setMinRejected7Days(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="spam-min-ai" className="text-sm font-medium">
              AI gắn cờ (tối thiểu)
            </label>
            <input
              id="spam-min-ai"
              type="number"
              min={0}
              value={minAiFlagged}
              onChange={e => {
                setMinAiFlagged(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
          >
            <RotateCcw className="size-4" aria-hidden />
            Mặc định
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        {listQuery.isPending && !listQuery.data ? (
          <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Đang tải danh sách nghi spam…
          </div>
        ) : listQuery.isError ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <AlertTriangle className="size-8 text-destructive" aria-hidden />
            <p className="text-sm text-destructive">{errorMessage}</p>
            <button
              type="button"
              onClick={() => listQuery.refetch()}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center text-muted-foreground">
            <ShieldAlert className="size-8 text-emerald-700/50" aria-hidden />
            <p className="text-sm font-medium text-foreground">Không có tài khoản nghi spam</p>
            <p className="text-xs">Thử giảm ngưỡng heuristic nếu cần quét rộng hơn.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Tài khoản</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium tabular-nums">/ giờ</th>
                  <th className="px-4 py-3 font-medium tabular-nums">Từ chối 7d</th>
                  <th className="px-4 py-3 font-medium tabular-nums">AI flag</th>
                  <th className="px-4 py-3 font-medium">Lý do nghi</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const reasons = splitSuspectReasons(item.suspectReasons);
                  return (
                    <tr
                      key={item.userId}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{item.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.email}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                          {item.userId}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                            suspectBanBadgeClass(item.isBanned)
                          )}
                        >
                          {suspectBanLabel(item.isBanned)}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium text-foreground">
                        {formatSuspectMetric(item.reportsLastHour)}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium text-foreground">
                        {formatSuspectMetric(item.rejectedLast7Days)}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium text-foreground">
                        {formatSuspectMetric(item.aiFlaggedCount)}
                      </td>
                      <td className="px-4 py-3">
                        {reasons.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {reasons.map(reason => (
                              <span
                                key={`${item.userId}-${reason}`}
                                className="inline-flex max-w-[220px] truncate rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-950"
                                title={reason}
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {(pagination.page - 1) * pagination.pageSize + 1}–
              {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} /{' '}
              {pagination.totalItems.toLocaleString('vi-VN')}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrev || listQuery.isFetching}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" aria-hidden />
                Trước
              </button>
              <span className="text-sm tabular-nums text-muted-foreground">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={!pagination.hasNext || listQuery.isFetching}
                onClick={() => setPage(p => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-40"
              >
                Sau
                <ChevronRight className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
