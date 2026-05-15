import type { OverviewGrowthPoint } from '@/utils/adminOverview';

interface OverviewGrowthChartProps {
  points: OverviewGrowthPoint[];
  totalReports: number;
  totalUsers: number;
}

const CHART_WIDTH = 560;
const CHART_HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 28, left: 36 };

function buildPath(
  values: number[],
  maxValue: number,
  innerWidth: number,
  innerHeight: number
): string {
  if (values.length === 0) return '';
  const step = values.length > 1 ? innerWidth / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const x = PADDING.left + step * index;
      const y = PADDING.top + innerHeight - (maxValue > 0 ? (value / maxValue) * innerHeight : 0);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

export function OverviewGrowthChart({
  points,
  totalReports,
  totalUsers,
}: OverviewGrowthChartProps) {
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const reportValues = points.map(point => point.reports);
  const userValues = points.map(point => point.users);
  const maxValue = Math.max(1, ...reportValues, ...userValues);
  const reportPath = buildPath(reportValues, maxValue, innerWidth, innerHeight);
  const userPath = buildPath(userValues, maxValue, innerWidth, innerHeight);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Chu kỳ hiện tại
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {new Intl.NumberFormat('vi-VN').format(totalReports + totalUsers)}
          </p>
        </div>
        <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          {totalReports} báo cáo · {totalUsers} người dùng
        </div>
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="h-56 w-full text-emerald-700"
        role="img"
        aria-label="Biểu đồ tăng trưởng người dùng và báo cáo"
      >
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const y = PADDING.top + innerHeight * (1 - ratio);
          return (
            <line
              key={ratio}
              x1={PADDING.left}
              x2={CHART_WIDTH - PADDING.right}
              y1={y}
              y2={y}
              className="stroke-border"
              strokeWidth={1}
            />
          );
        })}
        <path d={reportPath} fill="none" stroke="currentColor" strokeWidth={2.5} />
        <path d={userPath} fill="none" stroke="#86efac" strokeWidth={2.5} strokeDasharray="6 4" />
        {points.map((point, index) => {
          const step = points.length > 1 ? innerWidth / (points.length - 1) : 0;
          const x = PADDING.left + step * index;
          return (
            <text
              key={`${point.label}-${index}`}
              x={x}
              y={CHART_HEIGHT - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {point.label}
            </text>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-700" />
          Báo cáo
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-300" />
          Người dùng mới
        </span>
      </div>
    </div>
  );
}
