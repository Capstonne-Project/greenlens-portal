/** Tiêu đề header Company Manager theo pathname. */
export function getCompanyPageTitle(pathname: string): string {
  if (pathname === '/company') return 'Tổng quan công ty';
  if (pathname === '/company/staff') return 'Quản lý nhân sự';
  if (pathname === '/company/teams') return 'Đội dọn dẹp';
  if (pathname === '/company/queue') return 'Điều phối báo cáo';
  if (pathname === '/company/assignments' || pathname.startsWith('/company/assignments/'))
    return 'Theo dõi phân công';
  return 'GreenLens Company';
}
