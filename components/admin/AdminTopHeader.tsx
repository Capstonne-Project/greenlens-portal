'use client';

import { AdminOverviewHeaderBar } from '@/components/admin/overview/AdminOverviewHeaderBar';

import { ADMIN_PAGE_DESCRIPTION, ADMIN_PAGE_TITLE } from '@/components/admin/shared/adminUiTokens';

import { WasteTagsHeaderStats } from '@/components/admin/waste-tags/WasteTagsHeaderStats';

import { getAdminPageMeta } from '@/lib/constants/adminPageMeta';

import { cn } from '@/lib/utils';

import { usePathname } from 'next/navigation';

export function AdminTopHeader() {
  const pathname = usePathname();

  const { title, description, icon: Icon } = getAdminPageMeta(pathname);

  const isOverviewTab = pathname === '/admin';

  const isWasteTagsTab = pathname === '/admin/waste-tags';

  return (
    <header className="shrink-0 border-b border-border bg-app-panel pb-2">
      <div className="pb-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-emerald-700">
            <Icon className="size-7" aria-hidden />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              <h1 className={cn(ADMIN_PAGE_TITLE)}>{title}</h1>

              {isWasteTagsTab ? <WasteTagsHeaderStats /> : null}
            </div>

            <p className={ADMIN_PAGE_DESCRIPTION}>{description}</p>
          </div>
        </div>
      </div>

      {isOverviewTab ? <AdminOverviewHeaderBar /> : null}
    </header>
  );
}
