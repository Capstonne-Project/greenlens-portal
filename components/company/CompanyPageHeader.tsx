'use client';

import { CompanyOverviewHeaderBar } from '@/components/company/overview/CompanyOverviewHeaderBar';
import { getCompanyPageMeta } from '@/lib/constants/companyPageMeta';
import { usePathname, useSearchParams } from 'next/navigation';

export function CompanyPageHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isOverview = pathname === '/company';
  /** Detail immersive — chỉ gallery/meta/tabs + lifecycle (parity LEO detail). */
  const isTrackingDetail =
    pathname === '/company/tracking' && Boolean(searchParams.get('reportId')?.trim());
  const isReportsDetail =
    pathname === '/company/reports' && Boolean(searchParams.get('reportId')?.trim());
  const isAssignDetail = /^\/company\/assign\/[^/]+$/.test(pathname);
  /** Workforce có header riêng kiểu LEO Đội ngũ. */
  const isWorkforce = pathname === '/company/workforce';

  if (isTrackingDetail || isReportsDetail || isAssignDetail || isWorkforce) {
    return null;
  }

  if (isOverview) {
    return (
      <header className="mb-3 shrink-0">
        <div className="border-b border-slate-200 pb-3">
          <CompanyOverviewHeaderBar />
        </div>
      </header>
    );
  }

  const { title, description, icon: Icon } = getCompanyPageMeta(pathname);

  return (
    <header className="mb-3 shrink-0">
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-emerald-700">
            <Icon className="size-7" aria-hidden />
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="text-xs font-normal text-slate-500">{description}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
