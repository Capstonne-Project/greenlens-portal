/**
 * Company shell sidebar config — mirrors `CompanySidebarNav` routes/labels.
 * Reuses `MapShellNavConfig` shape for `AppSidebar`; does NOT use officer/admin factories.
 */

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBell,
  faBullseye,
  faChartLine,
  faClipboardList,
  faGaugeHigh,
  faGear,
  faScroll,
  faUser,
  faUserGroup,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import type { MapShellNavConfig, MapShellNavItem } from '@/lib/constants/mapShellNav';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'GreenLens';

function item(id: string, label: string, href: string, icon: IconDefinition): MapShellNavItem {
  return { id, label, href, icon };
}

/** Sidebar Company — route/label parity với CompanySidebarNav. */
export function getCompanyShellNavConfig(): MapShellNavConfig {
  const mainNav: MapShellNavItem[] = [
    // Vận hành
    item('dashboard', 'Tổng quan', '/company', faGaugeHigh),
    item('kpi', 'KPI công ty', '/company/kpi', faBullseye),
    item('queue', 'Điều phối báo cáo', '/company/queue', faClipboardList),
    item('assignments', 'Theo dõi phân công', '/company/assignments', faChartLine),
    item('notifications', 'Thông báo', '/company/notifications', faBell),
    // Nguồn lực
    item('staff', 'Nhân sự', '/company/staff', faUsers),
    item('teams', 'Đội dọn dẹp', '/company/teams', faUserGroup),
    item('contract-history', 'Lịch sử hợp đồng', '/company/contract-history', faScroll),
    item('account', 'Tài khoản', '/company/account', faUser),
  ];

  return {
    brand: {
      name: APP_NAME,
      tagline: 'Cổng công ty',
    },
    mainNav,
    systemNav: {
      notifications: {
        // Same id as mainNav so active chip highlights both entries
        id: 'notifications',
        label: 'Thông báo',
        href: '/company/notifications',
        animatedIcon: 'filled-bell',
      },
      settings: {
        id: 'settings',
        label: 'Cài đặt',
        href: '/company/notifications/preferences',
        icon: faGear,
      },
    },
  };
}
