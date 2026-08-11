/**
 * Company shell sidebar config — mirrors `CompanySidebarNav` routes/labels.
 * Reuses `MapShellNavConfig` shape for `AppSidebar`; does NOT use officer/admin factories.
 */

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
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
    item('queue', 'Điều phối báo cáo', '/company/queue', faClipboardList),
    item('assignments', 'Phân công', '/company/assignments', faChartLine),
    // Nguồn lực
    item('staff', 'Nhân sự', '/company/staff', faUsers),
    item('teams', 'Đội dọn dẹp', '/company/teams', faUserGroup),
    item('contract-history', 'Lịch sử hợp đồng', '/company/contract-history', faScroll),
    item('account', 'Tài khoản', '/company/settings/account', faUser),
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
