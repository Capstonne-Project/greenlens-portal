'use client';

import { AdminNotificationBell } from '@/components/admin/notifications/AdminNotificationBell';
import { getAdminPageTitle } from '@/lib/constants/adminPageTitles';
import { useUiStore } from '@/lib/store/uiStore';
import { Globe, Moon, Sun } from 'lucide-react';
import { usePathname } from 'next/navigation';

const iconButtonClass =
  'inline-flex size-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

export function AdminTopHeader() {
  const pathname = usePathname();
  const title = getAdminPageTitle(pathname);
  const theme = useUiStore(s => s.theme);
  const toggleTheme = useUiStore(s => s.toggleTheme);
  const locale = useUiStore(s => s.locale);
  const toggleLocale = useUiStore(s => s.toggleLocale);

  const nextLocaleLabel = locale === 'vi' ? 'EN' : 'VN';

  return (
    <header className="shrink-0 border-b border-[#e8e8e8] bg-[#fffdfc] pb-3">
      <div className="flex h-14 items-center justify-between gap-4 md:h-16">
        <HeaderBrand title={title} />

        <div className="flex shrink-0 items-center gap-2 border-l border-[#e8e8e8] pl-3 md:gap-2.5 md:pl-4">
          <AdminNotificationBell />
          <button
            type="button"
            onClick={toggleLocale}
            className={`${iconButtonClass} gap-1.5 px-2.5 text-xs font-semibold tracking-wide`}
            aria-label={`Đổi ngôn ngữ, hiện tại ${locale === 'vi' ? 'Tiếng Việt' : 'English'}`}
          >
            <Globe className="size-[18px]" aria-hidden />
            <span>{nextLocaleLabel}</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className={iconButtonClass}
            aria-label={theme === 'dark' ? 'Bật giao diện sáng' : 'Bật giao diện tối'}
          >
            {theme === 'dark' ? (
              <Sun className="size-[18px]" aria-hidden />
            ) : (
              <Moon className="size-[18px]" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function HeaderBrand({ title }: { title: string }) {
  return (
    <h1 className="min-w-0 truncate text-sm font-semibold tracking-tight text-foreground md:text-base">
      {title}
    </h1>
  );
}
