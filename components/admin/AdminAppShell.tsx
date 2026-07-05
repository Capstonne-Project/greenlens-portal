'use client';

import { AdminSidebarNav } from '@/components/admin/AdminSidebarNav';
import { AdminSidebarProfile } from '@/components/admin/AdminSidebarProfile';
import { AdminTopHeader } from '@/components/admin/AdminTopHeader';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/lib/store/uiStore';

export function AdminAppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useUiStore(s => s.sidebarCollapsed);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 ease-out md:flex',
          collapsed ? 'w-[4.5rem]' : 'w-64'
        )}
      >
        <AdminSidebarNav collapsed={collapsed} />
        <AdminSidebarProfile collapsed={collapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopHeader />
        <main className="w-full min-w-0 flex-1 px-4 py-5 md:px-5 md:py-6">{children}</main>
      </div>
    </div>
  );
}
