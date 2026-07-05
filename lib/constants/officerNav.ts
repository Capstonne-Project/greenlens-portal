import type { UserRole } from '@/lib/constants/systemRoles';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, MessageSquare, User } from 'lucide-react';

/** Trang mặc định sau đăng nhập / khi bị từ chối quyền (DEO / LEO). */
export function getDefaultOfficerHomePath(_systemRole: UserRole | undefined): string {
  return '/officer/map';
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
