'use client';

import type { SystemSettingModule } from '@/lib/api/models/adminSystemSettings';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SystemSettingsModuleSidebarProps {
  modules: SystemSettingModule[];
  activeModule: string;
}

export function SystemSettingsModuleSidebar({
  modules,
  activeModule,
}: SystemSettingsModuleSidebarProps) {
  if (modules.length === 0) {
    return (
      <aside className="rounded-2xl border border-border/70 bg-white p-4 text-sm text-muted-foreground">
        Chưa có module cấu hình.
      </aside>
    );
  }

  return (
    <nav
      aria-label="Module cấu hình hệ thống"
      className="rounded-2xl border border-border/70 bg-white p-2 shadow-sm"
    >
      <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Nhóm cấu hình
      </p>
      <ul className="space-y-0.5">
        {modules.map(mod => {
          const slug = mod.routeSlug || mod.module;
          const href = `/admin/system-settings/${encodeURIComponent(slug)}`;
          const isActive = activeModule === slug || activeModule === mod.module;

          return (
            <li key={mod.module}>
              <Link
                href={href}
                className={cn(
                  'block rounded-xl px-3 py-2.5 transition',
                  isActive
                    ? 'bg-emerald-50 font-semibold text-emerald-900 ring-1 ring-emerald-200'
                    : 'text-foreground hover:bg-muted/60'
                )}
              >
                <span className="text-sm">{mod.displayNameVi || mod.module}</span>
                {mod.descriptionVi ? (
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground line-clamp-2">
                    {mod.descriptionVi}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
