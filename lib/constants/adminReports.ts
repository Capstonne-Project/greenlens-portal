import type { ReportStatus } from '@/lib/constants/reportStatus';
import { REPORT_STATUS_LABEL_VI } from '@/lib/constants/reportStatus';

export interface AdminReportStatusTab {
  id: string;
  label: string;
  /** Gửi query `status` — undefined = tất cả */
  status?: ReportStatus;
}

export const ADMIN_REPORT_STATUS_TABS: AdminReportStatusTab[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'submitted', label: REPORT_STATUS_LABEL_VI.Submitted, status: 'Submitted' },
  { id: 'verified', label: REPORT_STATUS_LABEL_VI.Verified, status: 'Verified' },
  { id: 'dispatched', label: REPORT_STATUS_LABEL_VI.Dispatched, status: 'Dispatched' },
  { id: 'assigned', label: REPORT_STATUS_LABEL_VI.Assigned, status: 'Assigned' },
  { id: 'in-progress', label: REPORT_STATUS_LABEL_VI.InProgress, status: 'InProgress' },
  { id: 'resolved', label: REPORT_STATUS_LABEL_VI.Resolved, status: 'Resolved' },
  { id: 'closed', label: REPORT_STATUS_LABEL_VI.Closed, status: 'Closed' },
  { id: 'rejected', label: REPORT_STATUS_LABEL_VI.Rejected, status: 'Rejected' },
  { id: 'duplicate', label: REPORT_STATUS_LABEL_VI.Duplicate, status: 'Duplicate' },
  { id: 'penalty', label: REPORT_STATUS_LABEL_VI.PenaltyIssued, status: 'PenaltyIssued' },
  {
    id: 'closed-no-violation',
    label: REPORT_STATUS_LABEL_VI.ClosedNoViolation,
    status: 'ClosedNoViolation',
  },
];

export const ADMIN_REPORT_PAGE_SIZE = 20;
