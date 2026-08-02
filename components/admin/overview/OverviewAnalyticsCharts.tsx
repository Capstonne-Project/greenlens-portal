import {
  activityTypeLabel,
  formatOverviewNumber,
  formatRelativeTimeVi,
} from '@/components/admin/overview/adminDashboardFormat';
import type {
  AdminCompanyPerformanceItem,
  AdminOfficerPerformanceItem,
  AdminPollutionAnalyticsItem,
  AdminQueueAgingItem,
  AdminRecentActivityItem,
  AdminReportFunnelStage,
  AdminReportStatusItem,
  AdminResolutionDistributionItem,
} from '@/lib/api/services/fetchAdminDashboard';
import { reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

const FUNNEL_COLORS = ['#4f46e5', '#0ea5e9', '#0d9488', '#059669', '#64748b'];
const STATUS_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#84cc16',
  '#f59e0b',
  '#ef4444',
  '#94a3b8',
];
const QUEUE_COLORS = ['#22c55e', '#facc15', '#f97316', '#dc2626'];
const POLLUTION_COLORS = ['#059669', '#0ea5e9', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6'];

function CardShell({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        'flex h-full min-h-0 flex-col rounded-card border border-border bg-card p-3 shadow-sm',
        className
      )}
    >
      <header className="mb-2 shrink-0">
        <h2 className="text-xs font-semibold text-foreground sm:text-sm">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[10px] text-muted-foreground">{subtitle}</p> : null}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </article>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="py-6 text-center text-xs text-muted-foreground">{text}</p>;
}

/** Compact inverted-triangle funnel from /report-funnel */
export function OverviewLifecycleFunnel({
  stages,
}: {
  stages: AdminReportFunnelStage[] | undefined;
}) {
  const list = stages ?? [];
  const top = Math.max(1, list[0]?.count ?? 0);

  return (
    <CardShell title="Phễu vòng đời" subtitle="Submitted → Closed">
      {list.length === 0 ? (
        <EmptyHint text="Chưa có dữ liệu phễu" />
      ) : (
        <div className="space-y-0.5">
          {list.map((stage, index) => {
            const ratio = stage.count / top;
            const width = Math.max(28, Math.min(100, ratio * 100));
            const next = list[index + 1];
            const nextWidth = next ? Math.max(28, Math.min(100, (next.count / top) * 100)) : width;
            const inset = Math.max(0, (width - nextWidth) / 2 / width) * 100;
            const pct = Math.round((stage.count / top) * 1000) / 10;
            return (
              <div key={stage.stage} className="flex justify-center">
                <div
                  className="flex h-7 w-full max-w-full items-center justify-between gap-1 px-2 text-[10px] text-white sm:h-8 sm:text-[11px]"
                  style={{
                    width: `${width}%`,
                    backgroundColor: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
                    clipPath: `polygon(0% 0%, 100% 0%, ${100 - inset}% 100%, ${inset}% 100%)`,
                  }}
                  title={`${stage.stage}: ${stage.count}`}
                >
                  <span className="truncate font-semibold">{reportStatusLabelVi(stage.stage)}</span>
                  <span className="shrink-0 tabular-nums opacity-90">
                    {formatOverviewNumber(stage.count)} · {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}

/** Vertical column chart from /pollution-analytics — one column per pollution category. */
export function OverviewPollutionAnalytics({
  items,
}: {
  items: AdminPollutionAnalyticsItem[] | undefined;
}) {
  const data = [...(items ?? [])].sort((a, b) => b.count - a.count);
  const maxCount = Math.max(1, ...data.map(item => Math.max(0, item.count)));
  const total = data.reduce((sum, item) => sum + Math.max(0, item.count), 0);
  const gridSteps = [1, 0.5, 0];

  return (
    <CardShell
      title="Báo cáo theo loại ô nhiễm"
      subtitle={`Tổng ${formatOverviewNumber(total)} báo cáo`}
    >
      {data.length === 0 ? (
        <EmptyHint text="Chưa có dữ liệu loại ô nhiễm" />
      ) : (
        <div className="flex h-[140px] gap-2 overflow-x-auto sm:h-[150px] sm:overflow-x-visible">
          <div className="flex w-6 shrink-0 flex-col justify-between py-0.5 text-[9px] tabular-nums text-muted-foreground">
            {gridSteps.map(step => (
              <span key={step} className="text-right">
                {Math.round(step * maxCount)}
              </span>
            ))}
          </div>

          <div className="relative min-w-0 flex-1">
            <div className="absolute inset-0 flex flex-col justify-between" aria-hidden>
              {gridSteps.map(step => (
                <span key={step} className="border-t border-border" />
              ))}
            </div>

            <ul
              className="relative flex h-full items-end justify-around gap-1.5"
              aria-label="Số báo cáo theo loại ô nhiễm"
            >
              {data.map((item, index) => {
                const height = Math.max(3, (Math.max(0, item.count) / maxCount) * 100);
                return (
                  <li
                    key={`${item.category}-${index}`}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                    title={`${item.category}: ${formatOverviewNumber(item.count)} báo cáo`}
                  >
                    <span className="text-[9px] font-semibold tabular-nums text-foreground">
                      {formatOverviewNumber(item.count)}
                    </span>
                    <span
                      className="w-full max-w-9 rounded-t"
                      style={{
                        height: `${height}%`,
                        backgroundColor: POLLUTION_COLORS[index % POLLUTION_COLORS.length],
                      }}
                    />
                    <span className="w-full truncate text-center text-[9px] text-muted-foreground">
                      {item.category}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </CardShell>
  );
}

/** Donut from /report-status */
export function OverviewStatusDonut({ items }: { items: AdminReportStatusItem[] | undefined }) {
  const slices = items ?? [];
  const total = slices.reduce((s, i) => s + Math.max(0, i.count), 0);
  const SIZE = 112;
  const STROKE = 16;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;
  const segments = slices.map((slice, index) => ({
    slice,
    index,
    length: (slice.count / total) * C,
    offset: (slices.slice(0, index).reduce((sum, item) => sum + item.count, 0) / total) * C,
  }));

  return (
    <CardShell title="Theo trạng thái" subtitle={`Tổng ${formatOverviewNumber(total)}`}>
      {total === 0 ? (
        <EmptyHint text="Chưa có phân bố trạng thái" />
      ) : (
        <div className="flex items-center gap-3">
          <div className="relative size-28 shrink-0">
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
              <p className="text-[9px] uppercase text-muted-foreground">Tổng</p>
              <p className="text-sm font-bold tabular-nums">{formatOverviewNumber(total)}</p>
            </div>
          </div>
          <ul className="min-w-0 flex-1 space-y-1 overflow-y-auto text-[10px]">
            {slices.map((slice, i) => (
              <li key={slice.status} className="flex items-center justify-between gap-2">
                <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length] }}
                    aria-hidden
                  />
                  <span className="truncate">{reportStatusLabelVi(slice.status)}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {slice.percentage.toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </CardShell>
  );
}

/** Queue aging donut from /queue-aging */
export function OverviewQueueAging({ items }: { items: AdminQueueAgingItem[] | undefined }) {
  const buckets = items ?? [];
  const total = buckets.reduce((s, b) => s + Math.max(0, b.count), 0);
  const SIZE = 100;
  const STROKE = 14;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;
  const segments = buckets.map((bucket, index) => ({
    bucket,
    index,
    length: (bucket.count / total) * C,
    offset: (buckets.slice(0, index).reduce((sum, item) => sum + item.count, 0) / total) * C,
  }));
  const oldest = [...buckets].reverse().find(b => b.count > 0);

  return (
    <CardShell title="Tuổi hàng đợi" subtitle="Pending theo khoảng thời gian">
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

/** Vertical bars from /resolution-distribution */
export function OverviewResolutionBars({
  items,
}: {
  items: AdminResolutionDistributionItem[] | undefined;
}) {
  const bars = items ?? [];
  const max = Math.max(1, ...bars.map(b => b.count));

  return (
    <CardShell title="Thời gian giải quyết" subtitle="Histogram">
      {bars.length === 0 ? (
        <EmptyHint text="Chưa có dữ liệu" />
      ) : (
        <div className="flex h-[140px] items-end gap-1.5 px-1">
          {bars.map(bar => {
            const h = Math.max(4, (bar.count / max) * 100);
            return (
              <div key={bar.range} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span className="text-[9px] tabular-nums text-muted-foreground">{bar.count}</span>
                <div
                  className="w-full max-w-8 rounded-t bg-teal-600/80"
                  style={{ height: `${h}%` }}
                  title={`${bar.range}: ${bar.count}`}
                />
                <span className="truncate text-[9px] text-muted-foreground">{bar.range}</span>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}

/** Compact activity feed from /recent-activities */
export function OverviewRecentActivities({
  items,
}: {
  items: AdminRecentActivityItem[] | undefined;
}) {
  const list = (items ?? []).slice(0, 8);

  return (
    <CardShell title="Hoạt động gần đây" subtitle="Vòng đời báo cáo">
      {list.length === 0 ? (
        <EmptyHint text="Chưa có sự kiện" />
      ) : (
        <ul className="max-h-[200px] space-y-2 overflow-y-auto pr-1">
          {list.map((item, index) => (
            <li
              key={`${item.time}-${item.type}-${index}`}
              className="border-b border-border/60 pb-2 last:border-0 last:pb-0"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-foreground">
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
    </CardShell>
  );
}

/** Compact comparison consuming company-performance and officer-performance APIs. */
export function OverviewPerformanceBars({
  companies,
  officers,
}: {
  companies: AdminCompanyPerformanceItem[] | undefined;
  officers: AdminOfficerPerformanceItem[] | undefined;
}) {
  const topCompanies = [...(companies ?? [])]
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, 3);
  const topOfficers = [...(officers ?? [])].sort((a, b) => b.score - a.score).slice(0, 3);

  const renderRows = (rows: { id: string; name: string; score: number }[], colorClass: string) =>
    rows.length === 0 ? (
      <p className="py-2 text-[10px] text-muted-foreground">Chưa có dữ liệu</p>
    ) : (
      <ul className="space-y-1.5">
        {rows.map(row => {
          const score = Math.min(100, Math.max(0, row.score));
          return (
            <li key={row.id}>
              <div className="mb-0.5 flex items-center justify-between gap-2 text-[10px]">
                <span className="truncate text-foreground" title={row.name}>
                  {row.name || '—'}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{score.toFixed(0)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full', colorClass)}
                  style={{ width: `${score}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    );

  return (
    <CardShell title="Hiệu suất xử lý" subtitle="Top doanh nghiệp và cán bộ theo điểm">
      <div className="grid gap-3 sm:grid-cols-2">
        <section>
          <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Doanh nghiệp
          </h3>
          {renderRows(
            topCompanies.map(item => ({
              id: item.companyId,
              name: item.companyName,
              score: item.performanceScore,
            })),
            'bg-indigo-600'
          )}
        </section>
        <section>
          <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Cán bộ
          </h3>
          {renderRows(
            topOfficers.map(item => ({
              id: item.officerId,
              name: item.officerName,
              score: item.score,
            })),
            'bg-emerald-600'
          )}
        </section>
      </div>
    </CardShell>
  );
}
