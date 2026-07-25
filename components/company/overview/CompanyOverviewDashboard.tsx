'use client';

import { CompanyStatusBadge } from '@/components/company/CompanyStatusBadge';
import { CompanyOverviewCharts } from '@/components/company/overview/CompanyOverviewCharts';
import { useCompanyQueueCount, useMyCompany } from '@/hooks/useCompany';
import { formatCompanyDate } from '@/utils/companyUi';
import {
  AlertTriangle,
  Building2,
  ClipboardList,
  FileText,
  Mail,
  MapPinned,
  Phone,
  RefreshCw,
  Users,
} from 'lucide-react';
import Link from 'next/link';

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

function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'CM';
}

export function CompanyOverviewDashboard() {
  const { data: company, isPending, isError, error, refetch } = useMyCompany();
  const { data: queueCount } = useCompanyQueueCount();

  if (isPending) return <CompanyOverviewSkeleton />;

  if (isError || !company) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          <div className="min-w-0 space-y-2">
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
  const initials = companyInitials(company.name);

  return (
    <div className="relative w-full min-w-0 space-y-4">
      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white dark:border-border dark:bg-card">
        {/* Header: all text stays inside the green band — no overlapping avatar */}
        <div className="bg-emerald-600 px-4 py-4 text-white sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-sm font-bold tracking-wide text-white"
                aria-hidden
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
                  <Building2 className="size-3 shrink-0" aria-hidden />
                  <span>Trung tâm điều phối</span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-bold tracking-tight text-white">
                    {company.name}
                  </h1>
                  <CompanyStatusBadge
                    status={company.status}
                    className="bg-white text-emerald-900 ring-0"
                  />
                </div>
                <p className="mt-1 truncate text-xs text-emerald-50">
                  {company.departmentName}
                  <span className="mx-1.5 text-emerald-200">·</span>
                  MST {company.taxCode}
                </p>
              </div>
            </div>

            <Link
              href="/company/queue"
              className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg px-3 text-sm font-semibold transition sm:self-center ${
                hasQueue
                  ? 'bg-white text-emerald-900 hover:bg-emerald-50'
                  : 'border border-white/40 bg-emerald-700 text-white hover:bg-emerald-800'
              }`}
            >
              <ClipboardList className="size-3.5 shrink-0" aria-hidden />
              <span className="whitespace-nowrap">
                {hasQueue ? `${queueCount} chờ phân công` : 'Hàng đợi'}
              </span>
            </Link>
          </div>
        </div>

        <div className="px-4 py-3 sm:px-5">
          <dl className="grid grid-cols-4 gap-2">
            {[
              { label: 'Chờ xử lý', value: String(queueCount ?? 0) },
              { label: 'Nhân sự', value: String(company.staffCount) },
              { label: 'Khu vực', value: String(company.serviceAreas.length) },
              { label: 'Còn hạn', value: daysLeft != null ? `${daysLeft}d` : '—' },
            ].map(cell => (
              <div
                key={cell.label}
                className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-2 text-center dark:border-border dark:bg-muted/40"
              >
                <dt className="truncate text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-muted-foreground">
                  {cell.label}
                </dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums text-emerald-950 dark:text-foreground">
                  {cell.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-3 space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <FileText className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
                <span>
                  {company.contractType} · {company.contractNumber}
                </span>
              </span>
              <span className="text-muted-foreground">
                {formatCompanyDate(company.contractStartDate)} —{' '}
                {formatCompanyDate(company.contractEndDate)}
              </span>
              <span className="text-muted-foreground">
                {progress}%{daysLeft != null && daysLeft > 0 ? ` · còn ${daysLeft} ngày` : ''}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-emerald-100 dark:bg-muted">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-3 grid gap-3 border-t border-emerald-100 pt-3 dark:border-border sm:grid-cols-2">
            <div className="min-w-0">
              <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Liên hệ
              </h2>
              <ul className="space-y-1.5 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <MapPinned className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
                  <span className="break-words">{company.address}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
                  <a href={`tel:${company.phone}`} className="hover:underline">
                    {company.phone}
                  </a>
                </li>
                <li className="flex min-w-0 items-center gap-2">
                  <Mail className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
                  <a href={`mailto:${company.email}`} className="min-w-0 break-all hover:underline">
                    {company.email}
                  </a>
                </li>
              </ul>
            </div>

            <div className="min-w-0">
              <h2 className="mb-1.5 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Phạm vi phục vụ</span>
                <span className="tabular-nums text-emerald-700">{company.serviceAreas.length}</span>
              </h2>
              {company.serviceAreas.length === 0 ? (
                <p className="text-xs text-muted-foreground">Chưa có khu vực được gán.</p>
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {company.serviceAreas.map(area => (
                    <li
                      key={area.id}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:border-border dark:bg-muted dark:text-foreground"
                    >
                      <span className="size-1 shrink-0 rounded-full bg-emerald-600" aria-hidden />
                      <span className="truncate">{area.wardName}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 inline-flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                <Users className="size-3 shrink-0" aria-hidden />
                <span>
                  {company.staffCount} nhân sự · Thành lập {formatCompanyDate(company.createdAt)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <CompanyOverviewCharts />
    </div>
  );
}

function CompanyOverviewSkeleton() {
  return <div className="h-56 animate-pulse rounded-2xl bg-emerald-100" />;
}
