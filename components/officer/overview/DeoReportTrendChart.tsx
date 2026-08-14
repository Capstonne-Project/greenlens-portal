import type {
  DeoReportTrendGroupBy,
  DeoReportTrendPoint,
} from '@/lib/api/services/fetchDeoDashboard';
import { formatOverviewNumber } from '@/components/admin/overview/adminDashboardFormat';

const GROUP_BY_SUBTITLE: Record<DeoReportTrendGroupBy, string> = {
  Day: 'Tạo mới vs giải quyết theo ngày',
  Week: 'Tạo mới vs giải quyết theo tuần',
  Month: 'Tạo mới vs giải quyết theo tháng',
};

export function DeoReportTrendChart({
  points,
  groupBy,
}: {
  points: DeoReportTrendPoint[] | undefined;
  groupBy: DeoReportTrendGroupBy;
}) {
  const list = points ?? [];
  const max = Math.max(1, ...list.map(p => Math.max(p.created, p.resolved)));

  return (
    <article className="flex h-full min-h-0 flex-col rounded-card border border-border bg-card p-3 shadow-sm">
      <header className="mb-2 shrink-0">
        <h2 className="text-xs font-semibold text-foreground sm:text-sm">Xu hướng báo cáo</h2>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{GROUP_BY_SUBTITLE[groupBy]}</p>
      </header>
      {list.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Chưa có dữ liệu xu hướng</p>
      ) : (
        <div className="flex h-full min-h-[140px] items-end gap-1 px-1 pb-1">
          {list.map(point => {
            const createdH = Math.max(4, Math.round((point.created / max) * 100));
            const resolvedH = Math.max(4, Math.round((point.resolved / max) * 100));
            const label = point.date?.slice(5) ?? '';
            return (
              <div
                key={point.date}
                className="group flex min-w-0 flex-1 flex-col items-center gap-1"
                title={`${point.date}: tạo ${point.created} · giải quyết ${point.resolved}`}
              >
                <div className="flex h-[120px] w-full max-w-[32px] items-end justify-center gap-0.5">
                  <div
                    className="w-1/2 rounded-t bg-indigo-500/90"
                    style={{ height: `${createdH}%` }}
                    aria-hidden
                  />
                  <div
                    className="w-1/2 rounded-t bg-emerald-600/90"
                    style={{ height: `${resolvedH}%` }}
                    aria-hidden
                  />
                </div>
                <span className="truncate text-[8px] tabular-nums text-muted-foreground">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-sm bg-indigo-500" aria-hidden />
          Tạo mới {formatOverviewNumber(list.reduce((sum, p) => sum + p.created, 0))}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-sm bg-emerald-600" aria-hidden />
          Giải quyết {formatOverviewNumber(list.reduce((sum, p) => sum + p.resolved, 0))}
        </span>
      </div>
    </article>
  );
}
