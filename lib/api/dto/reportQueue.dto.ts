import type { ReportSeverityDto } from '@/lib/api/dto/report.dto';
import type { ReportQueueStatus } from '@/lib/constants/reportStatus';

export type ReportQueueStatusDto = ReportQueueStatus;

/** GET /v1/reports/queue — một item trong hàng đợi. */
export interface ReportQueueItemDto {
  id: string;
  code: string;
  categoryCode: string;
  categoryName: string;
  severity: ReportSeverityDto;
  /** Swagger: Submitted | Verified | InProgress | Resolved | Reopened | Closed | Rejected | Duplicate */
  status: ReportQueueStatusDto;
  latitude: number;
  longitude: number;
  address: string;
  wardCode: string;
  priorityScore: number;
  createdAt: string;
  /** Thời điểm xác minh; null nếu chưa verify. */
  verifiedAt: string | null;
  slaVerifyDueAt: string | null;
  slaResolveDueAt: string | null;
  firstImageUrl: string | null;
  isPossibleDuplicate: boolean;
  possibleDuplicateOfReportId: string | null;
  possibleDuplicateOfReportCode: string | null;
  duplicateDetectionSource: string | null;
  aiSimilarityScore: number | null;
  duplicateCandidateCount: number;
  isSuspectedViolationRecurrence: boolean;
  suspectedRecurrenceOfReportId: string | null;
  suspectedRecurrenceOfReportCode: string | null;
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
  /** Multi: `?status=Submitted&status=Verified` */
  status?: ReportQueueStatusDto | readonly ReportQueueStatusDto[];
  severity?: ReportSeverityDto;
  categoryId?: string;
  wardCode?: string;
  fromDate?: string;
  toDate?: string;
  slaBreached?: boolean;
  isPossibleDuplicate?: boolean;
  isSuspectedViolationRecurrence?: boolean;
  hasPendingReopenRequest?: boolean;
  search?: string;
  sortBy?: ReportQueueSortByDto;
  sortDir?: ReportQueueSortDirDto;
}
