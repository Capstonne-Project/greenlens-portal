import type {
  DismissViolationRecurrenceResponseDto,
  ViolationRecurrenceComparisonDto,
  ViolationRecurrenceMediaDto,
  ViolationRecurrenceReportDto,
} from '@/lib/api/dto/violationRecurrence.dto';
import type {
  DismissViolationRecurrenceResult,
  ViolationRecurrenceComparison,
  ViolationRecurrenceMedia,
  ViolationRecurrenceReport,
} from '@/lib/api/models/violationRecurrence';
import type { ReportSeverity } from '@/lib/api/models/report';
import { normalizeReportStatus } from '@/lib/constants/reportStatus';

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

function mapReportDto(dto: ViolationRecurrenceReportDto): ViolationRecurrenceReport {
  return {
    id: dto.id,
    code: dto.code ?? '',
    status: normalizeReportStatus(String(dto.status ?? '')),
    categoryCode: dto.categoryCode ?? '',
    categoryName: dto.categoryName ?? '',
    severity: asSeverity(String(dto.severity ?? 'Low')),
    description: dto.description ?? '',
    latitude: dto.latitude,
    longitude: dto.longitude,
    address: dto.address ?? '',
    createdAt: dto.createdAt,
    closedAt: dto.closedAt ?? null,
    media: (dto.media ?? []).map(mapMediaDto),
    hadPriorInspection: Boolean(dto.hadPriorInspection),
    priorInspectionId: dto.priorInspectionId ?? null,
    priorInspectionFinalStatus: dto.priorInspectionFinalStatus ?? null,
  };
}

/** Map `data` của GET .../violation-recurrence-comparison. */
export function mapViolationRecurrenceComparisonDto(
  dto: ViolationRecurrenceComparisonDto
): ViolationRecurrenceComparison {
  return {
    currentReport: mapReportDto(dto.currentReport),
    priorClosedReport: mapReportDto(dto.priorClosedReport),
    daysSincePriorClosed: Number(dto.daysSincePriorClosed) || 0,
    distanceMeters: Number(dto.distanceMeters) || 0,
  };
}

export function mapDismissViolationRecurrenceResponse(
  dto: DismissViolationRecurrenceResponseDto
): DismissViolationRecurrenceResult {
  return {
    code: dto.code,
    message: dto.message,
    status: dto.status,
    data: dto.data,
  };
}
