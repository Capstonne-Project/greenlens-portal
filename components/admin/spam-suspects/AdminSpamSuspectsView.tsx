'use client';

import {
  ADMIN_TABLE_CLASS,
  ADMIN_TABLE_HEAD_CELL,
  ADMIN_TABLE_ROW_BORDER,
  ADMIN_TABLE_SCROLL,
  ADMIN_TABLE_SHELL,
  adminTableCellPad,
} from '@/components/admin/shared/adminDataTableChrome';
import { PaginationSimple } from '@/components/ui/pagination';
import SaveIcon from '@/components/ui/save-icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Filter, Loader2, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

const COLUMN_COUNT = 6;

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

      <div className={ADMIN_TABLE_SHELL}>
        <div className={ADMIN_TABLE_SCROLL}>
          <Table className={ADMIN_TABLE_CLASS}>
            <TableHeader className="sticky top-0 z-10 bg-slate-100">
              <TableRow className={cn(ADMIN_TABLE_ROW_BORDER, 'bg-slate-100 hover:bg-slate-100')}>
                <TableHead
                  className={cn(
                    adminTableCellPad('first', 'head'),
                    ADMIN_TABLE_HEAD_CELL,
                    'w-[22%]'
                  )}
                >
                  Tài khoản
                </TableHead>
                <TableHead
                  className={cn(
                    adminTableCellPad('middle', 'head'),
                    ADMIN_TABLE_HEAD_CELL,
                    'w-[10%]'
                  )}
                >
                  Trạng thái
                </TableHead>
                <TableHead
                  className={cn(
                    adminTableCellPad('middle', 'head'),
                    ADMIN_TABLE_HEAD_CELL,
                    'w-[8%] tabular-nums'
                  )}
                >
                  / giờ
                </TableHead>
                <TableHead
                  className={cn(
                    adminTableCellPad('middle', 'head'),
                    ADMIN_TABLE_HEAD_CELL,
                    'w-[10%] tabular-nums'
                  )}
                >
                  Từ chối 7d
                </TableHead>
                <TableHead
                  className={cn(
                    adminTableCellPad('middle', 'head'),
                    ADMIN_TABLE_HEAD_CELL,
                    'w-[8%] tabular-nums'
                  )}
                >
                  AI flag
                </TableHead>
                <TableHead
                  className={cn(
                    adminTableCellPad('last', 'head'),
                    ADMIN_TABLE_HEAD_CELL,
                    'w-[28%]'
                  )}
                >
                  Lý do nghi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isPending && !listQuery.data ? (
                <TableRow className={ADMIN_TABLE_ROW_BORDER}>
                  <TableCell colSpan={COLUMN_COUNT} className="h-40 px-6 py-4 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : listQuery.isError ? (
                <TableRow className={ADMIN_TABLE_ROW_BORDER}>
                  <TableCell colSpan={COLUMN_COUNT} className="h-40 px-6 py-4 text-center">
                    <p className="text-sm text-destructive">{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => listQuery.refetch()}
                      className="mt-2 text-sm font-medium text-sky-700 hover:underline"
                    >
                      Thử lại
                    </button>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className={cn(ADMIN_TABLE_ROW_BORDER, 'hover:bg-transparent')}>
                  <TableCell colSpan={COLUMN_COUNT} className="h-40 px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                      <SaveIcon size={32} className="opacity-30" />
                      <span>Không có tài khoản nghi spam</span>
                      <span className="text-xs">
                        Thử giảm ngưỡng heuristic nếu cần quét rộng hơn.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map(item => {
                  const reasons = splitSuspectReasons(item.suspectReasons);
                  return (
                    <TableRow
                      key={item.userId}
                      className={cn(ADMIN_TABLE_ROW_BORDER, 'hover:bg-sky-50/40')}
                    >
                      <TableCell
                        className={cn(adminTableCellPad('first', 'body'), 'align-middle w-[22%]')}
                      >
                        <p className="font-semibold text-foreground">{item.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.email}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                          {item.userId}
                        </p>
                      </TableCell>
                      <TableCell
                        className={cn(adminTableCellPad('middle', 'body'), 'align-middle w-[10%]')}
                      >
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                            suspectBanBadgeClass(item.isBanned)
                          )}
                        >
                          {suspectBanLabel(item.isBanned)}
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          adminTableCellPad('middle', 'body'),
                          'align-middle tabular-nums font-medium text-foreground w-[8%]'
                        )}
                      >
                        {formatSuspectMetric(item.reportsLastHour)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          adminTableCellPad('middle', 'body'),
                          'align-middle tabular-nums font-medium text-foreground w-[10%]'
                        )}
                      >
                        {formatSuspectMetric(item.rejectedLast7Days)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          adminTableCellPad('middle', 'body'),
                          'align-middle tabular-nums font-medium text-foreground w-[8%]'
                        )}
                      >
                        {formatSuspectMetric(item.aiFlaggedCount)}
                      </TableCell>
                      <TableCell
                        className={cn(adminTableCellPad('last', 'body'), 'align-middle w-[28%]')}
                      >
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
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-3">
          <div className="min-w-0">
            {pagination.totalPages > 1 ? (
              <PaginationSimple
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                className="w-auto"
              />
            ) : null}
          </div>
          <p className="shrink-0 text-xs text-slate-500 tabular-nums">
            {pagination.totalItems.toLocaleString('vi-VN')} rows
          </p>
        </div>
      </div>
    </div>
  );
}
