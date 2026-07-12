import { ADMIN_USERS_NAV } from '@/lib/constants/adminUsersNav';

/** Tiêu đề header admin theo pathname (tiếng Việt). */
export function getAdminPageTitle(pathname: string): string {
  if (pathname === '/admin') return 'Tổng quan quản trị';
  if (pathname === '/admin/profile') return 'Hồ sơ cá nhân';
  if (pathname === '/admin/offices' || pathname === '/admin/organization')
    return 'Văn phòng địa phương';
  if (pathname === '/admin/pollution-categories') return 'Danh mục ô nhiễm';
  if (pathname === '/admin/waste-tags') return 'Thẻ rác thải';
  if (pathname === '/admin/penalty-frameworks') return 'Khung xử phạt';
  if (pathname === '/admin/audit-logs') return 'Nhật ký kiểm toán';
  if (pathname.startsWith('/admin/audit-logs/')) return 'Chi tiết nhật ký';
  if (pathname === '/admin/spam-suspects') return 'Tài khoản nghi spam';
  if (pathname === '/admin/gamification-configs') return 'Cấu hình điểm gamification';
  if (pathname === '/admin/departments') return 'Sở TNMT · Cấp tỉnh';
  if (pathname === '/admin/teams') return 'Quản lý đội môi trường';
  if (pathname === '/admin/reports') return 'Quản lý báo cáo ô nhiễm';
  if (pathname.startsWith('/admin/reports/')) return 'Chi tiết báo cáo';
  if (pathname === '/admin/users') return 'Quản lý người dùng — Tổng quan';

  const usersTab = ADMIN_USERS_NAV.find(
    item => item.slug != null && (pathname === item.href || pathname.startsWith(`${item.href}/`))
  );
  if (usersTab) return `Quản lý người dùng — ${usersTab.label}`;

  if (pathname.startsWith('/admin/users/')) return 'Quản lý người dùng';

  return 'GreenLens Admin';
}
