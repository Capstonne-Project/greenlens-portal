'use client';

import { AppSidebar } from '@/components/common/AppSidebar';
import { AdminTopHeader } from '@/components/admin/AdminTopHeader';
import { getAdminShellNavConfig } from '@/lib/constants/adminShellNav';
import { PROFILE_ROUTES } from '@/lib/constants/profilePortal';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const adminNavConfig = getAdminShellNavConfig();

/**
 * Admin shell — single vertical scroll in the content pane.
 * Does not nest MapShellContent's overflow-auto (that caused 2–3 scrollbars).
 */
export function AdminAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isViewportFitPage =
    pathname === '/admin' ||
    pathname === '/admin/notification-templates' ||
    pathname.startsWith('/admin/users');

  return (
    <div className="app-canvas flex h-dvh w-screen overflow-hidden font-sans md:flex-row">
      <AppSidebar
        config={adminNavConfig}
        profileHref={PROFILE_ROUTES.admin}
        settingsHref="/admin/settings"
      />

      <div className="app-shell-gutter">
        <div
          className={cn(
            'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-app-panel p-2 md:p-6',
            'border border-border border-l-2',
            'shadow-[2px_0_10px_-2px_rgb(0_0_0/10%),0_1px_3px_rgb(0_0_0/4%)]'
          )}
        >
          <AdminTopHeader />
          <div
            className={cn(
              'min-h-0 min-w-0 flex-1 overflow-x-hidden overscroll-contain',
              isViewportFitPage
                ? 'flex flex-col overflow-hidden pt-2 md:pt-3'
                : 'overflow-y-auto pt-4 md:pt-5'
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
