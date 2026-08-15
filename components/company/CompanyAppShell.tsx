'use client';

import { AppSidebar } from '@/components/common/AppSidebar';
import { CompanyPageHeader } from '@/components/company/CompanyPageHeader';
import { getCompanyShellNavConfig } from '@/lib/constants/companyShellNav';
import { PROFILE_ROUTES } from '@/lib/constants/profilePortal';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

/**
 * Company shell — AppSidebar + Officer/Admin-matching bordered content panel.
 * Overview (`/company`) locks to one viewport page (no outer scroll).
 * Other tabs keep a single vertical scroller in the content pane.
 */
export function CompanyAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOverview = pathname === '/company';
  const isAssign = pathname === '/company/assign';
  const isReports = pathname === '/company/reports';
  const isTracking = pathname === '/company/tracking';
  const isWorkforce = pathname === '/company/workforce';
  const fillViewport = isOverview || isAssign || isReports || isTracking || isWorkforce;
  const companyNavConfig = getCompanyShellNavConfig();

  return (
    <div className="app-canvas flex h-dvh w-screen overflow-hidden font-sans md:flex-row">
      <AppSidebar
        config={companyNavConfig}
        profileHref={PROFILE_ROUTES.company}
        settingsHref="/company/settings"
      />

      <div className="app-shell-gutter">
        <div
          className={cn(
            'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-app-panel p-2 md:p-6',
            'border border-[#e8e8e8] border-l-2',
            'shadow-[2px_0_10px_-2px_rgb(0_0_0/10%),0_1px_3px_rgb(0_0_0/4%)]'
          )}
        >
          <Suspense fallback={null}>
            <CompanyPageHeader />
          </Suspense>
          <div
            className={cn(
              'min-h-0 min-w-0 flex-1 overscroll-contain',
              fillViewport && 'flex flex-col overflow-hidden',
              isReports && '-mx-2 md:-mx-6',
              !fillViewport && 'overflow-x-hidden overflow-y-auto pt-4 md:pt-5'
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
