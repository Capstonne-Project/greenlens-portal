'use client';

import type { SystemSettingModule } from '@/lib/api/models/adminSystemSettings';

import { ADMIN_RAIL_SECTION_LABEL } from '@/components/admin/shared/adminUiTokens';

import { getSystemSettingsModuleIcon } from '@/lib/constants/adminSystemSettingsModulesUi';

import { filterVisibleSystemSettingModules } from '@/utils/adminSystemSettingsUi';

import { Input } from '@/components/ui/input';

import { cn } from '@/lib/utils';

import { Search } from 'lucide-react';

import Link from 'next/link';

import { useMemo, useState } from 'react';

interface SystemSettingsModuleSidebarProps {
  modules: SystemSettingModule[];

  activeModule: string;
}

export function SystemSettingsModuleSidebar({
  modules,

  activeModule,
}: SystemSettingsModuleSidebarProps) {
  const [query, setQuery] = useState('');

  const visibleModules = useMemo(() => filterVisibleSystemSettingModules(modules), [modules]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return visibleModules;

    return visibleModules.filter(mod => {
      const label = (mod.displayNameVi || mod.module).toLowerCase();

      const desc = (mod.descriptionVi ?? '').toLowerCase();

      const slug = (mod.routeSlug || mod.module).toLowerCase();

      return label.includes(q) || desc.includes(q) || slug.includes(q);
    });
  }, [visibleModules, query]);

  if (visibleModules.length === 0) {
    return (
      <aside className="py-2 text-sm text-muted-foreground lg:w-[220px] lg:shrink-0">
        Chưa có nhóm cấu hình.
      </aside>
    );
  }

  return (
    <aside className="flex shrink-0 flex-col lg:sticky lg:top-0 lg:w-[220px] lg:max-h-[calc(100dvh-11rem)] lg:self-start">
      <nav aria-label="Nhóm cấu hình hệ thống" className="flex min-h-0 flex-1 flex-col">
        <p className={cn('mb-3', ADMIN_RAIL_SECTION_LABEL)}>Nhóm cấu hình</p>

        <div className="relative mb-4">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />

          <Input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Lọc nhóm…"
            className="pl-9"
          />
        </div>

        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1 scrollbar-smooth">
          {filtered.length === 0 ? (
            <li className="py-4 text-xs text-muted-foreground">Không khớp nhóm nào.</li>
          ) : (
            filtered.map(mod => {
              const slug = mod.routeSlug || mod.module;

              const href = `/admin/system-settings/${encodeURIComponent(slug)}`;

              const isActive = activeModule === slug || activeModule === mod.module;

              const Icon = getSystemSettingsModuleIcon(mod.module, mod.routeSlug);

              const label = mod.displayNameVi || mod.module;

              return (
                <li key={mod.module}>
                  <Link
                    href={href}
                    title={mod.descriptionVi ?? label}
                    className={cn(
                      'group relative flex cursor-pointer items-center gap-2.5 py-2 pl-3 pr-2 transition-colors duration-200',

                      isActive ? 'text-emerald-900' : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span
                      className={cn(
                        'absolute bottom-1 left-0 top-1 w-0.5 rounded-full transition-colors',

                        isActive ? 'bg-emerald-600' : 'bg-transparent group-hover:bg-border'
                      )}
                      aria-hidden
                    />

                    <Icon
                      className={cn(
                        'size-4 shrink-0',

                        isActive
                          ? 'text-emerald-700'
                          : 'text-muted-foreground group-hover:text-foreground'
                      )}
                      strokeWidth={1.75}
                      aria-hidden
                    />

                    <span className="min-w-0 truncate text-sm font-medium leading-tight">
                      {label}
                    </span>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </nav>
    </aside>
  );
}
