'use client';

import { useMyCompanyKpi } from '@/hooks/useCompany';
import {
  formatAvgResolutionHours,
  formatCompanyDate,
  formatSlaComplianceRate,
} from '@/utils/companyUi';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const BAR_W = 320;
const BAR_H = 180;
const BAR_PAD = { top: 20, right: 12, bottom: 36, left: 36 };

const LINE_W = 320;
const LINE_H = 180;
const LINE_PAD = { top: 20, right: 16, bottom: 36, left: 36 };

type BarPoint = { label: string; value: number; color: string };
type LinePoint = { label: string; value: number };

function pctOf(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

/** Compact overview: one bar chart + one line chart from MyCompanyKpi only. */
export function CompanyOverviewCharts() {
  const { data: kpi, isPending, isError } = useMyCompanyKpi({});

  if (isError) return null;

  if (isPending || !kpi) {
    return (
      <section className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white py-10 text-sm text-muted-foreground dark:border-border dark:bg-card">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Đang tải biểu đồ…
      </section>
    );
  }

  const assigned = kpi.totalAssigned;
  const inPipeline = Math.max(0, assigned - kpi.totalDeclined);
  const completed = Math.min(kpi.totalCompleted, inPipeline);
  const onTime = Math.min(kpi.completedOnTime, completed);
  const lateCount = Math.max(0, kpi.totalCompleted - kpi.completedOnTime);

  const bars: BarPoint[] = [
    { label: 'Nhận', value: assigned, color: '#047857' },
    { label: 'Hoàn thành', value: kpi.totalCompleted, color: '#059669' },
    { label: 'Đúng hạn', value: kpi.completedOnTime, color: '#34d399' },
    { label: 'Từ chối', value: kpi.totalDeclined, color: '#d97706' },
  ];
  const barMax = Math.max(1, ...bars.map(b => b.value));

  const linePoints: LinePoint[] = [
    { label: 'Nhận', value: assigned },
    { label: 'Xử lý', value: inPipeline },
    { label: 'Xong', value: completed },
    { label: 'Đúng hạn', value: onTime },
  ];
  const lineMax = Math.max(1, ...linePoints.map(p => p.value));

  const barInnerW = BAR_W - BAR_PAD.left - BAR_PAD.right;
  const barInnerH = BAR_H - BAR_PAD.top - BAR_PAD.bottom;
  const barGap = 12;
  const barSlot = barInnerW / bars.length;
  const barWidth = Math.max(18, barSlot - barGap);

  const lineInnerW = LINE_W - LINE_PAD.left - LINE_PAD.right;
  const lineInnerH = LINE_H - LINE_PAD.top - LINE_PAD.bottom;
  const lineCoords = linePoints.map((p, i) => {
    const x =
      LINE_PAD.left +
      (linePoints.length === 1 ? lineInnerW / 2 : (i / (linePoints.length - 1)) * lineInnerW);
    const y = LINE_PAD.top + lineInnerH - (p.value / lineMax) * lineInnerH;
    return { ...p, x, y };
  });
  const linePath = lineCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white dark:border-border dark:bg-card">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-emerald-100 px-4 py-3 dark:border-border sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Phân tích hiệu suất</h2>
          <p className="text-xs text-muted-foreground">
            {kpi.companyName}
            <span className="mx-1.5 text-emerald-300">·</span>
            {formatCompanyDate(kpi.periodFrom)} — {formatCompanyDate(kpi.periodTo)}
            <span className="mx-1.5 text-emerald-300">·</span>
            SLA {formatSlaComplianceRate(kpi.slaComplianceRate)}
            <span className="mx-1.5 text-emerald-300">·</span>
            TB {formatAvgResolutionHours(kpi.avgResolutionHours)}
          </p>
        </div>
        <Link
          href="/company/kpi"
          className="shrink-0 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
        >
          Chi tiết KPI →
        </Link>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
        {/* Bar chart */}
        <div className="min-w-0">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Khối lượng (cột)
          </h3>
          <svg
            viewBox={`0 0 ${BAR_W} ${BAR_H}`}
            className="h-44 w-full"
            role="img"
            aria-label="Biểu đồ cột khối lượng xử lý"
          >
            {[0, 0.5, 1].map(ratio => {
              const y = BAR_PAD.top + barInnerH * (1 - ratio);
              return (
                <line
                  key={ratio}
                  x1={BAR_PAD.left}
                  x2={BAR_W - BAR_PAD.right}
                  y1={y}
                  y2={y}
                  className="stroke-emerald-100 dark:stroke-border"
                  strokeWidth={1}
                />
              );
            })}
            {bars.map((bar, i) => {
              const h = (bar.value / barMax) * barInnerH;
              const x = BAR_PAD.left + i * barSlot + (barSlot - barWidth) / 2;
              const y = BAR_PAD.top + barInnerH - h;
              return (
                <g key={bar.label}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(bar.value > 0 ? 2 : 0, h)}
                    rx={4}
                    fill={bar.color}
                  />
                  {bar.value > 0 ? (
                    <text
                      x={x + barWidth / 2}
                      y={y - 6}
                      textAnchor="middle"
                      className="fill-foreground text-[10px] font-semibold"
                    >
                      {bar.value}
                    </text>
                  ) : null}
                  <text
                    x={x + barWidth / 2}
                    y={BAR_H - 12}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {bar.label}
                  </text>
                </g>
              );
            })}
          </svg>
          {assigned === 0 ? (
            <p className="text-center text-xs text-muted-foreground">Chưa có task trong kỳ.</p>
          ) : null}
        </div>

        {/* Line chart — lifecycle conversion */}
        <div className="min-w-0">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Vòng đời (đường)
          </h3>
          <svg
            viewBox={`0 0 ${LINE_W} ${LINE_H}`}
            className="h-44 w-full"
            role="img"
            aria-label="Biểu đồ đường vòng đời task"
          >
            {[0, 0.5, 1].map(ratio => {
              const y = LINE_PAD.top + lineInnerH * (1 - ratio);
              return (
                <line
                  key={ratio}
                  x1={LINE_PAD.left}
                  x2={LINE_W - LINE_PAD.right}
                  y1={y}
                  y2={y}
                  className="stroke-emerald-100 dark:stroke-border"
                  strokeWidth={1}
                />
              );
            })}
            <path
              d={linePath}
              fill="none"
              stroke="#059669"
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            {lineCoords.map(c => (
              <g key={c.label}>
                <circle cx={c.x} cy={c.y} r={4} fill="#047857" />
                <text
                  x={c.x}
                  y={c.y - 10}
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-semibold"
                >
                  {c.value}
                </text>
                <text
                  x={c.x}
                  y={LINE_H - 12}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {c.label}
                </text>
              </g>
            ))}
          </svg>
          <p className="mt-1 text-center text-[11px] text-muted-foreground">
            Hoàn thành {pctOf(kpi.totalCompleted, assigned)}% · Muộn {lateCount}
          </p>
        </div>
      </div>
    </section>
  );
}
