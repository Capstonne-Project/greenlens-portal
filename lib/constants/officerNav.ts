import type { AnimatedTabItem } from '@/components/common/AnimatedTabs';
import type { UserRole } from '@/lib/constants/systemRoles';
import { parseOfficerApiRole } from '@/lib/constants/officerRoles';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, MessageSquare, User } from 'lucide-react';

/** Nav tabs officer — không badge count trên navbar. */
export const OFFICER_NAV_TABS: AnimatedTabItem[] = [
  { name: 'Bản đồ điều hành', value: 'map', link: '/officer/map' },
  { name: 'Tổng quan', value: 'dashboard', link: '/officer/dashboard' },
  { name: 'Phân công', value: 'assign', link: '/officer/assign' },
  { name: 'Theo dõi xử lý', value: 'tracking', link: '/officer/tracking' },
];

export function getOfficerNavTabsForRole(_systemRole: UserRole | undefined): AnimatedTabItem[] {
  return OFFICER_NAV_TABS;
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
