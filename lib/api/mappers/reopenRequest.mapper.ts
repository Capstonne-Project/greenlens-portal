import type { ReopenRequestItemDto, ReopenRequestsDataDto } from '@/lib/api/dto/reopenRequest.dto';
import type {
  ReopenRequestItem,
  ReopenRequestStatus,
  ReopenRequestsData,
} from '@/lib/api/models/reopenRequest';
import { normalizeReportQueueStatus } from '@/lib/constants/reportStatus';

const REOPEN_REQUEST_STATUSES: ReopenRequestStatus[] = ['Pending', 'Approved', 'Rejected'];

function asReopenRequestStatus(value: string): ReopenRequestStatus {
  return (
    REOPEN_REQUEST_STATUSES.includes(value as ReopenRequestStatus) ? value : 'Pending'
  ) as ReopenRequestStatus;
}

function mapReopenRequestItemDto(dto: ReopenRequestItemDto): ReopenRequestItem {
  return {
    requestId: dto.requestId ?? '',
    reportId: dto.reportId ?? '',
    reportCode: dto.reportCode ?? '',
    reportStatus: normalizeReportQueueStatus(String(dto.reportStatus ?? '')),
    reason: dto.reason ?? '',
    status: asReopenRequestStatus(String(dto.status ?? '')),
    requestedAt: dto.requestedAt ?? '',
    firstEvidenceImageUrl: dto.firstEvidenceImageUrl || null,
    evidenceImageCount: dto.evidenceImageCount ?? 0,
    hasVideo: Boolean(dto.hasVideo),
  };
}

export function mapReopenRequestsDataDto(data: ReopenRequestsDataDto): ReopenRequestsData {
  return {
    items: (data.items ?? []).map(mapReopenRequestItemDto),
    pagination: {
      page: data.pagination?.page ?? 1,
      pageSize: data.pagination?.pageSize ?? 20,
      totalItems: data.pagination?.totalItems ?? 0,
      totalPages: data.pagination?.totalPages ?? 0,
      hasNext: Boolean(data.pagination?.hasNext),
      hasPrev: Boolean(data.pagination?.hasPrev),
    },
  };
}
