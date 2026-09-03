import {
  activityTypeLabel,
  formatOverviewNumber,
  formatRelativeTimeVi,
  localizeDashboardText,
} from '@/components/admin/overview/adminDashboardFormat';
import { ADMIN_META_TEXT } from '@/components/admin/shared/adminUiTokens';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  AdminCompanyPerformanceItem,
  AdminOfficerPerformanceItem,
  AdminPollutionAnalyticsItem,
  AdminQueueAgingItem,
  AdminRecentActivityItem,
  AdminReportFunnelStage,
  AdminReportStatusItem,
  AdminReportTrendPoint,
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
    <Card
      className={cn('flex h-full min-h-0 flex-col overflow-hidden rounded-card p-0', className)}
    >
      <CardHeader className="mb-0 shrink-0 space-y-0.5 p-3 pb-0">
        <CardTitle className="text-xs font-semibold sm:text-sm">{title}</CardTitle>
        {subtitle ? (
          <CardDescription className={cn(ADMIN_META_TEXT, 'text-xs')}>{subtitle}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-3 pt-2">{children}</CardContent>
    </Card>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="py-6 text-center text-xs text-muted-foreground">{text}</p>;
}

type FunnelVisualSegment = {
  stage: AdminReportFunnelStage;
  points: string;
  color: string;
  label: string;
  pct: number;
};

/** Phễu thon đều theo tầng — hình liền; số liệu ở legend HTML bên cạnh. */
function buildFunnelVisualSegments(
  list: AdminReportFunnelStage[],
  top: number
): FunnelVisualSegment[] {
  const n = list.length;
  const stageHeight = 100 / n;
  const maxW = 92;
  const minW = 28;
  const cx = 50;

  return list.map((stage, index) => {
    const t0 = index / n;
    const t1 = (index + 1) / n;
    const topW = maxW - (maxW - minW) * t0;
    const bottomW = maxW - (maxW - minW) * t1;
    const y0 = index * stageHeight + 0.4;
    const y1 = (index + 1) * stageHeight - 0.4;
    const pct = Math.round((stage.count / top) * 1000) / 10;

    const points = [
      `${cx - topW / 2},${y0}`,
      `${cx + topW / 2},${y0}`,
      `${cx + bottomW / 2},${y1}`,
      `${cx - bottomW / 2},${y1}`,
    ].join(' ');

    return {
      stage,
      points,
      color: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
      label: reportStatusLabelVi(stage.stage),
      pct,
    };
  });
}

/** Phễu vòng đời — SVG gọn + legend HTML (tránh cắt chữ trong cột hẹp). */
export function OverviewLifecycleFunnel({
  stages,
}: {
  stages: AdminReportFunnelStage[] | undefined;
}) {
  const list = stages ?? [];
  const top = Math.max(1, list[0]?.count ?? 0);
  const segments = buildFunnelVisualSegments(list, top);

  return (
    <CardShell title="Phễu vòng đời" subtitle="Đã gửi → Đã đóng">
      {list.length === 0 ? (
        <EmptyHint text="Chưa có dữ liệu phễu" />
      ) : (
        <div className="flex min-h-0 flex-1 items-stretch gap-2.5 sm:gap-3">
          <div className="flex w-[44%] min-w-[88px] max-w-[118px] shrink-0 items-center justify-center self-stretch py-0.5">
            <svg
              viewBox="0 0 100 100"
              className="aspect-[5/8] h-full w-full max-h-[196px] min-h-[140px]"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-hidden
            >
              <defs>
                {segments.map((seg, index) => (
                  <linearGradient
                    key={`grad-${seg.stage.stage}`}
                    id={`admin-funnel-grad-${index}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={seg.color} />
                    <stop offset="100%" stopColor={seg.color} stopOpacity={0.88} />
                  </linearGradient>
                ))}
              </defs>
              {segments.map((seg, index) => (
                <polygon
                  key={seg.stage.stage}
                  points={seg.points}
                  fill={`url(#admin-funnel-grad-${index})`}
                  stroke="#fff"
                  strokeOpacity={0.35}
                  strokeWidth="0.6"
                  strokeLinejoin="round"
                />
              ))}
            </svg>
          </div>

          <ul
            className="min-w-0 flex-1 space-y-1.5 overflow-y-auto py-0.5"
            aria-label="Phễu vòng đời báo cáo theo trạng thái"
          >
            {segments.map(seg => (
              <li key={seg.stage.stage}>
                <div className="mb-0.5 flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <span
                      className="size-2 shrink-0 rounded-sm"
                      style={{ backgroundColor: seg.color }}
                      aria-hidden
                    />
                    <span className="truncate font-medium text-foreground" title={seg.label}>
                      {seg.label}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatOverviewNumber(seg.stage.count)} · {seg.pct}%
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
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
          <div className="flex w-6 shrink-0 flex-col justify-between py-0.5 text-xs tabular-nums text-muted-foreground">
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
                    <span className="text-xs font-semibold tabular-nums text-foreground">
                      {formatOverviewNumber(item.count)}
                    </span>
                    <span
                      className="w-full max-w-9 rounded-t"
                      style={{
                        height: `${height}%`,
                        backgroundColor: POLLUTION_COLORS[index % POLLUTION_COLORS.length],
                      }}
                    />
                    <span className="w-full truncate text-center text-xs text-muted-foreground">
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

/** Donut from GET /v1/dashboard/admin/report-status */
export function OverviewStatusDonut({
  items,
  className,
}: {
  items: AdminReportStatusItem[] | undefined;
  className?: string;
}) {
  const slices = [...(items ?? [])].sort((a, b) => b.count - a.count);
  const total = slices.reduce((s, i) => s + Math.max(0, i.count), 0);
  const SIZE = 128;
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
      title="Phân bố trạng thái"
      subtitle={`Tổng ${formatOverviewNumber(total)} báo cáo`}
      className={className}
    >
      {total === 0 ? (
        <EmptyHint text="Chưa có phân bố trạng thái" />
      ) : (
        <div className="flex min-h-0 flex-1 items-center gap-4">
          <div className="relative size-32 shrink-0">
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full">
              <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
                {segments.map(segment =>
                  segment.length > 0 ? (
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
                  ) : null
                )}
              </g>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xs uppercase text-muted-foreground">Tổng</p>
              <p className="text-base font-bold tabular-nums">{formatOverviewNumber(total)}</p>
            </div>
          </div>
          <ul className="min-w-0 flex-1 space-y-1.5 overflow-y-auto text-xs">
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
                  {formatOverviewNumber(slice.count)} · {slice.percentage.toFixed(0)}%
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
    <CardShell title="Tuổi hàng đợi" subtitle="Chờ xử lý theo khoảng thời gian">
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
          <ul className="min-w-0 flex-1 space-y-1 text-xs">
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
              <li className={cn('pt-1', ADMIN_META_TEXT)}>
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
  const total = bars.reduce((sum, bar) => sum + Math.max(0, bar.count), 0);
  const max = Math.max(1, ...bars.map(b => b.count));
  const chartHeightPx = 96;

  return (
    <CardShell
      title="Thời gian giải quyết"
      subtitle={
        total > 0
          ? `${formatOverviewNumber(total)} báo cáo · phân bố thời gian xử lý`
          : 'Phân bố theo khoảng thời gian'
      }
    >
      {bars.length === 0 ? (
        <EmptyHint text="Chưa có dữ liệu" />
      ) : total === 0 ? (
        <EmptyHint text="Chưa có báo cáo giải quyết trong khoảng thời gian này" />
      ) : (
        <div className="flex h-[132px] items-end gap-1.5 px-1 pb-0.5">
          {bars.map(bar => {
            const barHeight =
              bar.count > 0 ? Math.max(8, Math.round((bar.count / max) * chartHeightPx)) : 0;
            return (
              <div
                key={bar.range}
                className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
              >
                <span className="text-xs font-semibold tabular-nums text-foreground">
                  {formatOverviewNumber(bar.count)}
                </span>
                <div
                  className="w-full max-w-9 rounded-t bg-emerald-700/85 transition-[height] duration-300"
                  style={{ height: barHeight }}
                  title={`${bar.range}: ${bar.count} báo cáo`}
                  role="img"
                  aria-label={`${bar.range}: ${bar.count}`}
                />
                <span className="w-full truncate text-center text-xs text-muted-foreground">
                  {bar.range}
                </span>
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
  className,
}: {
  items: AdminRecentActivityItem[] | undefined;
  className?: string;
}) {
  const list = (items ?? []).slice(0, 8);

  return (
    <CardShell title="Hoạt động gần đây" subtitle="Vòng đời báo cáo" className={className}>
      {list.length === 0 ? (
        <EmptyHint text="Chưa có sự kiện" />
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {list.map((item, index) => (
            <li
              key={`${item.time}-${item.type}-${index}`}
              className="border-b border-border/60 pb-2 last:border-0 last:pb-0"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-foreground">
                  {activityTypeLabel(item.type)}
                </span>
                <time className={cn('shrink-0', ADMIN_META_TEXT)} dateTime={item.time}>
                  {formatRelativeTimeVi(item.time)}
                </time>
              </div>
              <p className={cn('mt-1 line-clamp-2 leading-snug', ADMIN_META_TEXT)}>
                {localizeDashboardText(item.description)}
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
      <p className={cn('py-2', ADMIN_META_TEXT)}>Chưa có dữ liệu</p>
    ) : (
      <ul className="space-y-1.5">
        {rows.map(row => {
          const score = Math.min(100, Math.max(0, row.score));
          return (
            <li key={row.id}>
              <div className="mb-0.5 flex items-center justify-between gap-2 text-xs">
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
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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

const TREND_CREATED_COLOR = '#6366f1';
const TREND_RESOLVED_COLOR = '#10b981';
/** Min SVG width; each day gets ~48px so MM-DD labels don't overlap. */
const TREND_MIN_CHART_WIDTH = 360;
const TREND_POINT_WIDTH = 48;

function trendChartWidth(pointCount: number): number {
  if (pointCount <= 1) return TREND_MIN_CHART_WIDTH;
  return Math.max(TREND_MIN_CHART_WIDTH, pointCount * TREND_POINT_WIDTH);
}

/** Thin x-axis labels when many points share a narrow viewport. */
function pickTrendLabelIndices(pointCount: number, chartWidth: number): Set<number> {
  const minLabelPx = 44;
  const maxLabels = Math.max(2, Math.floor((chartWidth - 40) / minLabelPx));
  if (pointCount <= maxLabels) {
    return new Set(Array.from({ length: pointCount }, (_, i) => i));
  }
  const indices = new Set<number>([0, pointCount - 1]);
  const innerSlots = maxLabels - 2;
  if (innerSlots > 0) {
    const step = (pointCount - 1) / (innerSlots + 1);
    for (let i = 1; i <= innerSlots; i++) {
      indices.add(Math.round(i * step));
    }
  }
  return indices;
}

type TrendRow = {
  date: string;
  label: string;
  created: number;
  resolved: number;
};

function buildTrendRows(points: AdminReportTrendPoint[] | undefined): TrendRow[] {
  return [...(points ?? [])]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(point => ({
      date: point.date,
      label: point.date?.slice(5) ?? '',
      created: Math.max(0, point.created ?? point.submitted ?? 0),
      resolved: Math.max(0, point.resolved ?? 0),
    }));
}

function seriesPath(
  rows: TrendRow[],
  key: 'created' | 'resolved',
  xAt: (index: number) => number,
  yAt: (value: number) => number
): string {
  if (rows.length === 0) return '';
  return rows
    .map((row, index) => `${index === 0 ? 'M' : 'L'} ${xAt(index)} ${yAt(row[key])}`)
    .join(' ');
}

function seriesAreaPath(
  rows: TrendRow[],
  key: 'created' | 'resolved',
  xAt: (index: number) => number,
  yAt: (value: number) => number,
  baselineY: number
): string {
  if (rows.length === 0) return '';
  const line = seriesPath(rows, key, xAt, yAt);
  const lastX = xAt(rows.length - 1);
  const firstX = xAt(0);
  return `${line} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
}

/** Line chart from GET /v1/dashboard/admin/report-trend (created vs resolved). */
export function OverviewReportTrend({
  points,
  className,
}: {
  points: AdminReportTrendPoint[] | undefined;
  className?: string;
}) {
  const rows = buildTrendRows(points);
  const totalCreated = rows.reduce((sum, row) => sum + row.created, 0);
  const totalResolved = rows.reduce((sum, row) => sum + row.resolved, 0);
  const total = totalCreated + totalResolved;

  const chartWidth = trendChartWidth(rows.length);
  const height = 136;
  const pad = { top: 8, right: 10, bottom: 28, left: 30 };
  const chartW = chartWidth - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const maxValue = Math.max(1, ...rows.flatMap(row => [row.created, row.resolved]));
  const baselineY = pad.top + chartH;
  const labelIndices = pickTrendLabelIndices(rows.length, chartWidth);

  const xAt = (index: number) => {
    if (rows.length <= 1) return pad.left + chartW / 2;
    return pad.left + (index / (rows.length - 1)) * chartW;
  };
  const yAt = (value: number) => pad.top + chartH - (value / maxValue) * chartH;

  return (
    <CardShell
      title="Xu hướng báo cáo"
      subtitle={
        total > 0
          ? `Tạo mới ${formatOverviewNumber(totalCreated)} · Giải quyết ${formatOverviewNumber(totalResolved)}`
          : 'Theo ngày · chưa có báo cáo'
      }
      className={className}
    >
      {rows.length === 0 || total === 0 ? (
        <EmptyHint text="Chưa có dữ liệu xu hướng trong khoảng thời gian này" />
      ) : (
        <div className="flex flex-col gap-1 overflow-hidden">
          <div className={cn('flex shrink-0 items-center justify-end gap-3', ADMIN_META_TEXT)}>
            <span className="inline-flex items-center gap-1">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: TREND_CREATED_COLOR }}
              />
              Tạo mới
            </span>
            <span className="inline-flex items-center gap-1">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: TREND_RESOLVED_COLOR }}
              />
              Đã giải quyết
            </span>
          </div>

          <div className="shrink-0 overflow-x-auto" style={{ height }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${height}`}
              width={chartWidth}
              height={height}
              className="block max-w-none"
              role="img"
              aria-label="Biểu đồ đường xu hướng báo cáo"
            >
              <defs>
                <clipPath id="admin-report-trend-plot">
                  <rect x={pad.left} y={pad.top} width={chartW} height={chartH} />
                </clipPath>
              </defs>

              {[0, 0.5, 1].map(step => {
                const y = pad.top + chartH * (1 - step);
                const tickValue = Math.round(step * maxValue);
                return (
                  <g key={step}>
                    <line
                      x1={pad.left}
                      y1={y}
                      x2={chartWidth - pad.right}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity={0.1}
                      strokeDasharray={step === 0 ? undefined : '4 4'}
                    />
                    <text
                      x={pad.left - 6}
                      y={y + 3}
                      textAnchor="end"
                      fill="currentColor"
                      className="text-[10px] tabular-nums opacity-60"
                    >
                      {tickValue}
                    </text>
                  </g>
                );
              })}

              <g clipPath="url(#admin-report-trend-plot)">
                <path
                  d={seriesAreaPath(rows, 'created', xAt, yAt, baselineY)}
                  fill={TREND_CREATED_COLOR}
                  fillOpacity={0.12}
                />
                <path
                  d={seriesAreaPath(rows, 'resolved', xAt, yAt, baselineY)}
                  fill={TREND_RESOLVED_COLOR}
                  fillOpacity={0.1}
                />

                {rows.length > 1 ? (
                  <>
                    <path
                      d={seriesPath(rows, 'created', xAt, yAt)}
                      fill="none"
                      stroke={TREND_CREATED_COLOR}
                      strokeWidth={2.25}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={seriesPath(rows, 'resolved', xAt, yAt)}
                      fill="none"
                      stroke={TREND_RESOLVED_COLOR}
                      strokeWidth={2.25}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                ) : null}
              </g>

              {rows.map((row, index) => (
                <g key={row.date}>
                  <circle
                    cx={xAt(index)}
                    cy={yAt(row.created)}
                    r={4}
                    fill={TREND_CREATED_COLOR}
                    stroke="#fff"
                    strokeWidth={1.5}
                  >
                    <title>{`${row.label}: ${formatOverviewNumber(row.created)} tạo mới`}</title>
                  </circle>
                  <circle
                    cx={xAt(index)}
                    cy={yAt(row.resolved)}
                    r={4}
                    fill={TREND_RESOLVED_COLOR}
                    stroke="#fff"
                    strokeWidth={1.5}
                  >
                    <title>{`${row.label}: ${formatOverviewNumber(row.resolved)} giải quyết`}</title>
                  </circle>
                  {labelIndices.has(index) ? (
                    <text
                      x={xAt(index)}
                      y={height - 8}
                      textAnchor="middle"
                      fill="currentColor"
                      className="text-[10px] tabular-nums opacity-60"
                    >
                      {row.label}
                    </text>
                  ) : null}
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}
    </CardShell>
  );
}
