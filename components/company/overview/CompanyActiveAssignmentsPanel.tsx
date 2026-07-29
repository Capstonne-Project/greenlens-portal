'use client';

import type { CompanyAssignmentListItem } from '@/lib/api/models/company';
import { cn } from '@/lib/utils';
import {
  assignmentStatusClasses,
  assignmentStatusLabel,
  formatCompanyDateTime,
  formatSlaRemaining,
  queueSeverityClasses,
  queueSeverityLabel,
  teamTaskAcceptanceClasses,
  teamTaskAcceptanceText,
} from '@/utils/companyUi';
import { ArrowRight, ClipboardList, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function ProgressMini({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-emerald-100">
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-[10px] font-semibold tabular-nums text-emerald-800">
        {pct}%
      </span>
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

  const rows = (items ?? []).slice(0, 8);
  const count = totalItems > 0 ? totalItems : rows.length;

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-card border border-border bg-card p-2 shadow-sm sm:p-2.5">
      <header className="mb-1.5 flex shrink-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[11px] font-semibold text-foreground sm:text-xs">
            Phân công đang theo dõi
          </h2>
          <p className="mt-0.5 text-[9px] text-muted-foreground">
            Team → báo cáo · tiến độ · SLA · người phân công
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

      <div className="min-h-0 flex-1 overflow-hidden">
        {isPending ? (
          <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Đang tải phân công…
          </div>
        ) : isError ? (
          <p className="py-6 text-center text-xs text-destructive">
            Không tải được danh sách phân công.
          </p>
        ) : rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-6 text-center">
            <ClipboardList className="size-8 text-emerald-200" aria-hidden />
            <p className="text-xs text-muted-foreground">Chưa có task phân công nào.</p>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <table className="w-full min-w-[720px] text-left text-[10px]">
              <thead className="sticky top-0 z-10 bg-card text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="pb-1.5 pr-2 font-semibold">Báo cáo</th>
                  <th className="pb-1.5 pr-2 font-semibold">Đội</th>
                  <th className="pb-1.5 pr-2 font-semibold">Tiến độ</th>
                  <th className="pb-1.5 pr-2 font-semibold">Phân công</th>
                  <th className="pb-1.5 pr-2 font-semibold">SLA</th>
                  <th className="pb-1.5 font-semibold">Bởi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const dueMs = row.report.slaResolveDueAt
                    ? new Date(row.report.slaResolveDueAt).getTime()
                    : null;
                  const slaHours =
                    dueMs !== null && !Number.isNaN(dueMs)
                      ? (dueMs - now) / (60 * 60 * 1000)
                      : null;
                  const slaUrgent =
                    dueMs !== null && !Number.isNaN(dueMs) && dueMs - now < 24 * 60 * 60 * 1000;

                  return (
                    <tr
                      key={row.assignmentId}
                      className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                    >
                      <td className="py-1.5 pr-2">
                        <Link
                          href={`/company/assignments?reportId=${encodeURIComponent(row.report.reportId)}`}
                          className="group block min-w-0"
                        >
                          <span className="font-mono font-semibold text-emerald-800 group-hover:underline">
                            {row.report.code}
                          </span>
                          <span className="mt-0.5 block truncate text-muted-foreground">
                            {row.report.address}
                          </span>
                          <span
                            className={cn(
                              'mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                              queueSeverityClasses(row.report.severity)
                            )}
                          >
                            {queueSeverityLabel(row.report.severity)}
                          </span>
                        </Link>
                      </td>
                      <td className="py-1.5 pr-2">
                        <p className="max-w-[100px] truncate font-medium">{row.team.teamName}</p>
                        <p className="text-muted-foreground">{row.team.memberCount} TV</p>
                      </td>
                      <td className="py-1.5 pr-2">
                        <ProgressMini value={row.progressPercent} />
                      </td>
                      <td className="py-1.5 pr-2">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                            assignmentStatusClasses(row.assignmentStatus)
                          )}
                        >
                          {assignmentStatusLabel(row.assignmentStatus)}
                        </span>
                        <span
                          className={cn(
                            'mt-1 block w-fit rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1 ring-inset',
                            teamTaskAcceptanceClasses(row.assignmentStatus, row.startedAt)
                          )}
                        >
                          {teamTaskAcceptanceText(row.assignmentStatus, row.startedAt)}
                        </span>
                        <time
                          dateTime={row.assignedAt}
                          className="mt-0.5 block text-muted-foreground"
                        >
                          {formatCompanyDateTime(row.assignedAt)}
                        </time>
                      </td>
                      <td className="py-1.5 pr-2">
                        {row.report.slaResolveDueAt ? (
                          <span
                            className={cn(
                              'font-medium tabular-nums',
                              slaUrgent ? 'text-destructive' : 'text-foreground'
                            )}
                          >
                            {slaHours !== null ? formatSlaRemaining(slaHours) : '—'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="max-w-[90px] truncate py-1.5">{row.assignedByName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {count > rows.length ? (
        <p className="mt-1 shrink-0 text-[9px] text-muted-foreground">
          Hiển thị {rows.length}/{count} task ·{' '}
          <Link
            href="/company/assignments"
            className="font-medium text-emerald-800 hover:underline"
          >
            xem thêm
          </Link>
        </p>
      ) : count > 0 ? (
        <p className="mt-1 shrink-0 text-[9px] text-muted-foreground">{count} task phân công</p>
      ) : null}
    </article>
  );
}
