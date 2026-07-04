'use client';

import { CompanyStatusBadge } from '@/components/company/CompanyStatusBadge';
import { CompanyCommandRail } from '@/components/company/shared/CompanyCommandRail';
import { useCompanyQueueCount, useMyCompany } from '@/hooks/useCompany';
import { formatCompanyDate } from '@/utils/companyUi';
import {
  AlertTriangle,
  ClipboardList,
  LineChart,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Sparkles,
  Users,
  UsersRound,
} from 'lucide-react';

function contractProgressPercent(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const now = Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  const p = ((now - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, Math.round(p)));
}

function daysUntil(iso: string): number | null {
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function CompanyOverviewDashboard() {
  const { data: company, isPending, isError, error, refetch } = useMyCompany();
  const { data: queueCount } = useCompanyQueueCount();

  if (isPending) return <CompanyOverviewSkeleton />;

  if (isError || !company) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          <div className="min-w-0 space-y-3">
            <p className="font-semibold text-destructive">Không tải được thông tin công ty</p>
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

  const progress = contractProgressPercent(company.contractStartDate, company.contractEndDate);
  const daysLeft = daysUntil(company.contractEndDate);
  const hasQueue = typeof queueCount === 'number' && queueCount > 0;

  return (
    <div className="relative w-full min-w-0 space-y-6">
      <section className="overflow-hidden rounded-3xl border border-emerald-200/60 bg-white/90 shadow-lg shadow-emerald-900/5 backdrop-blur dark:border-border dark:bg-card/90">
        <div className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 px-6 py-8 text-white sm:px-8">
          <div
            className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/10 blur-2xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-100/90">
                <Sparkles className="size-3.5" aria-hidden />
                Trung tâm điều phối
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{company.name}</h1>
                <CompanyStatusBadge
                  status={company.status}
                  className="bg-white/15 text-white ring-1 ring-white/25"
                />
              </div>
              <p className="mt-2 max-w-xl text-sm text-emerald-50/90">
                {company.departmentName} · MST {company.taxCode}
              </p>
            </div>

            {hasQueue && (
              <div className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium ring-1 ring-white/20 backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-300 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-amber-200" />
                </span>
                {queueCount} báo cáo chờ phân công
              </div>
            )}
          </div>

          <dl className="relative mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-4">
            {[
              { label: 'Chờ xử lý', value: queueCount ?? 0, sub: 'từ LEO' },
              { label: 'Nhân sự', value: company.staffCount, sub: 'đang quản lý' },
              { label: 'Khu vực', value: company.serviceAreas.length, sub: 'phường/xã' },
              {
                label: 'Hợp đồng',
                value: daysLeft != null ? `${daysLeft}d` : '—',
                sub: company.contractNumber,
              },
            ].map(cell => (
              <div key={cell.label} className="bg-white/10 px-4 py-4 backdrop-blur-sm">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-emerald-100/80">
                  {cell.label}
                </dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums">{cell.value}</dd>
                <dd className="mt-0.5 truncate text-[11px] text-emerald-50/75">{cell.sub}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="border-t border-emerald-100/80 px-6 py-5 dark:border-border sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-emerald-900 dark:text-foreground">
              {company.contractType} · {company.contractNumber}
            </span>
            <span className="text-muted-foreground">
              {formatCompanyDate(company.contractStartDate)} →{' '}
              {formatCompanyDate(company.contractEndDate)}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100 dark:bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Đã qua {progress}% thời hạn hợp đồng
            {daysLeft != null && daysLeft > 0 && ` · còn ${daysLeft} ngày`}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-emerald-100/80 bg-white/90 shadow-sm backdrop-blur dark:border-border dark:bg-card/90">
        <div className="grid divide-y divide-emerald-50 dark:divide-border lg:grid-cols-5 lg:divide-x lg:divide-y-0">
          <div className="space-y-4 p-6 lg:col-span-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-400">
              Liên hệ
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                <span>{company.address}</span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                <span>{company.phone}</span>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                <span>{company.email}</span>
              </li>
            </ul>
          </div>

          <div className="p-6 lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-400">
              Phạm vi phục vụ
            </h2>
            {company.serviceAreas.length === 0 ? (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Chưa có khu vực được gán. Liên hệ đơn vị quản lý để cập nhật hợp đồng.
              </p>
            ) : (
              <ul className="mt-4 flex flex-wrap gap-2">
                {company.serviceAreas.map(area => (
                  <li
                    key={area.id}
                    className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-900 dark:border-border dark:bg-muted"
                  >
                    {area.wardName}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-6 text-xs text-muted-foreground">
              Thành lập {formatCompanyDate(company.createdAt)}
            </p>
          </div>
        </div>
      </section>

      <CompanyCommandRail
        items={[
          {
            href: '/company/queue',
            label: 'Điều phối báo cáo',
            description: 'Phân công đội Cleanup',
            icon: ClipboardList,
            accent: hasQueue,
            badge: queueCount,
          },
          {
            href: '/company/assignments',
            label: 'Theo dõi phân công',
            description: 'Tiến độ & kết quả task',
            icon: LineChart,
          },
          {
            href: '/company/staff',
            label: 'Nhân sự',
            description: `${company.staffCount} người`,
            icon: Users,
          },
          {
            href: '/company/teams',
            label: 'Đội dọn dẹp',
            description: 'Quản lý nguồn lực hiện trường',
            icon: UsersRound,
          },
        ]}
      />
    </div>
  );
}

function CompanyOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-64 animate-pulse rounded-3xl bg-emerald-100/60" />
      <div className="h-40 animate-pulse rounded-3xl bg-emerald-50/80" />
      <div className="h-16 animate-pulse rounded-2xl bg-emerald-50/60" />
    </div>
  );
}
