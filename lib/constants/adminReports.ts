import type { ReportStatus } from '@/lib/api/models/adminReport';

export interface AdminReportStatusTab {
  id: string;
  label: string;
  /** Gửi query `status` — undefined = tất cả */
  status?: ReportStatus;
}

export const ADMIN_REPORT_STATUS_TABS: AdminReportStatusTab[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'submitted', label: 'Đã gửi', status: 'Submitted' },
  { id: 'verified', label: 'Đã xác minh', status: 'Verified' },
  { id: 'in-progress', label: 'Đang xử lý', status: 'In Progress' },
  { id: 'resolved', label: 'Đã giải quyết', status: 'Resolved' },
  { id: 'rejected', label: 'Từ chối', status: 'Rejected' },
  { id: 'duplicate', label: 'Trùng lặp', status: 'Duplicate' },
];

export const ADMIN_REPORT_PAGE_SIZE = 20;
