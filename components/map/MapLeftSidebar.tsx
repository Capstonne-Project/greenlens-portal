'use client';

import '@/lib/external/fontawesome';
import { useEffect, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightToBracket, faThumbtack } from '@fortawesome/free-solid-svg-icons';
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
  mapSidebarAsideClass,
  mapSidebarBrandClass,
  SIDEBAR_CSS_VARS,
  mapSidebarLogoClass,
  mapSidebarPinClass,
  mapSidebarPinIconClass,
  mapSidebarProfileFooterClass,
} from '@/lib/map/mapShellStyles';
import { MapSidebarUserProfile } from './MapSidebarUserProfile';

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
        {config.mainNav.map(item => (
          <NavItem key={item.id} item={item} active={activeId === item.id} expanded={expanded} />
        ))}
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
