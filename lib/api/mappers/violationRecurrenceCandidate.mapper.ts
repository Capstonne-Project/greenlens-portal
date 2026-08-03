import type {
  ViolationRecurrenceCandidateItemDto,
  ViolationRecurrenceCandidatePriorDto,
  ViolationRecurrenceCandidatesDataDto,
} from '@/lib/api/dto/violationRecurrenceCandidate.dto';
import type { ViolationRecurrenceMediaDto } from '@/lib/api/dto/violationRecurrence.dto';
import type {
  ViolationRecurrenceCandidateItem,
  ViolationRecurrenceCandidatePrior,
  ViolationRecurrenceCandidatesData,
} from '@/lib/api/models/violationRecurrenceCandidate';
import type { ViolationRecurrenceMedia } from '@/lib/api/models/violationRecurrence';
import type { ReportSeverity } from '@/lib/api/models/report';
import { normalizeReportQueueStatus, normalizeReportStatus } from '@/lib/constants/reportStatus';

const SEVERITIES: ReportSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

function asSeverity(value: string): ReportSeverity {
  return (SEVERITIES.includes(value as ReportSeverity) ? value : 'Low') as ReportSeverity;
}

function mapMediaDto(dto: ViolationRecurrenceMediaDto): ViolationRecurrenceMedia {
  return {
    id: dto.id,
    url: dto.url ?? '',
    thumbnailUrl: dto.thumbnailUrl ?? '',
    type: dto.type ?? '',
    uploadedAt: dto.uploadedAt ?? '',
  };
}

function mapPrior(
  dto: ViolationRecurrenceCandidatePriorDto | null
): ViolationRecurrenceCandidatePrior | null {
  if (!dto?.id) return null;
  return {
    id: dto.id,
    code: dto.code ?? '',
    address: dto.address ?? '',
    status: normalizeReportStatus(String(dto.status ?? '')),
    closedAt: dto.closedAt,
    daysSinceClosed: Number(dto.daysSinceClosed) || 0,
    media: (dto.media ?? []).map(mapMediaDto),
  };
}

function mapItemDto(dto: ViolationRecurrenceCandidateItemDto): ViolationRecurrenceCandidateItem {
  return {
    id: dto.id,
    code: dto.code,
    categoryName: dto.categoryName ?? '',
    severity: asSeverity(String(dto.severity)),
    status: normalizeReportQueueStatus(String(dto.status)),
    latitude: dto.latitude,
    longitude: dto.longitude,
    address: dto.address ?? '',
    createdAt: dto.createdAt,
    media: (dto.media ?? []).map(mapMediaDto),
    priorClosedReport: mapPrior(dto.priorClosedReport),
  };
}

export function mapViolationRecurrenceCandidatesDataDto(
  data: ViolationRecurrenceCandidatesDataDto
): ViolationRecurrenceCandidatesData {
  return {
    items: (data.items ?? []).map(mapItemDto),
    pagination: {
      page: data.pagination.page,
      pageSize: data.pagination.pageSize,
      totalItems: data.pagination.totalItems,
      totalPages: data.pagination.totalPages,
      hasNext: data.pagination.hasNext,
      hasPrev: data.pagination.hasPrev,
    },
  };
}
