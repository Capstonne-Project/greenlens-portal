import type { OverviewStatusSlice } from '@/utils/adminOverview';
import { formatOverviewCompact } from '@/utils/adminOverview';

interface OverviewStatusChartProps {
  slices: OverviewStatusSlice[];
  total: number;
}

const SIZE = 180;
const STROKE = 24;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function OverviewStatusChart({ slices, total }: OverviewStatusChartProps) {
  let offset = 0;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
      <div className="relative mx-auto flex size-44 items-center justify-center">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="Báo cáo theo trạng thái"
        >
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {slices.length === 0 ? (
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE}
                className="text-muted/40"
              />
            ) : (
              slices.map(slice => {
                const length = total > 0 ? (slice.count / total) * CIRCUMFERENCE : 0;
                const dasharray = `${length} ${CIRCUMFERENCE - length}`;
                const element = (
                  <circle
                    key={slice.status}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={STROKE}
                    strokeDasharray={dasharray}
                    strokeDashoffset={-offset}
                    strokeLinecap="butt"
                  />
                );
                offset += length;
                return element;
              })
            )}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Tổng
          </p>
          <p className="text-xl font-bold text-foreground">{formatOverviewCompact(total)}</p>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2">
        {slices.length === 0 ? (
          <li className="text-sm text-muted-foreground">Chưa có báo cáo để phân bổ trạng thái.</li>
        ) : (
          slices.map(slice => (
            <li key={slice.status} className="flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate">{slice.label}</span>
              </span>
              <span className="shrink-0 font-semibold text-foreground">
                {slice.percent}% · {slice.count}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
