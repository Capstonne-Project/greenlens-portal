'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ChevronDown } from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import type { MapShellNavConfig, MapShellNavItem } from '@/lib/constants/mapShellNav';
import { getBrandHomeHref, isFontAwesomeNavIcon } from '@/lib/constants/mapShellNav';
import { APP_LOGO_MARK_SRC, APP_NAME } from '@/lib/constants/brand';
import { useAuthStore } from '@/lib/store/authStore';
import { MapSidebarUserProfile } from '@/components/common/SidebarUserProfile';
import { PROFILE_ROUTES } from '@/lib/constants/profilePortal';
import { NotificationDrawer } from '@/components/notification/NotificationDrawer';
import { NotificationNavButton } from '@/components/notification/NotificationNavButton';
import FilledBellIcon from '@/components/ui/filled-bell-icon';
import { cn } from '@/lib/utils';

type AppSidebarProps = {
  config: MapShellNavConfig;
  /** Account page — `/{role}/settings/account`. */
  profileHref?: string;
  /** Settings shell — `/{role}/settings`. */
  settingsHref?: string;
};

const ICON_CLASS = 'h-5 w-5 shrink-0';

/**
 * Longest-href active match so `/admin` does not steal `/admin/reports`.
 * Keeps Officer routes correct (their hrefs are already non-prefix-colliding).
 */
function resolveActiveNavId(pathname: string, config: MapShellNavConfig): string | null {
  const path = pathname.split('?')[0] ?? pathname;
  type Cand = { id: string; href: string; rank: number };
  const cands: Cand[] = [];

  const pushMatch = (id: string, href: string, rank: number) => {
    if (path === href || path.startsWith(`${href}/`)) {
      cands.push({ id, href, rank });
    }
  };

  for (const item of config.mainNav) {
    if (item.children?.length) {
      for (const child of item.children) {
        pushMatch(child.id, child.href, 2);
      }
      pushMatch(item.id, item.href, 1);
      continue;
    }
    pushMatch(item.id, item.href, 1);
  }

  if (config.systemNav.notifications) {
    pushMatch(config.systemNav.notifications.id, config.systemNav.notifications.href, 1);
  }
  pushMatch(config.systemNav.settings.id, config.systemNav.settings.href, 1);

  if (!cands.length) return null;
  cands.sort((a, b) => b.href.length - a.href.length || b.rank - a.rank);
  return cands[0]?.id ?? null;
}

function NavIcon({ item }: { item: MapShellNavItem }) {
  if (item.animatedIcon === 'filled-bell') {
    return <FilledBellIcon size={20} color="currentColor" className={ICON_CLASS} />;
  }
  if (!item.icon) return null;
  if (isFontAwesomeNavIcon(item.icon)) {
    return <FontAwesomeIcon icon={item.icon} className={ICON_CLASS} />;
  }
  const LineIcon = item.icon;
  // stroke 1.6 — mảnh hơn default 2 của lucide, khớp tông line-art của sidebar kính mờ.
  return <LineIcon className={ICON_CLASS} strokeWidth={1.6} />;
}

/**
 * Section label tĩnh (kiểu PROLOGISTIC "LOGISTICS / FINANCE") — không bấm được.
 * Collapse: opacity + height + margin co về 0 (overflow hidden) để icon sát nhau mượt;
 * expanded: hiện lại khoảng cách trên (trừ mục đầu).
 */
function NavSectionLabel({
  label,
  withTopSpacing = true,
}: {
  label: string;
  /** false cho label đầu tiên (tương đương first:mt-0). */
  withTopSpacing?: boolean;
}) {
  const { open, animate } = useSidebar();
  const showLabel = !animate || open;

  return (
    <motion.div
      initial={false}
      animate={{
        opacity: showLabel ? 1 : 0,
        height: showLabel ? 'auto' : 0,
        marginTop: showLabel && withTopSpacing ? 8 : 0,
      }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden={!showLabel}
      className={cn(
        'overflow-hidden px-2 text-[11px] font-semibold tracking-[0.08em] whitespace-pre',
        'text-neutral-400 uppercase select-none',
        !showLabel && 'pointer-events-none'
      )}
    >
      {label}
    </motion.div>
  );
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
          'group/navrow flex items-center rounded-full border transition-colors',
          rowActive && showLabel
            ? 'border-transparent bg-white text-neutral-900 shadow-[0_1px_2px_rgb(15_23_42/8%),0_1px_6px_rgb(15_23_42/6%)]'
            : 'border-transparent text-neutral-600 hover:bg-white/60 hover:text-neutral-800',
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
                className="pointer-events-none absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-transparent bg-white shadow-[0_1px_2px_rgb(15_23_42/8%),0_1px_6px_rgb(15_23_42/6%)]"
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
          <ChevronDown
            strokeWidth={1.6}
            className={cn('size-3.5 transition-transform duration-200', dropOpen && 'rotate-180')}
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
                    'rounded-full border px-3 py-1.5 text-[13px] font-medium no-underline transition-colors',
                    childActive
                      ? 'border-transparent bg-white text-neutral-900 shadow-[0_1px_2px_rgb(15_23_42/8%),0_1px_6px_rgb(15_23_42/6%)]'
                      : 'border-transparent text-neutral-600 hover:bg-white/60 hover:text-neutral-800'
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
function SidebarLogo({ homeHref }: { homeHref: string }) {
  const { open, animate } = useSidebar();
  const showLabel = !animate || open;

  return (
    <Link
      href={homeHref}
      className="relative z-20 flex items-center gap-2 px-2 py-2 text-sm font-normal text-black no-underline"
      aria-label={`${APP_NAME} — trang chủ`}
    >
      <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full">
        <Image
          src={APP_LOGO_MARK_SRC}
          alt=""
          width={28}
          height={28}
          priority
          className="size-full object-cover"
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

export function AppSidebar({
  config,
  profileHref = PROFILE_ROUTES.officer,
  settingsHref = '/officer/settings',
}: AppSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const activeId = resolveActiveNavId(pathname, config);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const notifications = config.systemNav.notifications;
  const { settings } = config.systemNav;
  const brandHomeHref = getBrandHomeHref(config);
  const hasFooterNavAboveProfile = Boolean(notifications) || !isAuthenticated;

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-4">
        {/* Top scrolls when Users (or any) dropdown expands — never paint over systemNav. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SidebarLogo homeHref={brandHomeHref} />
          <nav
            className="mt-8 flex min-h-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto scrollbar-hide"
            aria-label="Menu chính"
          >
            {config.mainNav.map((item, index) => (
              <div key={item.id} className="flex flex-col">
                {item.sectionLabel ? (
                  <NavSectionLabel label={item.sectionLabel} withTopSpacing={index > 0} />
                ) : null}
                {item.children?.length ? (
                  <NavDropdown item={item} activeId={activeId} pathname={pathname} />
                ) : (
                  <SidebarLink
                    link={{
                      label: item.label,
                      href: item.href,
                      icon: <NavIcon item={item} />,
                      badge: item.badge,
                    }}
                    active={activeId === item.id}
                  />
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Nền mờ riêng để nav cuộn phía sau không "đè" lên footer, vẫn thấy lớp glass. */}
        <div className="sidebar-footer-glass relative z-10 flex shrink-0 flex-col gap-2 overflow-visible border-t border-slate-900/6 pt-2">
          {notifications ? (
            <NotificationNavButton
              label={notifications.label}
              icon={<NavIcon item={notifications} />}
              active={activeId === notifications.id}
            />
          ) : null}
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
              {hasFooterNavAboveProfile ? (
                <Separator className="mx-2 my-1 bg-neutral-200 dark:bg-neutral-700" />
              ) : null}
              <MapSidebarUserProfile
                expanded={open}
                profileHref={profileHref}
                settingsHref={settingsHref}
              />
            </>
          ) : null}
        </div>
      </SidebarBody>
      {notifications ? <NotificationDrawer /> : null}
    </Sidebar>
  );
}
