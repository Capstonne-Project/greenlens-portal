import type {
  ReportQueueDataDto,
  ReportQueueItemDto,
  ReportQueuePaginationDto,
} from '@/lib/api/dto/reportQueue.dto';
import type { PaginationMeta } from '@/lib/api/models/office';
import type { ReportQueueData, ReportQueueItem } from '@/lib/api/models/reportQueue';
import type { ReportSeverity } from '@/lib/api/models/report';
import { normalizeReportStatus } from '@/lib/constants/reportStatus';

const SEVERITIES: ReportSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

function asSeverity(value: string): ReportSeverity {
  return (SEVERITIES.includes(value as ReportSeverity) ? value : 'Low') as ReportSeverity;
}

function mapPagination(dto: ReportQueuePaginationDto): PaginationMeta {
  return {
    page: dto.page,
    pageSize: dto.pageSize,
    totalItems: dto.totalItems,
    totalPages: dto.totalPages,
    hasNext: dto.hasNext,
    hasPrev: dto.hasPrev,
  };
}

function mapReportQueueItemDto(dto: ReportQueueItemDto): ReportQueueItem {
  return {
    id: dto.id,
    code: dto.code,
    categoryCode: dto.categoryCode,
    categoryName: dto.categoryName,
    severity: asSeverity(String(dto.severity)),
    status: normalizeReportStatus(String(dto.status)),
    latitude: dto.latitude,
    longitude: dto.longitude,
    address: dto.address ?? '',
    wardCode: dto.wardCode ?? '',
    priorityScore: dto.priorityScore ?? 0,
    createdAt: dto.createdAt,
    slaVerifyDueAt: dto.slaVerifyDueAt || null,
    slaResolveDueAt: dto.slaResolveDueAt || null,
    firstImageUrl: dto.firstImageUrl || null,
    isPossibleDuplicate: Boolean(dto.isPossibleDuplicate),
    possibleDuplicateOfReportId: dto.possibleDuplicateOfReportId || null,
    possibleDuplicateOfReportCode: dto.possibleDuplicateOfReportCode || null,
    duplicateDetectionSource: dto.duplicateDetectionSource || null,
    aiSimilarityScore:
      dto.aiSimilarityScore == null || Number.isNaN(Number(dto.aiSimilarityScore))
        ? null
        : Number(dto.aiSimilarityScore),
    duplicateCandidateCount: dto.duplicateCandidateCount ?? 0,
  };
}

export function mapReportQueueDataDto(data: ReportQueueDataDto): ReportQueueData {
  return {
    items: (data.items ?? []).map(mapReportQueueItemDto),
    pagination: mapPagination(data.pagination),
  };
}
