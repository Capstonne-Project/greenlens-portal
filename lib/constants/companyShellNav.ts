/**
 * Company shell sidebar config — mirrors `CompanySidebarNav` routes/labels.
 * Reuses `MapShellNavConfig` shape for `AppSidebar`; does NOT use officer/admin factories.
 */

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faChartLine,
  faClipboardList,
  faFileLines,
  faGaugeHigh,
  faGear,
  faScroll,
  faUser,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import type { MapShellNavConfig, MapShellNavItem } from '@/lib/constants/mapShellNav';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'GreenLens';

function item(id: string, label: string, href: string, icon: IconDefinition): MapShellNavItem {
  return { id, label, href, icon };
}

/** Gắn section label tĩnh lên item (render phía trên item trong AppSidebar). */
function withSection(item: MapShellNavItem, sectionLabel: string): MapShellNavItem {
  return { ...item, sectionLabel };
}

/** Sidebar Company — route/label parity với CompanySidebarNav. */
export function getCompanyShellNavConfig(): MapShellNavConfig {
  const mainNav: MapShellNavItem[] = [
    withSection(item('dashboard', 'Tổng quan', '/company', faGaugeHigh), 'Tổng quan'),
    item('assign', 'Phân công', '/company/assign', faClipboardList),
    item('tracking', 'Theo dõi xử lý', '/company/tracking', faChartLine),
    withSection(item('reports', 'Báo cáo', '/company/reports', faFileLines), 'Tra cứu'),
    withSection(item('workforce', 'Đội ngũ', '/company/workforce', faUsers), 'Quản lý'),
    item('contract-history', 'Lịch sử hợp đồng', '/company/contract-history', faScroll),
    withSection(item('account', 'Tài khoản', '/company/settings/account', faUser), 'Tài khoản'),
  ];

  return {
    brand: {
      name: APP_NAME,
      tagline: 'Cổng công ty',
    },
    mainNav,
    systemNav: {
      notifications: {
        id: 'notifications',
        label: 'Thông báo',
        href: '/company/notifications',
        animatedIcon: 'filled-bell',
      },
      settings: {
        id: 'settings',
        label: 'Cài đặt',
        href: '/company/settings',
        icon: faGear,
      },
    },
  };
}
