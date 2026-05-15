import { ADMIN_USERS_NAV } from '@/lib/constants/adminUsersNav';

/** Tiêu đề header admin theo pathname (tiếng Việt). */
export function getAdminPageTitle(pathname: string): string {
  if (pathname === '/admin') return 'Tổng quan quản trị';
  if (pathname === '/admin/profile') return 'Hồ sơ cá nhân';
  if (pathname === '/admin/users') return 'Quản lý người dùng — Tổng quan';

  const usersTab = ADMIN_USERS_NAV.find(
    item => item.slug != null && (pathname === item.href || pathname.startsWith(`${item.href}/`))
  );
  if (usersTab) return `Quản lý người dùng — ${usersTab.label}`;

  return 'GreenLens Admin';
}
