import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBell,
  faBuilding,
  faClipboardList,
  faEarthAmericas,
  faGaugeHigh,
  faGear,
} from '@fortawesome/free-solid-svg-icons';
import { parseOfficerApiRole } from '@/lib/constants/officerRoles';
import type { UserRole } from '@/lib/constants/systemRoles';

export type MapShellNavItem = {
  id: string;
  label: string;
  href: string;
  icon: IconDefinition;
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
    icon: faBell,
  },
  settings: {
    id: 'settings',
    label: 'Cài đặt',
    href: '/officer/profile',
    icon: faGear,
  },
};

const DEO_MAP_SHELL_NAV: MapShellNavConfig = {
  brand: {
    name: APP_NAME,
    tagline: 'Cổng điều hành sở TNMT',
  },
  mainNav: [
    { id: 'map', label: 'Bản đồ', href: '/officer/map', icon: faEarthAmericas },
    { id: 'overview', label: 'Tổng quan', href: '/officer/dashboard', icon: faGaugeHigh },
    {
      id: 'companies',
      label: 'Doanh nghiệp',
      href: '/officer/companies',
      icon: faBuilding,
    },
  ],
  systemNav: SYSTEM_NAV,
};

const LEO_MAP_SHELL_NAV: MapShellNavConfig = {
  brand: {
    name: APP_NAME,
    tagline: 'Cổng văn phòng MT phường',
  },
  mainNav: [
    { id: 'map', label: 'Bản đồ', href: '/officer/map', icon: faEarthAmericas },
    { id: 'assign', label: 'Phân công', href: '/officer/assign', icon: faClipboardList },
  ],
  systemNav: SYSTEM_NAV,
};

const DEFAULT_MAP_SHELL_NAV = DEO_MAP_SHELL_NAV;

export function getMapShellNavForRole(
  systemRole: UserRole | string | undefined
): MapShellNavConfig {
  const role = parseOfficerApiRole(systemRole);
  if (role === 'LEO') return LEO_MAP_SHELL_NAV;
  if (role === 'DEO') return DEO_MAP_SHELL_NAV;
  return DEFAULT_MAP_SHELL_NAV;
}

export function isMapShellRoute(pathname: string): boolean {
  return (
    pathname === '/officer/map' ||
    pathname.startsWith('/officer/map/') ||
    pathname === '/officer/dashboard' ||
    pathname.startsWith('/officer/dashboard/') ||
    pathname === '/officer/companies' ||
    pathname.startsWith('/officer/companies/')
  );
}

export function getActiveNavId(pathname: string, config: MapShellNavConfig): string | null {
  const all = [...config.mainNav, config.systemNav.notifications, config.systemNav.settings];
  const match = all.find(item => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.id ?? null;
}
