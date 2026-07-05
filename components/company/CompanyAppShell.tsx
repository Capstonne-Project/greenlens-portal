'use client';

import { CompanyAmbient } from '@/components/company/shared/CompanyAmbient';
import { CompanySidebarNav } from '@/components/company/CompanySidebarNav';
import { CompanySidebarProfile } from '@/components/company/CompanySidebarProfile';
import { CompanyTopHeader } from '@/components/company/CompanyTopHeader';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/lib/store/uiStore';

export function CompanyAppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useUiStore(s => s.sidebarCollapsed);

  return (
    <div className="relative flex min-h-screen">
      <CompanyAmbient />
      <aside
        className={cn(
          'relative hidden shrink-0 flex-col border-r border-emerald-100/60 bg-white/75 backdrop-blur-md transition-[width] duration-200 ease-out dark:border-border dark:bg-card/80 md:flex',
          collapsed ? 'w-[4.5rem]' : 'w-64'
        )}
      >
        <CompanySidebarNav collapsed={collapsed} />
        <CompanySidebarProfile collapsed={collapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <CompanyTopHeader />
        <main className="w-full min-w-0 flex-1 px-4 py-5 md:px-5 md:py-6">{children}</main>
      </div>
    </div>
  );
}
