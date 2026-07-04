'use client';

import '@/lib/external/fontawesome';
import { useEffect, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faRightToBracket, faThumbtack } from '@fortawesome/free-solid-svg-icons';
import type { MapShellNavConfig, MapShellNavItem } from '@/lib/constants/mapShellNav';
import { getActiveNavId } from '@/lib/constants/mapShellNav';
import { APP_LOGO_MARK_SRC } from '@/lib/constants/brand';
import { useAuthStore } from '@/lib/store/authStore';
import {
  selectSidebarCollapsedWidth,
  selectSidebarExpandedWidth,
  selectSidebarExpanded,
  useMapShellStore,
} from '@/lib/store/mapShellStore';
import {
  mapNavItemClass,
  mapNavItemIconClass,
  mapNavItemIconRailClass,
  mapNavItemLabelClass,
  mapNavItemSurfaceClass,
  mapNavChildConnectorClass,
  mapNavChildLinkClass,
  mapNavChildListClass,
  mapNavChildPanelClass,
  mapNavChildPanelInnerClass,
  mapNavDropdownChevronBtnClass,
  mapNavDropdownChevronIconClass,
  mapSidebarAsideClass,
  mapSidebarBrandClass,
  SIDEBAR_CSS_VARS,
  mapSidebarLogoClass,
  mapSidebarPinClass,
  mapSidebarPinIconClass,
  mapSidebarProfileFooterClass,
} from '@/lib/map/mapShellStyles';
import { MapSidebarUserProfile } from './MapSidebarUserProfile';
import { cn } from '@/lib/utils';

type MapLeftSidebarProps = {
  config: MapShellNavConfig;
};

function NavItem({
  item,
  active,
  expanded,
}: {
  item: MapShellNavItem;
  active: boolean;
  expanded: boolean;
}) {
  const opts = { active, expanded };
  return (
    <Link
      href={item.href}
      className={mapNavItemClass(opts)}
      aria-current={active ? 'page' : undefined}
      title={expanded ? undefined : item.label}
    >
      <span className={mapNavItemSurfaceClass(opts)}>
        <span className={mapNavItemIconRailClass()} aria-hidden>
          <FontAwesomeIcon icon={item.icon} className={mapNavItemIconClass()} />
        </span>
        <span className={mapNavItemLabelClass(expanded, active)} aria-hidden={!expanded}>
          {item.label}
        </span>
      </span>
    </Link>
  );
}

function isAssignSectionPath(path: string, item: MapShellNavItem): boolean {
  if (!item.children?.length) return false;
  if (path === item.href) return true;
  return item.children.some(c => path === c.href || path.startsWith(`${c.href}/`));
}

function NavDropdownGroup({
  item,
  activeId,
  expanded,
  pathname,
}: {
  item: MapShellNavItem;
  activeId: string | null;
  expanded: boolean;
  pathname: string;
}) {
  const path = pathname.split('?')[0] ?? pathname;
  const inSection = isAssignSectionPath(path, item);
  const parentActive = activeId === item.id;
  const [open, setOpen] = useState(inSection);
  const [lastPath, setLastPath] = useState(path);

  if (lastPath !== path) {
    setLastPath(path);
    setOpen(inSection);
  }

  if (!item.children?.length || !expanded) {
    return <NavItem item={item} active={parentActive} expanded={expanded} />;
  }

  const opts = { active: parentActive, expanded };

  return (
    <div className="w-full">
      <div className={mapNavItemClass(opts)} title={item.label}>
        <span className={cn(mapNavItemSurfaceClass(opts), expanded && 'w-full pr-1')}>
          <Link
            href={item.href}
            className="relative z-[1] flex min-w-0 flex-1 items-center gap-[0.62rem] text-inherit no-underline"
            aria-current={parentActive ? 'page' : undefined}
          >
            <span className={mapNavItemIconRailClass()} aria-hidden>
              <FontAwesomeIcon icon={item.icon} className={mapNavItemIconClass()} />
            </span>
            <span className={mapNavItemLabelClass(expanded, opts.active)} aria-hidden={!expanded}>
              {item.label}
            </span>
          </Link>
          <button
            type="button"
            className={mapNavDropdownChevronBtnClass()}
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-label={open ? `Thu gọn ${item.label}` : `Mở rộng ${item.label}`}
          >
            <FontAwesomeIcon
              icon={faChevronDown}
              className={mapNavDropdownChevronIconClass(open)}
            />
          </button>
        </span>
      </div>

      <div className={mapNavChildPanelClass(open)} aria-hidden={!open}>
        <div className={mapNavChildPanelInnerClass()}>
          <div className={mapNavChildListClass()}>
            <span className={mapNavChildConnectorClass()} aria-hidden />
            {item.children.map(child => {
              const childActive = activeId === child.id;
              return (
                <Link
                  key={child.id}
                  href={child.href}
                  className={mapNavChildLinkClass({ active: childActive })}
                  aria-current={childActive ? 'page' : undefined}
                  tabIndex={open ? undefined : -1}
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

function LoginNavItem({ expanded }: { expanded: boolean }) {
  const opts = { expanded, loginCta: true };
  return (
    <Link
      href="/login"
      className={mapNavItemClass(opts)}
      title={expanded ? undefined : 'Đăng nhập'}
      aria-label="Đăng nhập"
    >
      <span className={mapNavItemSurfaceClass(opts)}>
        <span className={mapNavItemIconRailClass()} aria-hidden>
          <FontAwesomeIcon icon={faRightToBracket} className={mapNavItemIconClass()} />
        </span>
        <span className={mapNavItemLabelClass(expanded)} aria-hidden={!expanded}>
          Đăng nhập
        </span>
      </span>
    </Link>
  );
}

export function MapLeftSidebar({ config }: MapLeftSidebarProps) {
  const pathname = usePathname();
  const activeId = getActiveNavId(pathname, config);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isPinned = useMapShellStore(s => s.isPinned);
  const expanded = useMapShellStore(selectSidebarExpanded);
  const collapsedWidth = useMapShellStore(selectSidebarCollapsedWidth);
  const expandedWidth = useMapShellStore(selectSidebarExpandedWidth);
  const togglePin = useMapShellStore(s => s.togglePin);
  const setHovered = useMapShellStore(s => s.setHovered);
  const setViewportWidth = useMapShellStore(s => s.setViewportWidth);

  useEffect(() => {
    const updateViewport = () => setViewportWidth(window.innerWidth);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, [setViewportWidth]);

  const handleMouseLeave = () => {
    if (!isPinned) {
      setHovered(false);
    }
  };

  const { notifications, settings } = config.systemNav;

  return (
    <aside
      data-map-sidebar
      className={mapSidebarAsideClass(expanded, isPinned)}
      style={
        {
          ...SIDEBAR_CSS_VARS,
          '--sidebar-collapsed-width': `${collapsedWidth}px`,
          '--sidebar-expanded-width': `${expandedWidth}px`,
        } as CSSProperties
      }
      aria-label="Điều hướng bản đồ"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {expanded ? (
        <button
          type="button"
          className={mapSidebarPinClass(isPinned)}
          onClick={togglePin}
          aria-pressed={isPinned}
          aria-label={isPinned ? 'Bỏ ghim sidebar' : 'Ghim sidebar'}
          title={isPinned ? 'Bỏ ghim' : 'Ghim sidebar'}
        >
          <FontAwesomeIcon icon={faThumbtack} className={mapSidebarPinIconClass(isPinned)} />
        </button>
      ) : null}

      <div className={mapSidebarLogoClass(expanded)}>
        <div className="flex size-6 shrink-0 items-center justify-center text-white">
          <Image
            src={APP_LOGO_MARK_SRC}
            alt=""
            width={24}
            height={24}
            priority
            className="object-contain"
            unoptimized
          />
        </div>
        <div className={mapSidebarBrandClass(expanded)}>
          <span className="whitespace-nowrap text-base font-bold tracking-wide text-white">
            {config.brand.name}
          </span>
          <span className="whitespace-nowrap text-[11px] font-normal text-white/50">
            {config.brand.tagline}
          </span>
        </div>
      </div>

      <nav className="flex w-full flex-col pt-1" aria-label="Menu chính">
        {config.mainNav.map(item =>
          item.children?.length ? (
            <NavDropdownGroup
              key={item.id}
              item={item}
              activeId={activeId}
              expanded={expanded}
              pathname={pathname}
            />
          ) : (
            <NavItem key={item.id} item={item} active={activeId === item.id} expanded={expanded} />
          )
        )}
      </nav>

      <div className="mt-auto w-full">
        <div className="w-full border-t border-white/[0.08] py-1">
          <NavItem
            item={notifications}
            active={activeId === notifications.id}
            expanded={expanded}
          />
          {isAuthenticated ? null : (
            <>
              <LoginNavItem expanded={expanded} />
              <NavItem item={settings} active={activeId === settings.id} expanded={expanded} />
            </>
          )}
        </div>

        {isAuthenticated ? (
          <div className={mapSidebarProfileFooterClass(expanded)}>
            <MapSidebarUserProfile expanded={expanded} />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
