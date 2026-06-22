import type { AnimatedTabItem } from '@/components/common/AnimatedTabs';
import type { UserRole } from '@/lib/constants/systemRoles';
import { canAccessVerifyQueue, parseOfficerApiRole } from '@/lib/constants/officerRoles';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, MessageSquare, User } from 'lucide-react';

/** Nav tabs officer — không badge count trên navbar. */
export const OFFICER_NAV_TABS: AnimatedTabItem[] = [
  { name: 'Bản đồ điều hành', value: 'map', link: '/officer/map' },
  { name: 'Tổng quan', value: 'dashboard', link: '/officer/dashboard' },
  { name: 'Xác minh', value: 'verify', link: '/officer/verify' },
  { name: 'Phân công', value: 'assign', link: '/officer/assign' },
  { name: 'Theo dõi xử lý', value: 'tracking', link: '/officer/tracking' },
];

/** Ẩn tab Xác minh với LEO / Inspector — chỉ DEO. */
export function getOfficerNavTabsForRole(systemRole: UserRole | undefined): AnimatedTabItem[] {
  if (canAccessVerifyQueue(systemRole)) {
    return OFFICER_NAV_TABS;
  }
  return OFFICER_NAV_TABS.filter(tab => tab.value !== 'verify');
}

export function getDefaultOfficerHomePath(systemRole: UserRole | undefined): string {
  const role = parseOfficerApiRole(systemRole);
  if (role === 'LEO') return '/officer/assign';
  if (role === 'Inspector') return '/officer/tracking';
  if (role === 'DEO') return '/officer/map';
  return '/officer/dashboard';
}

export type OfficerAvatarMenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const OFFICER_AVATAR_MENU: OfficerAvatarMenuItem[] = [
  { label: 'KPI & Thống kê', href: '/officer/kpi', icon: BarChart3 },
  { label: 'Bình luận', href: '/officer/comments', icon: MessageSquare },
  { label: 'Hồ sơ', href: '/officer/profile', icon: User },
];
