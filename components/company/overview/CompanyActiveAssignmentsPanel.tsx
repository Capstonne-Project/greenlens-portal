'use client';

import type { CompanyAssignmentListItem } from '@/lib/api/models/company';
import { cn } from '@/lib/utils';
import {
  assignmentStatusClasses,
  assignmentStatusLabel,
  formatSlaRemaining,
  queueSeverityClasses,
  queueSeverityLabel,
} from '@/utils/companyUi';
import { ArrowRight, ClipboardList, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const PREVIEW_LIMIT = 3;

function ProgressMini({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-emerald-100">
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-semibold tabular-nums text-emerald-800">{pct}%</span>
    </div>
  );
}

interface CompanyActiveAssignmentsPanelProps {
  items: CompanyAssignmentListItem[] | undefined;
  totalItems?: number;
  isPending?: boolean;
  isError?: boolean;
}

export function CompanyActiveAssignmentsPanel({
  items,
  totalItems = 0,
  isPending,
  isError,
}: CompanyActiveAssignmentsPanelProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const allItems = useMemo(() => items ?? [], [items]);
  const rows = allItems.slice(0, PREVIEW_LIMIT);
  const count = totalItems > 0 ? totalItems : allItems.length;

  const overdueCount = useMemo(() => {
    return allItems.filter(row => {
      if (!row.report.slaResolveDueAt) return false;
      const dueMs = new Date(row.report.slaResolveDueAt).getTime();
      return !Number.isNaN(dueMs) && dueMs < now;
    }).length;
  }, [allItems, now]);

  return (
    <article className="flex shrink-0 flex-col overflow-hidden rounded-card border border-border bg-card p-2.5 shadow-sm sm:p-3">
      <header className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold text-foreground sm:text-sm">
            Phân công đang theo dõi
          </h2>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {count > 0
              ? `${count} task${overdueCount > 0 ? ` · ${overdueCount} quá hạn` : ''}`
              : 'Tóm tắt nhanh — chi tiết tại trang Phân công'}
          </p>
        </div>
        <Link
          href="/company/assignments"
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800 transition hover:bg-emerald-100"
        >
          Xem tất cả
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </header>

      {isPending ? (
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Đang tải phân công…
        </div>
      ) : isError ? (
        <p className="py-4 text-center text-xs text-destructive">
          Không tải được danh sách phân công.
        </p>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <ClipboardList className="size-7 text-emerald-200" aria-hidden />
          <p className="text-xs text-muted-foreground">Chưa có task phân công nào.</p>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-3">
          {rows.map(row => {
            const dueMs = row.report.slaResolveDueAt
              ? new Date(row.report.slaResolveDueAt).getTime()
              : null;
            const slaHours =
              dueMs !== null && !Number.isNaN(dueMs) ? (dueMs - now) / (60 * 60 * 1000) : null;
            const slaOverdue = slaHours !== null && slaHours < 0;
            const detailHref = `/company/assignments?reportId=${encodeURIComponent(row.report.reportId)}`;

            return (
              <li key={row.assignmentId}>
                <Link
                  href={detailHref}
                  className="block rounded-xl border border-border/70 bg-muted/20 px-2.5 py-2 text-[10px] transition hover:border-emerald-200 hover:bg-emerald-50/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-emerald-800">
                      {row.report.code}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                        queueSeverityClasses(row.report.severity)
                      )}
                    >
                      {queueSeverityLabel(row.report.severity)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-muted-foreground">{row.team.teamName}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                        assignmentStatusClasses(row.assignmentStatus)
                      )}
                    >
                      {assignmentStatusLabel(row.assignmentStatus)}
                    </span>
                    <ProgressMini value={row.progressPercent} />
                  </div>
                  {row.report.slaResolveDueAt ? (
                    <p
                      className={cn(
                        'mt-1.5 font-medium tabular-nums',
                        slaOverdue ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    >
                      {slaHours !== null ? formatSlaRemaining(slaHours) : '—'}
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {count > rows.length ? (
        <p className="mt-2 text-[10px] text-muted-foreground">
          +{count - rows.length} task khác ·{' '}
          <Link
            href="/company/assignments"
            className="font-medium text-emerald-800 hover:underline"
          >
            mở trang Phân công
          </Link>
        </p>
      ) : null}
    </article>
  );
}
