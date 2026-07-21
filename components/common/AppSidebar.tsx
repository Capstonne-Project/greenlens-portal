'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import type { MapShellNavConfig, MapShellNavItem } from '@/lib/constants/mapShellNav';
import { getActiveNavId } from '@/lib/constants/mapShellNav';
import { APP_LOGO_MARK_SRC } from '@/lib/constants/brand';
import { useAuthStore } from '@/lib/store/authStore';
import { MapSidebarUserProfile } from '@/components/common/SidebarUserProfile';
import FilledBellIcon from '@/components/ui/filled-bell-icon';
import { cn } from '@/lib/utils';

type AppSidebarProps = {
  config: MapShellNavConfig;
};

const ICON_CLASS = 'h-5 w-5 shrink-0';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'GreenLens';

function NavIcon({ item }: { item: MapShellNavItem }) {
  if (item.animatedIcon === 'filled-bell') {
    return <FilledBellIcon size={20} color="currentColor" className={ICON_CLASS} />;
  }
  if (item.icon) {
    return <FontAwesomeIcon icon={item.icon} className={ICON_CLASS} />;
  }
  return null;
}

function isInSection(path: string, item: MapShellNavItem): boolean {
  if (!item.children?.length) return false;
  if (path === item.href) return true;
  return item.children.some(c => path === c.href || path.startsWith(`${c.href}/`));
}

function NavDropdown({
  item,
  activeId,
  pathname,
}: {
  item: MapShellNavItem;
  activeId: string | null;
  pathname: string;
}) {
  const { open: sidebarOpen, animate } = useSidebar();
  const path = pathname.split('?')[0] ?? pathname;
  const inSection = isInSection(path, item);
  const parentActive = activeId === item.id;
  const rowActive = parentActive || inSection;
  const showLabel = !animate || sidebarOpen;
  const collapsedActive = rowActive && !showLabel;
  const [dropOpen, setDropOpen] = useState(inSection);
  const [lastPath, setLastPath] = useState(path);

  if (lastPath !== path) {
    setLastPath(path);
    setDropOpen(inSection);
  }

  return (
    <div>
      <div
        className={cn(
          'group/navrow flex items-center rounded-lg border transition-colors',
          rowActive && showLabel
            ? 'border-neutral-100 bg-white text-neutral-900 shadow-[0_1px_2px_rgb(15_23_42/5%)]'
            : 'border-transparent text-neutral-600 hover:bg-black/[0.03] hover:text-neutral-800',
          collapsedActive && 'text-neutral-900 shadow-none'
        )}
      >
        <Link
          href={item.href}
          aria-current={parentActive ? 'page' : undefined}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-inherit no-underline',
            rowActive && 'font-medium'
          )}
        >
          <span
            className={cn(
              'relative flex size-5 shrink-0 items-center justify-center [&>svg]:size-5',
              rowActive ? 'text-neutral-900' : 'text-neutral-600'
            )}
          >
            {collapsedActive ? (
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-neutral-100 bg-white shadow-[0_1px_2px_rgb(15_23_42/5%)]"
              />
            ) : null}
            <span className="relative z-1">
              <NavIcon item={item} />
            </span>
          </span>
          <motion.span
            initial={false}
            animate={{ opacity: showLabel ? 1 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className={cn(
              'inline-block text-sm whitespace-pre transition-transform duration-150 group-hover/navrow:translate-x-1',
              !showLabel && 'pointer-events-none'
            )}
          >
            {item.label}
          </motion.span>
        </Link>

        {/* Always mounted — opacity only (no remount layout jump) */}
        <button
          type="button"
          className={cn(
            'mr-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-neutral-500 transition-opacity duration-200 hover:text-neutral-800',
            showLabel ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          onClick={() => setDropOpen(v => !v)}
          aria-expanded={dropOpen}
          aria-hidden={!showLabel}
          tabIndex={showLabel ? undefined : -1}
          aria-label={dropOpen ? `Thu gọn ${item.label}` : `Mở rộng ${item.label}`}
        >
          <FontAwesomeIcon
            icon={faChevronDown}
            className={cn('size-3 transition-transform duration-200', dropOpen && 'rotate-180')}
          />
        </button>
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-200',
          sidebarOpen && dropOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-0.5 py-1 pr-1 pl-7">
            {item.children?.map(child => {
              const childActive = activeId === child.id;
              return (
                <Link
                  key={child.id}
                  href={child.href}
                  className={cn(
                    'rounded-lg border px-2.5 py-1.5 text-[13px] font-medium no-underline transition-colors',
                    childActive
                      ? 'border-neutral-100 bg-white text-neutral-900 shadow-[0_1px_2px_rgb(15_23_42/5%)]'
                      : 'border-transparent text-neutral-600 hover:bg-black/[0.03] hover:text-neutral-800'
                  )}
                  aria-current={childActive ? 'page' : undefined}
                  tabIndex={sidebarOpen && dropOpen ? undefined : -1}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Single logo row — no Logo/LogoIcon swap (remount causes jump) */
function SidebarLogo() {
  const { open, animate } = useSidebar();
  const showLabel = !animate || open;

  return (
    <Link
      href="/"
      className="relative z-20 flex items-center gap-2 px-2 py-2 text-sm font-normal text-black no-underline"
    >
      <div className="flex size-5 shrink-0 items-center justify-center">
        <Image
          src={APP_LOGO_MARK_SRC}
          alt=""
          width={20}
          height={20}
          priority
          className="object-contain"
          unoptimized
        />
      </div>
      <motion.span
        initial={false}
        animate={{ opacity: showLabel ? 1 : 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'inline-block font-medium whitespace-pre text-black dark:text-white',
          !showLabel && 'pointer-events-none'
        )}
      >
        {APP_NAME}
      </motion.span>
    </Link>
  );
}

export function AppSidebar({ config }: AppSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const activeId = getActiveNavId(pathname, config);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const { notifications, settings } = config.systemNav;

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        {/* No overflow-x here — it clips to the content box (~28px) and cuts collapsed selected chips.
            Label wipe + chip bounds are handled by DesktopSidebar overflow-x-hidden (full 60px box). */}
        <div className="flex min-h-0 flex-1 flex-col">
          <SidebarLogo />
          <nav className="mt-8 flex flex-col gap-2" aria-label="Menu chính">
            {config.mainNav.map(item =>
              item.children?.length ? (
                <NavDropdown key={item.id} item={item} activeId={activeId} pathname={pathname} />
              ) : (
                <SidebarLink
                  key={item.id}
                  link={{
                    label: item.label,
                    href: item.href,
                    icon: <NavIcon item={item} />,
                  }}
                  active={activeId === item.id}
                />
              )
            )}
          </nav>
        </div>

        <div className="flex flex-col gap-2">
          <SidebarLink
            link={{
              label: notifications.label,
              href: notifications.href,
              icon: <NavIcon item={notifications} />,
            }}
            active={activeId === notifications.id}
          />
          {!isAuthenticated && (
            <SidebarLink
              link={{
                label: settings.label,
                href: settings.href,
                icon: <NavIcon item={settings} />,
              }}
              active={activeId === settings.id}
            />
          )}
          {isAuthenticated ? (
            <>
              <Separator className="mx-2 my-1 bg-neutral-200 dark:bg-neutral-700" />
              <MapSidebarUserProfile expanded={open} />
            </>
          ) : null}
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
