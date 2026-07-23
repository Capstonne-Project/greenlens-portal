'use client';

import { AppSidebar } from '@/components/common/AppSidebar';
import { CompanyTopHeader } from '@/components/company/CompanyTopHeader';
import { getCompanyShellNavConfig } from '@/lib/constants/companyShellNav';
import { cn } from '@/lib/utils';

const companyNavConfig = getCompanyShellNavConfig();

/**
 * Company shell — AppSidebar + Officer/Admin-matching bordered content panel.
 * Single vertical scroll in the content pane (same approach as AdminAppShell).
 * Force-change password is gated by proxy (`gl_must_change_password`) + login redirect.
 */
export function CompanyAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-[#f7f7f7] font-sans md:flex-row">
      <AppSidebar config={companyNavConfig} profileHref="/company/account" />

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden py-2 pr-2">
        <div
          className={cn(
            'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#fffdfc] p-2 md:p-6',
            'border border-[#e8e8e8] border-l-2',
            'shadow-[2px_0_10px_-2px_rgb(0_0_0/10%),0_1px_3px_rgb(0_0_0/4%)]'
          )}
        >
          <CompanyTopHeader />
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pt-4 md:pt-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
