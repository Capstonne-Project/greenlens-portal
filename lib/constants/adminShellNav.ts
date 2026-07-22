/**
 * Admin shell sidebar config — mirrors `AdminSidebarNav` routes/labels.
 * Reuses `MapShellNavConfig` shape for `AppSidebar`; does NOT use officer factory.
 */

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBell,
  faBuilding,
  faEarthAmericas,
  faGavel,
  faGaugeHigh,
  faGear,
  faLandmark,
  faRecycle,
  faScroll,
  faShield,
  faShieldHalved,
  faTags,
  faTrophy,
  faUserGroup,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { ADMIN_USERS_NAV } from '@/lib/constants/adminUsersNav';
import type { MapShellNavConfig, MapShellNavItem } from '@/lib/constants/mapShellNav';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'GreenLens';

function item(
  id: string,
  label: string,
  href: string,
  icon: IconDefinition,
  children?: MapShellNavItem['children']
): MapShellNavItem {
  return children?.length ? { id, label, href, icon, children } : { id, label, href, icon };
}

/** Sidebar Admin — route/label parity với AdminSidebarNav + ADMIN_USERS_NAV. */
export function getAdminShellNavConfig(): MapShellNavConfig {
  const usersChildren = ADMIN_USERS_NAV.map(row => ({
    id: row.slug ? `users-${row.slug}` : 'users-overview',
    label: row.label,
    href: row.href,
  }));

  const mainNav: MapShellNavItem[] = [
    // Tổng quan
    item('dashboard', 'Tổng quan', '/admin', faGaugeHigh),
    item('reports', 'Báo cáo ô nhiễm', '/admin/reports', faShield),
    item('departments', 'Sở TNMT', '/admin/departments', faLandmark),
    item('offices', 'Văn phòng địa phương', '/admin/offices', faBuilding),
    item('teams', 'Đội môi trường', '/admin/teams', faUserGroup),
    item('map', 'Bản đồ quản trị', '/admin/map', faEarthAmericas),
    // Cộng đồng
    item('pollution-categories', 'Danh mục ô nhiễm', '/admin/pollution-categories', faTags),
    item('waste-tags', 'Thẻ rác thải', '/admin/waste-tags', faRecycle),
    item('penalty-frameworks', 'Khung xử phạt', '/admin/penalty-frameworks', faGavel),
    item('gamification-configs', 'Điểm gamification', '/admin/gamification-configs', faTrophy),
    // Người dùng (collapse + children từ ADMIN_USERS_NAV)
    item('users', 'Người dùng', '/admin/users', faUsers, usersChildren),
    // Hệ thống
    item('notification-templates', 'Mẫu thông báo', '/admin/notification-templates', faBell),
    item('spam-suspects', 'Nghi spam', '/admin/spam-suspects', faShieldHalved),
    item('audit-logs', 'Nhật ký kiểm toán', '/admin/audit-logs', faScroll),
  ];

  return {
    brand: {
      name: APP_NAME,
      tagline: 'Quản trị hệ thống',
    },
    mainNav,
    systemNav: {
      notifications: {
        id: 'notifications',
        label: 'Hộp thư',
        href: '/admin/notifications',
        animatedIcon: 'filled-bell',
      },
      settings: {
        id: 'settings',
        label: 'Cài đặt',
        href: '/admin/profile',
        icon: faGear,
      },
    },
  };
}
