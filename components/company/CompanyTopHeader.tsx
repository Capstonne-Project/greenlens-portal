'use client';

import { NotificationHeaderBell } from '@/components/notification/NotificationHeaderBell';
import { CompanyOverviewHeaderBar } from '@/components/company/overview/CompanyOverviewHeaderBar';
import { getCompanyPageTitle } from '@/lib/constants/companyPageTitles';
import { useUiStore } from '@/lib/store/uiStore';
import { cn } from '@/lib/utils';
import { Globe, Moon, Sun } from 'lucide-react';
import { usePathname } from 'next/navigation';

const iconButtonBase =
  'inline-flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

export function CompanyTopHeader() {
  const pathname = usePathname();
  const title = getCompanyPageTitle(pathname);
  const isOverview = pathname === '/company';
  const theme = useUiStore(s => s.theme);
  const toggleTheme = useUiStore(s => s.toggleTheme);
  const locale = useUiStore(s => s.locale);
  const toggleLocale = useUiStore(s => s.toggleLocale);

  const nextLocaleLabel = locale === 'vi' ? 'EN' : 'VN';
  // Overview packs identity + filters into one row, so its chrome is slightly tighter.
  const iconButtonClass = cn(iconButtonBase, isOverview ? 'size-9 md:size-10' : 'size-10');
  const iconSize = isOverview ? 'size-4 md:size-[18px]' : 'size-[18px]';

  return (
    <header
      className={cn(
        'shrink-0 border-b border-[#e8e8e8] bg-[#fffdfc]',
        isOverview ? 'pb-2' : 'pb-3'
      )}
    >
      <div
        className={cn(
          'flex items-center',
          isOverview ? 'min-h-12 gap-2 md:min-h-14 md:gap-3' : 'h-14 justify-between gap-4 md:h-16'
        )}
      >
        {isOverview ? (
          <CompanyOverviewHeaderBar />
        ) : (
          <h1 className="min-w-0 truncate text-sm font-semibold tracking-tight text-foreground md:text-base">
            {title}
          </h1>
        )}

        <div
          className={cn(
            'flex shrink-0 items-center border-l border-[#e8e8e8]',
            isOverview ? 'gap-1.5 pl-2 md:gap-2 md:pl-3' : 'gap-2 pl-3 md:gap-2.5 md:pl-4'
          )}
        >
          <NotificationHeaderBell />
          <button
            type="button"
            onClick={toggleLocale}
            className={cn(
              iconButtonClass,
              'text-xs font-semibold tracking-wide',
              isOverview ? 'gap-1 px-2' : 'gap-1.5 px-2.5'
            )}
            aria-label={`Đổi ngôn ngữ, hiện tại ${locale === 'vi' ? 'Tiếng Việt' : 'English'}`}
          >
            <Globe className={iconSize} aria-hidden />
            <span>{nextLocaleLabel}</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className={iconButtonClass}
            aria-label={theme === 'dark' ? 'Bật giao diện sáng' : 'Bật giao diện tối'}
          >
            {theme === 'dark' ? (
              <Sun className={iconSize} aria-hidden />
            ) : (
              <Moon className={iconSize} aria-hidden />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
