'use client';

import { AppSidebar } from '@/components/common/AppSidebar';
import { CompanyTopHeader } from '@/components/company/CompanyTopHeader';
import { useCompanyAssignmentsNewCount, useCompanyQueueCount } from '@/hooks/useCompany';
import { getCompanyShellNavConfig } from '@/lib/constants/companyShellNav';
import { PROFILE_ROUTES } from '@/lib/constants/profilePortal';
import type { MapShellNavConfig } from '@/lib/constants/mapShellNav';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

/**
 * Company shell — AppSidebar + Officer/Admin-matching bordered content panel.
 * Overview (`/company`) locks to one viewport page (no outer scroll).
 * Other tabs keep a single vertical scroller in the content pane.
 */
export function CompanyAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOverview = pathname === '/company';
  const isAssignments = pathname === '/company/assignments';
  const { data: queueCount } = useCompanyQueueCount();
  const { data: assignmentsNewCount } = useCompanyAssignmentsNewCount();

  const companyNavConfig = useMemo((): MapShellNavConfig => {
    const base = getCompanyShellNavConfig();
    return {
      ...base,
      mainNav: base.mainNav.map(item => {
        if (item.id === 'queue' && typeof queueCount === 'number' && queueCount > 0) {
          return { ...item, badge: queueCount };
        }
        if (
          item.id === 'assignments' &&
          typeof assignmentsNewCount === 'number' &&
          assignmentsNewCount > 0
        ) {
          return { ...item, badge: assignmentsNewCount };
        }
        return item;
      }),
    };
  }, [queueCount, assignmentsNewCount]);

  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-[#f7f7f7] font-sans md:flex-row">
      <AppSidebar config={companyNavConfig} profileHref={PROFILE_ROUTES.company} settingsHref="" />

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden py-2 pr-2">
        <div
          className={cn(
            'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#fffdfc] p-2 md:p-6',
            'border border-[#e8e8e8] border-l-2',
            'shadow-[2px_0_10px_-2px_rgb(0_0_0/10%),0_1px_3px_rgb(0_0_0/4%)]'
          )}
        >
          <CompanyTopHeader />
          <div
            className={cn(
              'min-h-0 min-w-0 flex-1 overscroll-contain',
              isOverview
                ? 'overflow-hidden pt-2 md:pt-3'
                : 'overflow-x-hidden overflow-y-auto pt-4 md:pt-5',
              isAssignments && 'scrollbar-hide'
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
