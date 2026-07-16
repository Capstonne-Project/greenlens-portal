/** Tiêu đề header Company Manager theo pathname. */
export function getCompanyPageTitle(pathname: string): string {
  if (pathname === '/company') return 'Tổng quan công ty';
  if (pathname === '/company/staff') return 'Quản lý nhân sự';
  if (pathname === '/company/teams') return 'Đội dọn dẹp';
  if (pathname === '/company/contract-history') return 'Lịch sử hợp đồng';
  if (pathname === '/company/kpi') return 'KPI công ty';
  if (pathname === '/company/notifications/preferences') return 'Cài đặt thông báo';
  if (pathname === '/company/notifications' || pathname.startsWith('/company/notifications/'))
    return 'Thông báo';
  if (pathname === '/company/queue') return 'Điều phối báo cáo';
  if (pathname === '/company/assignments' || pathname.startsWith('/company/assignments/'))
    return 'Theo dõi phân công';
  return 'GreenLens Company';
}
