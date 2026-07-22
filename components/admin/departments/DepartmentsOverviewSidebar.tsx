'use client';

import type { DepartmentListItem } from '@/lib/api/models/department';
import { Building2, Landmark, MapPin } from 'lucide-react';
import { useMemo } from 'react';

const DONUT_SIZE = 120;
const DONUT_STROKE = 18;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CIRC = 2 * Math.PI * DONUT_RADIUS;

interface DepartmentsOverviewSidebarProps {
  items: DepartmentListItem[];
  totalItems: number;
  isLoading?: boolean;
}

export function DepartmentsOverviewSidebar({
  items,
  totalItems,
  isLoading,
}: DepartmentsOverviewSidebarProps) {
  const stats = useMemo(() => {
    const active = items.filter(d => d.isActive).length;
    const inactive = items.length - active;
    const offices = items.reduce((sum, d) => sum + d.officeCount, 0);
    return { active, inactive, offices };
  }, [items]);

  const chartTotal = stats.active + stats.inactive;
  const slices =
    chartTotal === 0
      ? []
      : [
          { key: 'active', label: 'Hoạt động', count: stats.active, color: '#0f766e' },
          { key: 'inactive', label: 'Vô hiệu', count: stats.inactive, color: '#e4e4e7' },
        ];

  let dashOffset = 0;

  return (
    <aside className="flex flex-col gap-4">
      <article className="rounded-card border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Tổng quan</p>
        <p className="mt-1 text-sm text-muted-foreground">Phân cấp Sở · văn phòng trực thuộc</p>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
            <span className="flex items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-300">
              <span className="flex size-9 items-center justify-center rounded-lg bg-white text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
                <Building2 className="size-4" aria-hidden />
              </span>
              Sở TNMT
            </span>
            <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {isLoading ? '—' : totalItems.toLocaleString('vi-VN')}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200/80 bg-stone-50/80 px-4 py-3 dark:border-stone-800 dark:bg-stone-900/30">
            <span className="flex items-center gap-2.5 text-sm text-stone-600 dark:text-stone-300">
              <span className="flex size-9 items-center justify-center rounded-lg bg-white text-stone-600 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700">
                <Landmark className="size-4" aria-hidden />
              </span>
              Văn phòng
            </span>
            <span className="text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-50">
              {isLoading ? '—' : stats.offices.toLocaleString('vi-VN')}
            </span>
          </div>
        </div>
      </article>

      <article className="rounded-card border border-border bg-card p-5 shadow-sm">
        <p className="text-center text-sm font-medium text-foreground">Trạng thái</p>

        <div className="mt-4 flex flex-col items-center">
          <div className="relative flex size-[120px] items-center justify-center">
            <svg
              width={DONUT_SIZE}
              height={DONUT_SIZE}
              viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
              role="img"
              aria-label="Phân bổ trạng thái ủy ban"
            >
              <g transform={`rotate(-90 ${DONUT_SIZE / 2} ${DONUT_SIZE / 2})`}>
                {slices.length === 0 ? (
                  <circle
                    cx={DONUT_SIZE / 2}
                    cy={DONUT_SIZE / 2}
                    r={DONUT_RADIUS}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={DONUT_STROKE}
                    className="text-muted/30"
                  />
                ) : (
                  slices.map(slice => {
                    const length = chartTotal > 0 ? (slice.count / chartTotal) * DONUT_CIRC : 0;
                    const el = (
                      <circle
                        key={slice.key}
                        cx={DONUT_SIZE / 2}
                        cy={DONUT_SIZE / 2}
                        r={DONUT_RADIUS}
                        fill="none"
                        stroke={slice.color}
                        strokeWidth={DONUT_STROKE}
                        strokeDasharray={`${length} ${DONUT_CIRC - length}`}
                        strokeDashoffset={-dashOffset}
                      />
                    );
                    dashOffset += length;
                    return el;
                  })
                )}
              </g>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <MapPin className="mb-0.5 size-3.5 text-zinc-400" aria-hidden />
              <span className="text-base font-bold tabular-nums">
                {isLoading ? '—' : chartTotal}
              </span>
            </div>
          </div>

          <ul className="mt-4 w-full space-y-2 border-t border-border pt-4 text-sm">
            {slices.map(slice => {
              const pct = chartTotal > 0 ? Math.round((slice.count / chartTotal) * 100) : 0;
              return (
                <li key={slice.key} className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.color }}
                    />
                    {slice.label}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-foreground">
                    {pct}% · {slice.count}
                  </span>
                </li>
              );
            })}
            {slices.length === 0 && !isLoading ? (
              <li className="text-center text-muted-foreground">Chưa có dữ liệu.</li>
            ) : null}
          </ul>
        </div>
      </article>
    </aside>
  );
}
