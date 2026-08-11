'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, Loader2 } from 'lucide-react';
import { useLeoMyReports } from '@/hooks/useLeoOffices';
import {
  normalizeReportStatus,
  REPORT_STATUS_CHART_COLORS,
  reportStatusLabelVi,
} from '@/lib/constants/reportStatus';
import { withOfficerFromQuery } from '@/utils/officerNavigation';

const PAGE_SIZE = 8;

export function WardReportsPanel() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useLeoMyReports({ page, pageSize: PAGE_SIZE });

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const wardLabel = data?.wardName ?? null;

  return (
    <aside
      className="flex h-full min-w-0 flex-col overflow-hidden border-l border-border bg-card"
      aria-label="Danh sách báo cáo trong phường"
    >
      <header className="flex shrink-0 items-baseline justify-between gap-2 px-5 pt-5 pb-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
            {wardLabel ? `Báo cáo — ${wardLabel}` : 'Báo cáo trong phường'}
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {pagination ? `${pagination.totalItems} báo cáo` : ' '}
          </p>
        </div>
        {isFetching ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-1 px-2 py-16 text-center">
            <p className="text-sm font-medium text-foreground">Chưa có báo cáo nào</p>
            <p className="text-[13px] text-muted-foreground">
              Báo cáo mới trong phường sẽ xuất hiện ở đây.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map(item => {
              const status = normalizeReportStatus(item.status);
              const thumbnail = item.thumbnails[0] ?? null;
              const statusColor = REPORT_STATUS_CHART_COLORS[status];
              return (
                <Link
                  key={item.id}
                  href={withOfficerFromQuery(`/officer/reports/${item.id}`, '/officer/map')}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-muted outline-none ring-1 ring-black/6 transition-all duration-200 hover:ring-2 hover:ring-emerald-500/70 focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={item.categoryName}
                      fill
                      sizes="200px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-muted text-muted-foreground/60">
                      <ImageOff className="size-6" aria-hidden />
                    </div>
                  )}

                  {/* Overlay gradient — chữ nổi trên đáy ảnh, gộp thông tin vào 1 khối duy nhất */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/85 via-black/35 to-transparent" />

                  <span
                    className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm"
                    title={reportStatusLabelVi(status)}
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: statusColor }}
                      aria-hidden
                    />
                    {reportStatusLabelVi(status)}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 space-y-0.5 p-2.5">
                    <p
                      className="truncate text-[13px] font-semibold text-white"
                      title={item.categoryName}
                    >
                      {item.categoryName}
                    </p>
                    <p className="truncate text-[11px] text-white/75" title={item.address}>
                      {item.address}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev}
            aria-label="Trang trước"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[13px] font-medium text-foreground transition hover:bg-muted disabled:opacity-35 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Trước
          </button>
          <span className="text-[13px] tabular-nums text-muted-foreground">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(p => p + 1)}
            disabled={!pagination.hasNext}
            aria-label="Trang sau"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[13px] font-medium text-foreground transition hover:bg-muted disabled:opacity-35 disabled:hover:bg-transparent"
          >
            Sau
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </footer>
      ) : null}
    </aside>
  );
}
