import type {
  DuplicateCandidateItemDto,
  DuplicateCandidateMediaDto,
  DuplicateCandidatePrimaryDto,
  DuplicateCandidatesDataDto,
} from '@/lib/api/dto/duplicateCandidate.dto';
import type {
  DuplicateCandidateItem,
  DuplicateCandidateMedia,
  DuplicateCandidatePrimary,
  DuplicateCandidatesData,
} from '@/lib/api/models/duplicateCandidate';
import type { ReportSeverity } from '@/lib/api/models/report';
import { normalizeReportQueueStatus } from '@/lib/constants/reportStatus';

const SEVERITIES: ReportSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

function asSeverity(value: string): ReportSeverity {
  return (SEVERITIES.includes(value as ReportSeverity) ? value : 'Low') as ReportSeverity;
}

function mapMediaDto(dto: DuplicateCandidateMediaDto): DuplicateCandidateMedia {
  return {
    id: dto.id,
    url: dto.url ?? '',
    thumbnailUrl: dto.thumbnailUrl ?? '',
    type: dto.type ?? '',
    uploadedAt: dto.uploadedAt ?? '',
  };
}

function mapPrimary(dto: DuplicateCandidatePrimaryDto | null): DuplicateCandidatePrimary | null {
  if (!dto?.id) return null;
  return {
    id: dto.id,
    code: dto.code ?? '',
    address: dto.address ?? '',
    createdAt: dto.createdAt,
    media: (dto.media ?? []).map(mapMediaDto),
  };
}

function mapDuplicateCandidateItemDto(dto: DuplicateCandidateItemDto): DuplicateCandidateItem {
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
    duplicateDetectionSource: dto.duplicateDetectionSource || null,
    aiSimilarityScore:
      dto.aiSimilarityScore == null || Number.isNaN(Number(dto.aiSimilarityScore))
        ? null
        : Number(dto.aiSimilarityScore),
    media: (dto.media ?? []).map(mapMediaDto),
    primary: mapPrimary(dto.primary),
  };
}

export function mapDuplicateCandidatesDataDto(
  data: DuplicateCandidatesDataDto
): DuplicateCandidatesData {
  return {
    items: (data.items ?? []).map(mapDuplicateCandidateItemDto),
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
