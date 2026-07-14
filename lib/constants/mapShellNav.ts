import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBuilding,
  faClipboardCheck,
  faClipboardList,
  faEarthAmericas,
  faFileLines,
  faGaugeHigh,
  faGear,
  faRoute,
} from '@fortawesome/free-solid-svg-icons';
import { parseOfficerApiRole } from '@/lib/constants/officerRoles';
import type { UserRole } from '@/lib/constants/systemRoles';

export type MapShellNavChildItem = {
  id: string;
  label: string;
  href: string;
};

export type MapShellAnimatedIcon = 'filled-bell';

export type MapShellNavItem = {
  id: string;
  label: string;
  href: string;
  icon?: IconDefinition;
  animatedIcon?: MapShellAnimatedIcon;
  /** Mục con trong sidebar (dropdown) — LEO Phân công. */
  children?: MapShellNavChildItem[];
};

export type MapShellBrand = {
  name: string;
  tagline: string;
};

export type MapShellSystemNav = {
  notifications: MapShellNavItem;
  settings: MapShellNavItem;
};

export type MapShellNavConfig = {
  brand: MapShellBrand;
  mainNav: MapShellNavItem[];
  systemNav: MapShellSystemNav;
};

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'GreenLens';

const SYSTEM_NAV: MapShellSystemNav = {
  notifications: {
    id: 'notifications',
    label: 'Thông báo',
    href: '/officer/dashboard',
    animatedIcon: 'filled-bell',
  },
  settings: {
    id: 'settings',
    label: 'Cài đặt',
    href: '/officer/profile',
    icon: faGear,
  },
};

const NAV_ITEMS = {
  map: {
    id: 'map',
    label: 'Bản đồ',
    href: '/officer/map',
    icon: faEarthAmericas,
  },
  overview: {
    id: 'overview',
    label: 'Tổng quan',
    href: '/officer/dashboard',
    icon: faGaugeHigh,
  },
  verify: {
    id: 'verify',
    label: 'Xác minh',
    href: '/officer/verify',
    icon: faClipboardCheck,
  },
  assign: {
    id: 'assign',
    label: 'Phân công',
    href: '/officer/assign',
    icon: faClipboardList,
  },
  tracking: {
    id: 'tracking',
    label: 'Theo dõi xử lý',
    href: '/officer/tracking',
    icon: faRoute,
  },
  companies: {
    id: 'companies',
    label: 'Doanh nghiệp',
    href: '/officer/companies',
    icon: faBuilding,
  },
  reports: {
    id: 'reports',
    label: 'Báo cáo',
    href: '/officer/reports',
    icon: faFileLines,
  },
} as const satisfies Record<string, MapShellNavItem>;

const BRAND_DEO: MapShellBrand = {
  name: APP_NAME,
  tagline: 'Hệ thống điều hành',
};

const BRAND_LEO: MapShellBrand = {
  name: APP_NAME,
  tagline: 'Hệ thống điều hành',
};

const BRAND_DEFAULT: MapShellBrand = {
  name: APP_NAME,
  tagline: 'Hệ thống điều hành',
};

/** Sidebar map shell — nav chính theo role (DEO / LEO). */
export function getMapShellNavForRole(
  systemRole: UserRole | string | undefined
): MapShellNavConfig {
  const role = parseOfficerApiRole(systemRole);

  const mainNav: MapShellNavItem[] = [NAV_ITEMS.map, NAV_ITEMS.overview];

  if (role === 'DEO') {
    mainNav.push(NAV_ITEMS.reports, NAV_ITEMS.companies);
  } else if (role === 'LEO') {
    mainNav.push(
      NAV_ITEMS.verify,
      {
        ...NAV_ITEMS.assign,
        children: [
          { id: 'assign-teams', label: 'Đội xử lý', href: '/officer/assign/teams' },
          { id: 'assign-members', label: 'Thành viên', href: '/officer/assign/members' },
        ],
      },
      NAV_ITEMS.tracking
    );
  }

  const brand = role === 'LEO' ? BRAND_LEO : role === 'DEO' ? BRAND_DEO : BRAND_DEFAULT;

  return {
    brand,
    mainNav,
    systemNav: SYSTEM_NAV,
  };
}

/** Mọi route `/officer/*` dùng chung map shell (LEO + DEO). */
export function isMapShellRoute(pathname: string): boolean {
  return pathname === '/officer' || pathname.startsWith('/officer/');
}

export function getActiveNavId(pathname: string, config: MapShellNavConfig): string | null {
  const path = pathname.split('?')[0] ?? pathname;

  for (const item of config.mainNav) {
    if (item.children?.length) {
      const child = item.children.find(c => path === c.href || path.startsWith(`${c.href}/`));
      if (child) return child.id;
      if (path === item.href) return item.id;
      continue;
    }
    if (path === item.href || path.startsWith(`${item.href}/`)) {
      return item.id;
    }
  }

  const system = [config.systemNav.notifications, config.systemNav.settings];
  const systemMatch = system.find(item => path === item.href || path.startsWith(`${item.href}/`));
  return systemMatch?.id ?? null;
}
