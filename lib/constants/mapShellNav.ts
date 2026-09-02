import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  Building2,
  ClipboardCheck,
  ClipboardList,
  Copy,
  FileText,
  Gauge,
  Globe2,
  HandHeart,
  History,
  ReceiptText,
  RotateCcw,
  Route,
  Settings,
  Users,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants/brand';
import { parseOfficerApiRole } from '@/lib/constants/officerRoles';
import type { UserRole } from '@/lib/constants/systemRoles';

export type MapShellNavChildItem = {
  id: string;
  label: string;
  href: string;
};

export type MapShellAnimatedIcon = 'filled-bell';

/**
 * Icon line-art (lucide) — stroke đồng nhất, hợp tông sidebar kính mờ.
 * `IconDefinition` (FontAwesome solid) vẫn được nhận cho các shell chưa đổi.
 */
export type MapShellLineIcon = React.ComponentType<{
  className?: string;
  strokeWidth?: number | string;
}>;

/** FontAwesome `IconDefinition` là plain object có `iconName`; lucide là component. */
export function isFontAwesomeNavIcon(
  icon: IconDefinition | MapShellLineIcon
): icon is IconDefinition {
  return typeof icon === 'object' && icon !== null && 'iconName' in icon;
}

export type MapShellNavItem = {
  id: string;
  label: string;
  href: string;
  icon?: IconDefinition | MapShellLineIcon;
  animatedIcon?: MapShellAnimatedIcon;
  /** Optional count badge (e.g. queue / unread). */
  badge?: number;
  /** Mục con trong sidebar (dropdown) — giữ type; hiện LEO không dùng. */
  children?: MapShellNavChildItem[];
  /**
   * Section label tĩnh (kiểu "LOGISTICS / FINANCE") render NGAY TRÊN item này.
   * Không phải nav bấm được — chỉ là tiêu đề phân vùng. Dùng chung cho mọi role qua AppSidebar.
   */
  sectionLabel?: string;
};

export type MapShellBrand = {
  name: string;
  tagline: string;
};

export type MapShellSystemNav = {
  /** Omit for shells without in-app notifications (e.g. admin). */
  notifications?: MapShellNavItem;
  settings: MapShellNavItem;
};

export type MapShellNavConfig = {
  brand: MapShellBrand;
  mainNav: MapShellNavItem[];
  systemNav: MapShellSystemNav;
};

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
    href: '/officer/settings',
    icon: Settings,
  },
};

const NAV_ITEMS = {
  map: {
    id: 'map',
    label: 'Bản đồ',
    href: '/officer/map',
    icon: Globe2,
  },
  overview: {
    id: 'overview',
    label: 'Tổng quan',
    href: '/officer/dashboard',
    icon: Gauge,
  },
  verify: {
    id: 'verify',
    label: 'Xác minh',
    href: '/officer/verify',
    icon: ClipboardCheck,
  },
  assign: {
    id: 'assign',
    label: 'Phân công',
    href: '/officer/assign',
    icon: ClipboardList,
  },
  tracking: {
    id: 'tracking',
    label: 'Theo dõi xử lý',
    href: '/officer/tracking',
    icon: Route,
  },
  reopen: {
    id: 'reopen',
    label: 'Xử lý lại',
    href: '/officer/reopen',
    icon: RotateCcw,
  },
  community: {
    id: 'community',
    label: 'Dọn cộng đồng',
    href: '/officer/community',
    icon: HandHeart,
  },
  duplicates: {
    id: 'duplicates',
    label: 'Trùng lặp',
    href: '/officer/duplicates',
    icon: Copy,
  },
  recurrence: {
    id: 'recurrence',
    label: 'Tái diễn',
    href: '/officer/recurrence',
    icon: History,
  },
  inspections: {
    id: 'inspections',
    label: 'Hồ sơ xử phạt',
    href: '/officer/inspections',
    icon: ReceiptText,
  },
  workforce: {
    id: 'workforce',
    label: 'Đội ngũ',
    href: '/officer/workforce',
    icon: Users,
  },
  companies: {
    id: 'companies',
    label: 'Doanh nghiệp',
    href: '/officer/companies',
    icon: Building2,
  },
  myCompanies: {
    id: 'my-companies',
    label: 'Doanh nghiệp',
    href: '/officer/my-companies',
    icon: Building2,
  },
  reports: {
    id: 'reports',
    label: 'Báo cáo',
    href: '/officer/reports',
    icon: FileText,
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

/** Gắn section label tĩnh lên item (label render phía trên item trong sidebar). */
function withSection(item: MapShellNavItem, sectionLabel: string): MapShellNavItem {
  return { ...item, sectionLabel };
}

/**
 * Home href cho logo/brand sidebar:
 * ưu tiên nav Bản đồ (`id: map`), không có thì Tổng quan (`overview` | `dashboard`),
 * cuối cùng item đầu trong mainNav.
 */
export function getBrandHomeHref(config: MapShellNavConfig): string {
  const mapItem = config.mainNav.find(item => item.id === 'map');
  if (mapItem) return mapItem.href;

  const overviewItem = config.mainNav.find(
    item => item.id === 'overview' || item.id === 'dashboard'
  );
  if (overviewItem) return overviewItem.href;

  return config.mainNav[0]?.href ?? '/';
}

/** Sidebar map shell — nav chính theo role (DEO / LEO). */
export function getMapShellNavForRole(
  systemRole: UserRole | string | undefined
): MapShellNavConfig {
  const role = parseOfficerApiRole(systemRole);

  const mainNav: MapShellNavItem[] = [];

  if (role === 'DEO') {
    mainNav.push(
      withSection(NAV_ITEMS.map, 'Tổng quan'),
      NAV_ITEMS.overview,
      withSection(NAV_ITEMS.duplicates, 'Rà soát'),
      NAV_ITEMS.recurrence,
      withSection(NAV_ITEMS.reports, 'Tra cứu'),
      withSection(NAV_ITEMS.companies, 'Quản lý')
    );
  } else if (role === 'LEO') {
    mainNav.push(
      withSection(NAV_ITEMS.map, 'Tổng quan'),
      NAV_ITEMS.overview,
      withSection(NAV_ITEMS.verify, 'Xử lý'),
      NAV_ITEMS.assign,
      NAV_ITEMS.tracking,
      NAV_ITEMS.reopen,
      withSection(NAV_ITEMS.duplicates, 'Rà soát'),
      NAV_ITEMS.recurrence,
      withSection(NAV_ITEMS.reports, 'Tra cứu'),
      withSection(NAV_ITEMS.community, 'Cộng đồng'),
      withSection(NAV_ITEMS.workforce, 'Quản lý'),
      NAV_ITEMS.myCompanies
    );
  } else {
    mainNav.push(NAV_ITEMS.map, NAV_ITEMS.overview);
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

  // Detail/list legacy hồ sơ xử phạt → highlight hub 「Tái diễn」
  if (path === '/officer/inspections' || path.startsWith('/officer/inspections/')) {
    const hub = config.mainNav.find(item => item.id === 'recurrence');
    if (hub) return hub.id;
  }

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

  const system = [config.systemNav.notifications, config.systemNav.settings].filter(
    (item): item is MapShellNavItem => item != null
  );
  const systemMatch = system.find(item => path === item.href || path.startsWith(`${item.href}/`));
  return systemMatch?.id ?? null;
}
