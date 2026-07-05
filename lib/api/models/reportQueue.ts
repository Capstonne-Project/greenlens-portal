import type { PaginationMeta } from '@/lib/api/models/office';
import type { ReportSeverity } from '@/lib/api/models/report';
import type { ReportStatus } from '@/lib/constants/reportStatus';

/** GET /v1/reports/queue — một item trong hàng đợi [LEO/DEO]. */
export interface ReportQueueItem {
  id: string;
  code: string;
  categoryCode: string;
  categoryName: string;
  severity: ReportSeverity;
  status: ReportStatus;
  latitude: number;
  longitude: number;
  address: string;
  wardCode: string;
  priorityScore: number;
  createdAt: string;
  slaVerifyDueAt: string | null;
  slaResolveDueAt: string | null;
}

/** GET /v1/reports/queue — data envelope. */
export interface ReportQueueData {
  items: ReportQueueItem[];
  pagination: PaginationMeta;
}

export type ReportQueueSortBy =
  | 'PriorityScore'
  | 'CreatedAt'
  | 'Severity'
  | 'SlaVerifyDueAt'
  | 'SlaResolveDueAt';

export type ReportQueueSortDir = 'Asc' | 'Desc';

export interface ReportQueueParams {
  page?: number;
  pageSize?: number;
  status?: ReportStatus;
  severity?: ReportSeverity;
  categoryId?: string;
  wardCode?: string;
  fromDate?: string;
  toDate?: string;
  slaBreached?: boolean;
  search?: string;
  sortBy?: ReportQueueSortBy;
  sortDir?: ReportQueueSortDir;
}
