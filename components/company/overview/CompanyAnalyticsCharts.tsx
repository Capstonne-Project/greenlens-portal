'use client';

import {
  activityTypeLabel,
  formatHours,
  formatOverviewNumber,
  formatRatePercent,
  formatRelativeTimeVi,
  normalizeRatePercent,
} from '@/components/admin/overview/adminDashboardFormat';
import type {
  CompanyDashboardOverview,
  CompanyQueueAgingItem,
  CompanyRecentActivityItem,
  CompanyStaffPerformanceItem,
  CompanyTaskStatusItem,
  CompanyTeamPerformanceItem,
  CompanyUpcomingDeadlineItem,
  CompanyWorkloadTrendPoint,
} from '@/lib/api/services/fetchCompanyDashboard';
import { ASSIGNMENT_STATUS_LABEL } from '@/lib/constants/reportAssignment';
import { cn } from '@/lib/utils';
import { queueSeverityClasses, queueSeverityLabel, formatSlaRemaining } from '@/utils/companyUi';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';

const OVERVIEW_LIST_LIMIT = 5;

const STATUS_COLORS = ['#4f46e5', '#0ea5e9', '#f59e0b', '#059669', '#ef4444', '#94a3b8'];
const QUEUE_COLORS = ['#22c55e', '#facc15', '#f97316', '#dc2626'];

function CardShell({
  title,
  subtitle,
  className,
  fitContent = false,
  chart = false,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  fitContent?: boolean;
  /** Biểu đồ chính — padding và chiều cao tối thiểu lớn hơn. */
  chart?: boolean;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        'flex flex-col rounded-card border border-border bg-card shadow-sm',
        chart ? 'min-h-[220px] p-3 sm:p-4' : 'p-2 shadow-sm sm:p-2.5',
        fitContent ? 'h-auto shrink-0' : 'h-full min-h-0 overflow-hidden',
        className
      )}
    >
      <header className={cn('shrink-0', chart ? 'mb-3' : 'mb-1.5')}>
        <h2
          className={cn(
            'font-semibold text-foreground',
            chart ? 'text-sm' : 'text-[11px] sm:text-xs'
          )}
        >
          {title}
        </h2>
        {subtitle ? (
          <p className={cn('mt-0.5 text-muted-foreground', chart ? 'text-xs' : 'text-[9px]')}>
            {subtitle}
          </p>
        ) : null}
      </header>
      <div className={cn(fitContent ? 'shrink-0' : 'min-h-0 flex-1 overflow-hidden')}>
        {children}
      </div>
    </article>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="py-5 text-center text-xs text-muted-foreground">{text}</p>;
}

function taskStatusLabel(status: string): string {
  return ASSIGNMENT_STATUS_LABEL[status] ?? status;
}

function trendDispatched(point: CompanyWorkloadTrendPoint): number {
  if (Number.isFinite(point.dispatched)) return Math.max(0, point.dispatched);
  if (typeof point.assigned === 'number' && Number.isFinite(point.assigned)) {
    return Math.max(0, point.assigned);
  }
  return 0;
}

/** Biểu đồ cột — khối lượng nhiệm vụ từ /overview. */
export function CompanyTaskVolumeBarChart({
  overview,
  className,
}: {
  overview: CompanyDashboardOverview;
  className?: string;
}) {
  const bars = [
    { label: 'Đã giao', value: Math.max(0, overview.assignedTasks), color: '#4f46e5' },
    { label: 'Hoàn thành', value: Math.max(0, overview.completedTasks), color: '#059669' },
    { label: 'Đang chờ', value: Math.max(0, overview.pendingTasks), color: '#f59e0b' },
  ];
  const max = Math.max(1, ...bars.map(b => b.value));
  const slaPct = Math.min(100, Math.max(0, normalizeRatePercent(overview.slaComplianceRate)));

  return (
    <CardShell
      chart
      className={className}
      title="Khối lượng nhiệm vụ"
      subtitle={`SLA ${slaPct.toFixed(0)}% · TB ${formatHours(overview.averageResolutionHours, 1)} · ${formatOverviewNumber(overview.activeTeams)} đội / ${formatOverviewNumber(overview.activeStaff)} nhân sự`}
    >
      <div className="flex h-full min-h-[140px] items-end justify-center gap-6 px-2 pb-1 pt-2">
        {bars.map(bar => (
          <div
            key={bar.label}
            className="flex min-w-0 flex-1 max-w-[88px] flex-col items-center gap-2"
          >
            <span className="text-sm font-bold tabular-nums text-foreground">
              {formatOverviewNumber(bar.value)}
            </span>
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className="w-full max-w-14 rounded-t-md transition-all"
                style={{
                  height: `${Math.max(12, (bar.value / max) * 120)}px`,
                  backgroundColor: bar.color,
                }}
                title={`${bar.label}: ${bar.value}`}
              />
            </div>
            <span className="text-center text-xs text-muted-foreground">{bar.label}</span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

/** Line chart from /workload-trend */
export function CompanyWorkloadTrend({
  points,
  className,
}: {
  points: CompanyWorkloadTrendPoint[] | undefined;
  className?: string;
}) {
  const data = points ?? [];
  const W = 400;
  const H = 180;
  const PAD = { t: 12, r: 12, b: 28, l: 32 };
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const maxY = Math.max(1, ...data.map(p => Math.max(trendDispatched(p), p.completed)));

  const xAt = (i: number) =>
    data.length <= 1 ? PAD.l + iw / 2 : PAD.l + (i / (data.length - 1)) * iw;
  const yAt = (v: number) => PAD.t + ih - (v / maxY) * ih;

  const pathFor = (getter: (p: CompanyWorkloadTrendPoint) => number) =>
    data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(getter(p))}`).join(' ');

  return (
    <CardShell
      chart
      className={className}
      title="Xu hướng khối lượng"
      subtitle="Giao việc vs hoàn thành theo ngày"
    >
      {data.length === 0 ? (
        <EmptyHint text="Chưa có chuỗi thời gian" />
      ) : (
        <>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-full min-h-[150px] w-full"
            role="img"
            aria-label="Xu hướng"
          >
            {[0, 0.5, 1].map(t => {
              const y = yAt(t * maxY);
              return (
                <g key={t}>
                  <line
                    x1={PAD.l}
                    x2={W - PAD.r}
                    y1={y}
                    y2={y}
                    className="stroke-border"
                    strokeWidth={1}
                  />
                  <text
                    x={PAD.l - 4}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-muted-foreground text-[9px]"
                  >
                    {Math.round(t * maxY)}
                  </text>
                </g>
              );
            })}
            {data.length > 1 ? (
              <>
                <path d={pathFor(trendDispatched)} fill="none" stroke="#4f46e5" strokeWidth={2} />
                <path
                  d={pathFor(p => Math.max(0, p.completed))}
                  fill="none"
                  stroke="#059669"
                  strokeWidth={2}
                />
              </>
            ) : null}
            {data.map((p, i) => (
              <g key={p.date}>
                <circle cx={xAt(i)} cy={yAt(trendDispatched(p))} r={3} fill="#4f46e5">
                  <title>{`${p.date} giao: ${trendDispatched(p)}`}</title>
                </circle>
                <circle cx={xAt(i)} cy={yAt(p.completed)} r={3} fill="#059669">
                  <title>{`${p.date} hoàn thành: ${p.completed}`}</title>
                </circle>
                <text
                  x={xAt(i)}
                  y={H - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[8px]"
                >
                  {p.date.slice(5)}
                </text>
              </g>
            ))}
          </svg>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-indigo-600" aria-hidden /> Giao việc
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-600" aria-hidden /> Hoàn thành
            </span>
          </div>
        </>
      )}
    </CardShell>
  );
}

/** Donut from /task-status */
export function CompanyTaskStatusDonut({
  items,
  className,
}: {
  items: CompanyTaskStatusItem[] | undefined;
  className?: string;
}) {
  const slices = items ?? [];
  const total = slices.reduce((s, i) => s + Math.max(0, i.count), 0);
  const SIZE = 140;
  const STROKE = 18;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;
  const segments = slices.map((slice, index) => ({
    slice,
    index,
    length: total > 0 ? (slice.count / total) * C : 0,
    offset:
      total > 0
        ? (slices.slice(0, index).reduce((sum, item) => sum + item.count, 0) / total) * C
        : 0,
  }));

  return (
    <CardShell
      chart
      className={className}
      title="Theo trạng thái nhiệm vụ"
      subtitle={`Tổng ${formatOverviewNumber(total)} task`}
    >
      {total === 0 ? (
        <EmptyHint text="Chưa có phân bố trạng thái" />
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative size-28 shrink-0 sm:size-32">
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full">
              <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
                {segments.map(segment => (
                  <circle
                    key={segment.slice.status}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={R}
                    fill="none"
                    stroke={STATUS_COLORS[segment.index % STATUS_COLORS.length]}
                    strokeWidth={STROKE}
                    strokeDasharray={`${segment.length} ${C - segment.length}`}
                    strokeDashoffset={-segment.offset}
                  />
                ))}
              </g>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[10px] uppercase text-muted-foreground">Tổng</p>
              <p className="text-lg font-bold tabular-nums">{formatOverviewNumber(total)}</p>
            </div>
          </div>
          <ul className="min-w-0 flex-1 space-y-1.5 overflow-y-auto text-xs">
            {slices.map((slice, i) => {
              const pct =
                typeof slice.percentage === 'number'
                  ? slice.percentage
                  : total > 0
                    ? (slice.count / total) * 100
                    : 0;
              return (
                <li key={slice.status} className="flex items-center justify-between gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length] }}
                      aria-hidden
                    />
                    <span className="truncate">{taskStatusLabel(slice.status)}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatOverviewNumber(slice.count)} · {pct.toFixed(0)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </CardShell>
  );
}

/** Donut from /queue-aging */
export function CompanyQueueAgingDonut({ items }: { items: CompanyQueueAgingItem[] | undefined }) {
  const buckets = items ?? [];
  const total = buckets.reduce((s, b) => s + Math.max(0, b.count), 0);
  const SIZE = 100;
  const STROKE = 14;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;
  const segments = buckets.map((bucket, index) => ({
    bucket,
    index,
    length: total > 0 ? (bucket.count / total) * C : 0,
    offset:
      total > 0
        ? (buckets.slice(0, index).reduce((sum, item) => sum + item.count, 0) / total) * C
        : 0,
  }));
  const oldest = [...buckets].reverse().find(b => b.count > 0);

  return (
    <CardShell title="Tuổi hàng đợi" subtitle="Phân bố theo khoảng thời gian">
      {total === 0 ? (
        <EmptyHint text="Hàng đợi trống" />
      ) : (
        <div className="flex items-center gap-2">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
            <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
              {segments.map(segment =>
                segment.bucket.count > 0 ? (
                  <circle
                    key={segment.bucket.range}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={R}
                    fill="none"
                    stroke={QUEUE_COLORS[segment.index % QUEUE_COLORS.length]}
                    strokeWidth={STROKE}
                    strokeDasharray={`${segment.length} ${C - segment.length}`}
                    strokeDashoffset={-segment.offset}
                  />
                ) : null
              )}
            </g>
          </svg>
          <ul className="min-w-0 flex-1 space-y-1 text-[10px]">
            {buckets.map((b, i) => (
              <li key={b.range} className="flex justify-between gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: QUEUE_COLORS[i % QUEUE_COLORS.length] }}
                    aria-hidden
                  />
                  {b.range}
                </span>
                <span className="tabular-nums font-medium">{b.count}</span>
              </li>
            ))}
            {oldest ? (
              <li className="pt-1 text-[10px] text-muted-foreground">
                Lâu nhất: <span className="font-semibold text-foreground">{oldest.range}</span>
              </li>
            ) : null}
          </ul>
        </div>
      )}
    </CardShell>
  );
}

/** Table from /team-performance */
export function CompanyTeamPerformanceTable({
  items,
}: {
  items: CompanyTeamPerformanceItem[] | undefined;
}) {
  const rows = [...(items ?? [])].sort((a, b) => b.completedTasks - a.completedTasks).slice(0, 6);

  return (
    <CardShell title="Hiệu suất đội" subtitle="Assigned / completed / đúng hạn">
      {rows.length === 0 ? (
        <EmptyHint text="Chưa có dữ liệu đội" />
      ) : (
        <div className="h-full overflow-auto">
          <table className="w-full min-w-[280px] text-left text-[10px]">
            <thead className="sticky top-0 bg-card text-muted-foreground">
              <tr className="border-b border-border">
                <th className="pb-1.5 font-semibold">Đội</th>
                <th className="pb-1.5 text-right font-semibold">Giao</th>
                <th className="pb-1.5 text-right font-semibold">Xong</th>
                <th className="pb-1.5 text-right font-semibold">Đúng hạn</th>
                <th className="pb-1.5 text-right font-semibold">TB giờ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.teamId} className="border-b border-border/60 last:border-0">
                  <td className="max-w-[120px] truncate py-1.5 font-medium text-foreground">
                    {row.teamName || '—'}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{row.assignedTasks}</td>
                  <td className="py-1.5 text-right tabular-nums">{row.completedTasks}</td>
                  <td className="py-1.5 text-right tabular-nums">
                    {formatRatePercent(row.onTimeRate, 0)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {Number.isFinite(row.averageHours) ? row.averageHours.toFixed(1) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardShell>
  );
}

/** Table from /staff-performance */
export function CompanyStaffPerformanceTable({
  items,
}: {
  items: CompanyStaffPerformanceItem[] | undefined;
}) {
  const rows = [...(items ?? [])].sort((a, b) => b.completedTasks - a.completedTasks).slice(0, 6);

  return (
    <CardShell title="Hiệu suất nhân sự" subtitle="Completed / đúng hạn / TB giờ">
      {rows.length === 0 ? (
        <EmptyHint text="Chưa có dữ liệu nhân sự" />
      ) : (
        <div className="h-full overflow-auto">
          <table className="w-full min-w-[240px] text-left text-[10px]">
            <thead className="sticky top-0 bg-card text-muted-foreground">
              <tr className="border-b border-border">
                <th className="pb-1.5 font-semibold">Nhân sự</th>
                <th className="pb-1.5 text-right font-semibold">Xong</th>
                <th className="pb-1.5 text-right font-semibold">Đúng hạn</th>
                <th className="pb-1.5 text-right font-semibold">TB giờ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.staffId} className="border-b border-border/60 last:border-0">
                  <td className="max-w-[120px] truncate py-1.5 font-medium text-foreground">
                    {row.staffName || '—'}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{row.completedTasks}</td>
                  <td className="py-1.5 text-right tabular-nums">
                    {formatRatePercent(row.onTimeRate, 0)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {Number.isFinite(row.averageHours) ? row.averageHours.toFixed(1) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardShell>
  );
}

/** List/table from /upcoming-deadlines */
export function CompanyUpcomingDeadlines({
  items,
  className,
}: {
  items: CompanyUpcomingDeadlineItem[] | undefined;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const allRows = items ?? [];
  const rows = allRows.slice(0, OVERVIEW_LIST_LIMIT);
  const urgentCount = allRows.filter(row => (row.remainingHours ?? 0) < 24).length;

  return (
    <CardShell
      title="Sắp đến hạn SLA"
      subtitle="Ưu tiên xử lý — task gần hoặc quá deadline"
      className={cn('p-3 sm:p-4', className)}
    >
      {allRows.length > 0 ? (
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground">
            {allRows.length} task
            {urgentCount > 0 ? ` · ${urgentCount} gấp (<24h)` : ''}
          </p>
          <Link
            href="/company/tracking"
            className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-emerald-800 hover:underline"
          >
            Xem tất cả
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyHint text="Không có deadline sắp tới" />
      ) : (
        <ul className="space-y-1.5">
          {rows.map((row, idx) => {
            const detailHref = row.reportId
              ? `/company/tracking?reportId=${encodeURIComponent(row.reportId)}`
              : null;
            const remainingHours =
              typeof row.remainingHours === 'number' && Number.isFinite(row.remainingHours)
                ? row.remainingHours
                : (new Date(row.deadline).getTime() - now) / (60 * 60 * 1000);
            const slaUrgent = Number.isFinite(remainingHours) && remainingHours < 24;
            const slaLabel = Number.isFinite(remainingHours)
              ? formatSlaRemaining(remainingHours)
              : row.deadline
                ? `Hạn ${new Date(row.deadline).toLocaleString('vi-VN')}`
                : 'Chưa có hạn SLA';

            const content = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate font-mono text-[11px] font-semibold text-emerald-800">
                    {row.reportCode || row.taskId}
                  </span>
                  {row.priority ? (
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                        queueSeverityClasses(row.priority)
                      )}
                    >
                      {queueSeverityLabel(row.priority)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-muted-foreground">{row.location || '—'}</p>
                <p
                  className={cn(
                    'mt-1 font-medium tabular-nums',
                    slaUrgent ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {slaLabel}
                </p>
              </>
            );

            return (
              <li
                key={`${row.taskId}-${idx}`}
                className={cn(
                  'rounded-xl border border-border/70 bg-muted/20 px-2.5 py-2 text-[10px]',
                  detailHref && 'transition hover:border-emerald-200 hover:bg-emerald-50/40'
                )}
              >
                {detailHref ? (
                  <Link href={detailHref} className="block">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}

      {allRows.length > rows.length ? (
        <p className="mt-2 text-[10px] text-muted-foreground">
          +{allRows.length - rows.length} deadline khác ·{' '}
          <Link href="/company/tracking" className="font-medium text-emerald-800 hover:underline">
            mở Phân công
          </Link>
        </p>
      ) : null}
    </CardShell>
  );
}

/** Feed from /recent-activities */
export function CompanyRecentActivities({
  items,
}: {
  items: CompanyRecentActivityItem[] | undefined;
}) {
  const allItems = items ?? [];
  const list = allItems.slice(0, OVERVIEW_LIST_LIMIT);

  return (
    <CardShell fitContent title="Hoạt động gần đây" subtitle="Vòng đời nhiệm vụ công ty">
      {allItems.length > 0 ? (
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground">{allItems.length} sự kiện gần đây</p>
          <Link
            href="/company/tracking"
            className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-emerald-800 hover:underline"
          >
            Xem tất cả
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </div>
      ) : null}

      {list.length === 0 ? (
        <EmptyHint text="Chưa có sự kiện" />
      ) : (
        <ul className="space-y-1.5">
          {list.map((item, index) => (
            <li
              key={`${item.time}-${item.type}-${index}`}
              className="rounded-xl border border-border/70 bg-muted/20 px-2.5 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-foreground">
                  {activityTypeLabel(item.type)}
                </span>
                <time className="shrink-0 text-[9px] text-muted-foreground" dateTime={item.time}>
                  {formatRelativeTimeVi(item.time)}
                </time>
              </div>
              <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      )}

      {allItems.length > list.length ? (
        <p className="mt-2 text-[10px] text-muted-foreground">
          +{allItems.length - list.length} sự kiện khác ·{' '}
          <Link href="/company/tracking" className="font-medium text-emerald-800 hover:underline">
            mở Phân công
          </Link>
        </p>
      ) : null}
    </CardShell>
  );
}
