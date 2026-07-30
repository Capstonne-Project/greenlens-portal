import type {
  ReportDetailDto,
  ReportMediaDto,
  ReportMergedChildDto,
  ReportPendingReopenRequestDto,
  ReportSatisfactionDto,
} from '@/lib/api/dto/report.dto';
import type {
  ReportDetail,
  ReportMedia,
  ReportMergedChild,
  ReportPendingReopenRequest,
  ReportSatisfaction,
} from '@/lib/api/models/report';

function mapReportMediaDto(dto: ReportMediaDto): ReportMedia {
  return {
    id: dto.id,
    mediaType: dto.mediaType,
    url: dto.url,
    mimeType: dto.mimeType,
    sizeBytes: dto.sizeBytes,
  };
}

function mapSatisfactionDto(
  dto: ReportSatisfactionDto | null | undefined
): ReportSatisfaction | null {
  if (!dto) return null;
  return {
    isSatisfied: dto.isSatisfied,
    rating: dto.rating,
    comment: dto.comment,
    ratedAt: dto.ratedAt,
  };
}

function mapPendingReopenDto(
  dto: ReportPendingReopenRequestDto | null | undefined
): ReportPendingReopenRequest | null {
  if (!dto) return null;
  return {
    requestId: dto.requestId,
    reason: dto.reason,
    requestedAt: dto.requestedAt,
    evidenceMedia: (dto.evidenceMedia ?? []).map(mapReportMediaDto),
  };
}

function mapMergedChildDto(dto: ReportMergedChildDto): ReportMergedChild {
  return {
    id: dto.id,
    code: dto.code,
    imageUrl: dto.imageUrl ?? null,
    createdAt: dto.createdAt,
    status: dto.status,
  };
}

/** GET /v1/reports/{id} — normalize optional BE fields → domain model. */
export function mapReportDetailDto(dto: ReportDetailDto): Omit<ReportDetail, 'status'> & {
  status: ReportDetailDto['status'];
} {
  return {
    id: dto.id,
    code: dto.code,
    reporterId: dto.reporterId,
    categoryId: dto.categoryId,
    categoryCode: dto.categoryCode,
    categoryName: dto.categoryName,
    severity: dto.severity,
    severitySetBy: dto.severitySetBy,
    status: dto.status,
    description: dto.description,
    latitude: dto.latitude,
    longitude: dto.longitude,
    address: dto.address,
    wardCode: dto.wardCode,
    provinceCode: dto.provinceCode,
    priorityScore: dto.priorityScore,
    reporterCount: dto.reporterCount,
    reopenedCount: dto.reopenedCount,
    aiClassifiedType: dto.aiClassifiedType ?? null,
    aiConfidence: dto.aiConfidence ?? null,
    verifiedBy: dto.verifiedBy ?? null,
    assignedByOfficerId: dto.assignedByOfficerId ?? null,
    assignedOfficeId: dto.assignedOfficeId ?? null,
    media: (dto.media ?? []).map(mapReportMediaDto),
    assignments: dto.assignments ?? [],
    wasteTags: dto.wasteTags ?? [],
    aiSuggestedWasteTagCodes: dto.aiSuggestedWasteTagCodes ?? null,
    createdAt: dto.createdAt,
    verifiedAt: dto.verifiedAt ?? null,
    startedAt: dto.startedAt ?? null,
    resolvedAt: dto.resolvedAt ?? null,
    closedAt: dto.closedAt ?? null,
    slaVerifyDueAt: dto.slaVerifyDueAt ?? null,
    slaResolveDueAt: dto.slaResolveDueAt ?? null,
    satisfaction: mapSatisfactionDto(dto.satisfaction),
    hasCurrentUserRated: dto.hasCurrentUserRated ?? false,
    hasPendingReopenRequest: dto.hasPendingReopenRequest ?? false,
    pendingReopenRequest: mapPendingReopenDto(dto.pendingReopenRequest),
    mergedIntoPrimaryReportId: dto.mergedIntoPrimaryReportId ?? null,
    mergedIntoPrimaryReportCode: dto.mergedIntoPrimaryReportCode ?? null,
    mergedReports: (dto.mergedReports ?? []).map(mapMergedChildDto),
  };
}
