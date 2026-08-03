import type {
  DuplicateCandidateDetailDto,
  DuplicateCandidateDetailMediaDto,
  DuplicateCandidateDetailSideDto,
} from '@/lib/api/dto/duplicateCandidateDetail.dto';
import type {
  DuplicateCandidateDetail,
  DuplicateCandidateDetailMedia,
  DuplicateCandidateDetailSide,
} from '@/lib/api/models/duplicateCandidateDetail';
import type { ReportSeverity } from '@/lib/api/models/report';
import { normalizeReportStatus } from '@/lib/constants/reportStatus';

const SEVERITIES: ReportSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

function asSeverity(value: string): ReportSeverity {
  return (SEVERITIES.includes(value as ReportSeverity) ? value : 'Low') as ReportSeverity;
}

function mapMediaDto(dto: DuplicateCandidateDetailMediaDto): DuplicateCandidateDetailMedia {
  return {
    id: dto.id,
    url: dto.url ?? '',
    thumbnailUrl: dto.thumbnailUrl ?? '',
    type: dto.type ?? '',
    uploadedAt: dto.uploadedAt ?? '',
  };
}

function mapSideDto(dto: DuplicateCandidateDetailSideDto): DuplicateCandidateDetailSide {
  return {
    id: dto.id,
    code: dto.code ?? '',
    status: normalizeReportStatus(String(dto.status ?? '')),
    categoryCode: dto.categoryCode ?? '',
    categoryName: dto.categoryName ?? '',
    severity: asSeverity(String(dto.severity ?? 'Low')),
    description: dto.description ?? '',
    latitude: Number(dto.latitude) || 0,
    longitude: Number(dto.longitude) || 0,
    address: dto.address ?? '',
    createdAt: dto.createdAt ?? '',
    media: (dto.media ?? []).map(mapMediaDto),
  };
}

/** Map `data` của GET .../duplicate-candidate-detail. */
export function mapDuplicateCandidateDetailDto(
  dto: DuplicateCandidateDetailDto
): DuplicateCandidateDetail {
  return {
    report: mapSideDto(dto.report),
    primaryReport: dto.primaryReport ? mapSideDto(dto.primaryReport) : null,
    duplicateDetectionSource: dto.duplicateDetectionSource ?? null,
    aiSimilarityScore:
      dto.aiSimilarityScore == null || Number.isNaN(Number(dto.aiSimilarityScore))
        ? null
        : Number(dto.aiSimilarityScore),
    distanceMeters: Number(dto.distanceMeters) || 0,
    hoursSincePrimaryCreated: Number(dto.hoursSincePrimaryCreated) || 0,
  };
}
