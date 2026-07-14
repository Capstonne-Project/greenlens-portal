import type { ReportSeverityDto, ReportStatusDto } from '@/lib/api/dto/report.dto';

/** GET /v1/reports/queue — một item trong hàng đợi. */
export interface ReportQueueItemDto {
  id: string;
  code: string;
  categoryCode: string;
  categoryName: string;
  severity: ReportSeverityDto;
  status: ReportStatusDto;
  latitude: number;
  longitude: number;
  address: string;
  wardCode: string;
  priorityScore: number;
  createdAt: string;
  slaVerifyDueAt: string;
  slaResolveDueAt: string;
  firstImageUrl: string | null;
}

export interface ReportQueuePaginationDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** GET /v1/reports/queue — data envelope. */
export interface ReportQueueDataDto {
  items: ReportQueueItemDto[];
  pagination: ReportQueuePaginationDto;
}

export type ReportQueueSortByDto =
  | 'PriorityScore'
  | 'CreatedAt'
  | 'Severity'
  | 'SlaVerifyDueAt'
  | 'SlaResolveDueAt';

export type ReportQueueSortDirDto = 'Asc' | 'Desc';

export interface ReportQueueParamsDto {
  page?: number;
  pageSize?: number;
  status?: ReportStatusDto;
  severity?: ReportSeverityDto;
  categoryId?: string;
  wardCode?: string;
  fromDate?: string;
  toDate?: string;
  slaBreached?: boolean;
  search?: string;
  sortBy?: ReportQueueSortByDto;
  sortDir?: ReportQueueSortDirDto;
}
