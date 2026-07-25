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
import type { ReactNode } from 'react';

const STATUS_COLORS = ['#4f46e5', '#0ea5e9', '#f59e0b', '#059669', '#ef4444', '#94a3b8'];
const QUEUE_COLORS = ['#22c55e', '#facc15', '#f97316', '#dc2626'];

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

/** Three overview charts from /overview — replaces the 7-card KPI strip. */
export function CompanyOverviewSummaryCharts({ overview }: { overview: CompanyDashboardOverview }) {
  const taskBars = [
    { label: 'Đã giao', value: Math.max(0, overview.assignedTasks), color: '#4f46e5' },
    { label: 'Hoàn thành', value: Math.max(0, overview.completedTasks), color: '#059669' },
    { label: 'Đang chờ', value: Math.max(0, overview.pendingTasks), color: '#f59e0b' },
  ];
  const taskMax = Math.max(1, ...taskBars.map(b => b.value));

  const capacityBars = [
    { label: 'Đội', value: Math.max(0, overview.activeTeams), color: '#0ea5e9' },
    { label: 'Nhân sự', value: Math.max(0, overview.activeStaff), color: '#14b8a6' },
  ];
  const capacityMax = Math.max(1, ...capacityBars.map(b => b.value));

  const slaPct = Math.min(100, Math.max(0, normalizeRatePercent(overview.slaComplianceRate)));
  const gaugeR = 42;
  const gaugeC = Math.PI * gaugeR;
  const gaugeFilled = (slaPct / 100) * gaugeC;

  return (
    <section className="grid min-h-0 gap-3 lg:grid-cols-3">
      <CardShell title="Khối lượng nhiệm vụ" subtitle="Đã giao · hoàn thành · đang chờ">
        <div className="flex h-[120px] items-end gap-3 px-2">
          {taskBars.map(bar => (
            <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-semibold tabular-nums text-foreground">
                {formatOverviewNumber(bar.value)}
              </span>
              <div
                className="w-full max-w-10 rounded-t"
                style={{
                  height: `${Math.max(8, (bar.value / taskMax) * 100)}%`,
                  backgroundColor: bar.color,
                }}
                title={`${bar.label}: ${bar.value}`}
              />
              <span className="truncate text-[10px] text-muted-foreground">{bar.label}</span>
            </div>
          ))}
        </div>
      </CardShell>

      <CardShell title="Năng lực vận hành" subtitle="Đội và nhân sự đang hoạt động">
        <div className="flex h-[120px] flex-col justify-center gap-3 px-1">
          {capacityBars.map(bar => (
            <div key={bar.label}>
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{bar.label}</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatOverviewNumber(bar.value)}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(6, (bar.value / capacityMax) * 100)}%`,
                    backgroundColor: bar.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardShell>

      <CardShell title="SLA & thời gian xử lý" subtitle="Tuân thủ đúng hạn · TB giờ">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <svg
              width={110}
              height={66}
              viewBox="0 0 120 72"
              role="img"
              aria-label={`SLA ${slaPct}%`}
            >
              <path
                d="M 18 60 A 42 42 0 0 1 102 60"
                fill="none"
                stroke="currentColor"
                strokeWidth={10}
                className="text-muted"
                strokeLinecap="round"
              />
              <path
                d="M 18 60 A 42 42 0 0 1 102 60"
                fill="none"
                stroke={slaPct >= 90 ? '#059669' : slaPct >= 70 ? '#f59e0b' : '#ef4444'}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={`${gaugeFilled} ${gaugeC}`}
              />
            </svg>
            <p className="-mt-1 text-lg font-bold tabular-nums text-foreground">
              {slaPct.toFixed(0)}%
            </p>
          </div>
          <div className="min-w-0 flex-1 rounded-lg border border-border bg-muted/30 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              TB xử lý
            </p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-foreground">
              {formatHours(overview.averageResolutionHours, 1)}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              SLA {formatRatePercent(overview.slaComplianceRate, 0)}
            </p>
          </div>
        </div>
      </CardShell>
    </section>
  );
}

/** Line chart from /workload-trend */
export function CompanyWorkloadTrend({
  points,
}: {
  points: CompanyWorkloadTrendPoint[] | undefined;
}) {
  const data = points ?? [];
  const W = 340;
  const H = 140;
  const PAD = { t: 10, r: 8, b: 22, l: 28 };
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const maxY = Math.max(1, ...data.map(p => Math.max(trendDispatched(p), p.completed)));

  const xAt = (i: number) =>
    data.length <= 1 ? PAD.l + iw / 2 : PAD.l + (i / (data.length - 1)) * iw;
  const yAt = (v: number) => PAD.t + ih - (v / maxY) * ih;

  const pathFor = (getter: (p: CompanyWorkloadTrendPoint) => number) =>
    data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(getter(p))}`).join(' ');

  return (
    <CardShell title="Xu hướng khối lượng" subtitle="Dispatched vs hoàn thành theo ngày">
      {data.length === 0 ? (
        <EmptyHint text="Chưa có chuỗi thời gian" />
      ) : (
        <>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-[140px] w-full"
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
          <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
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
export function CompanyTaskStatusDonut({ items }: { items: CompanyTaskStatusItem[] | undefined }) {
  const slices = items ?? [];
  const total = slices.reduce((s, i) => s + Math.max(0, i.count), 0);
  const SIZE = 112;
  const STROKE = 16;
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
    <CardShell title="Theo trạng thái nhiệm vụ" subtitle={`Tổng ${formatOverviewNumber(total)}`}>
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-[10px]">
            <thead className="text-muted-foreground">
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] text-left text-[10px]">
            <thead className="text-muted-foreground">
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
}: {
  items: CompanyUpcomingDeadlineItem[] | undefined;
}) {
  const rows = (items ?? []).slice(0, 8);

  return (
    <CardShell title="Sắp đến hạn SLA" subtitle="Nhiệm vụ gần deadline">
      {rows.length === 0 ? (
        <EmptyHint text="Không có deadline sắp tới" />
      ) : (
        <ul className="max-h-[180px] space-y-1.5 overflow-y-auto pr-1">
          {rows.map(row => (
            <li
              key={row.taskId}
              className="rounded-lg border border-border/70 bg-muted/20 px-2 py-1.5 text-[10px]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="truncate font-semibold text-foreground">
                  {row.reportCode || row.taskId}
                </span>
                {row.priority ? (
                  <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-900">
                    {row.priority}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-muted-foreground">{row.location || '—'}</p>
              <p className="mt-0.5 tabular-nums text-muted-foreground">
                Hạn {new Date(row.deadline).toLocaleString('vi-VN')}
                {typeof row.remainingHours === 'number'
                  ? ` · còn ${row.remainingHours.toFixed(1)}h`
                  : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
}

/** Feed from /recent-activities */
export function CompanyRecentActivities({
  items,
}: {
  items: CompanyRecentActivityItem[] | undefined;
}) {
  const list = (items ?? []).slice(0, 8);

  return (
    <CardShell title="Hoạt động gần đây" subtitle="Vòng đời nhiệm vụ công ty">
      {list.length === 0 ? (
        <EmptyHint text="Chưa có sự kiện" />
      ) : (
        <ul className="max-h-[180px] space-y-2 overflow-y-auto pr-1">
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
