'use client';

import { OverviewGrowthChart } from '@/components/admin/overview/OverviewGrowthChart';
import { OverviewStatGrid } from '@/components/admin/overview/OverviewStatGrid';
import { OverviewStatusChart } from '@/components/admin/overview/OverviewStatusChart';
import { useAdminOverview } from '@/hooks/useAdminOverview';
import type { OverviewGrowthRange } from '@/utils/adminOverview';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const RANGE_OPTIONS: { value: OverviewGrowthRange; label: string }[] = [
  { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
];

function integrationLabel(status: 'stable' | 'slow' | 'error'): string {
  if (status === 'stable') return 'Ổn định';
  if (status === 'slow') return 'Chậm';
  return 'Lỗi';
}

function integrationClass(status: 'stable' | 'slow' | 'error'): string {
  if (status === 'stable') return 'text-emerald-700';
  if (status === 'slow') return 'text-amber-700';
  return 'text-destructive';
}

export function AdminOverviewDashboard() {
  const { growthRange, setGrowthRange, snapshot, isPending, isError, error, refetch } =
    useAdminOverview();

  if (isPending) {
    return <AdminOverviewSkeleton />;
  }

  if (isError || !snapshot) {
    return (
      <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          <div className="min-w-0 space-y-3">
            <p className="font-semibold text-destructive">Không tải được dữ liệu tổng quan</p>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'Vui lòng thử lại sau.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted"
            >
              <RefreshCw className="size-4" aria-hidden />
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-8">
      <p className="border-b border-border pb-6 text-sm text-muted-foreground">
        Bảng điều khiển · cập nhật lúc {snapshot.updatedAt}
      </p>

      <OverviewStatGrid stats={snapshot.stats} />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Tăng trưởng người dùng &amp; báo cáo</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Gom theo ngày tạo từ API người dùng và bản đồ báo cáo.
              </p>
            </div>
            <div className="flex rounded-lg border border-border bg-muted/30 p-1">
              {RANGE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGrowthRange(option.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    growthRange === option.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <OverviewGrowthChart
            points={snapshot.growth}
            totalReports={snapshot.growthTotalReports}
            totalUsers={snapshot.growthTotalUsers}
          />
        </div>

        <div className="rounded-card border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Báo cáo theo trạng thái</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Phân bổ từ tối đa 500 báo cáo trong khu vực quan sát mặc định (tâm bản đồ).
          </p>
          <div className="mt-6">
            <OverviewStatusChart slices={snapshot.statusSlices} total={snapshot.reportTotal} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-card border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold">Hoạt động gần đây</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {snapshot.activities.length === 0 ? (
              <li className="text-muted-foreground">Chưa có báo cáo có ngày tạo hợp lệ.</li>
            ) : (
              snapshot.activities.map(item => (
                <li
                  key={item.id}
                  className="flex justify-between gap-3 border-b border-border pb-3 text-muted-foreground"
                >
                  <span className="min-w-0 truncate">{item.title}</span>
                  <span className="shrink-0 text-xs">{item.timeLabel}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="rounded-card border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Cảnh báo hệ thống</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {snapshot.integrations
                .filter(item => item.status !== 'stable')
                .map(item => (
                  <li key={item.id} className="flex items-start gap-3">
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-amber-500" />
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-muted-foreground">
                        {item.latencyMs != null ? `${item.latencyMs}ms` : 'Không phản hồi'}
                      </p>
                    </div>
                  </li>
                ))}
              {snapshot.integrations.every(item => item.status === 'stable') && (
                <li className="text-muted-foreground">
                  Không có cảnh báo từ các tích hợp đang giám sát.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-card border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Trạng thái tích hợp</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {snapshot.categoryCount} danh mục ô nhiễm đang hoạt động.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {snapshot.integrations.map(item => (
                <li key={item.id} className="flex items-center justify-between gap-3">
                  <span>{item.label}</span>
                  <span className={`font-medium ${integrationClass(item.status)}`}>
                    {item.latencyMs != null ? `${item.latencyMs}ms · ` : ''}
                    {integrationLabel(item.status)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function AdminOverviewSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-5 w-72 rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-card bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-card bg-muted" />
        <div className="h-80 rounded-card bg-muted" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-72 rounded-card bg-muted lg:col-span-2" />
        <div className="h-72 rounded-card bg-muted" />
      </div>
    </div>
  );
}
