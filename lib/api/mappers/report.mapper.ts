import type {
  ReportAssignmentDto,
  ReportAssignmentHistoryItemDto,
  ReportDetailDto,
  ReportMediaDto,
  ReportMergedChildDto,
  ReportPendingReopenRequestDto,
  ReportPriorClosedReportDto,
  ReportReopenHistoryItemDto,
  ReportSatisfactionDto,
  ReportWasteTagDto,
} from '@/lib/api/dto/report.dto';
import type {
  ReportAssignment,
  ReportAssignmentHistoryItem,
  ReportDetail,
  ReportMedia,
  ReportMergedChild,
  ReportPendingReopenRequest,
  ReportPriorClosedReport,
  ReportReopenHistoryItem,
  ReportSatisfaction,
  ReportWasteTag,
  SeveritySetBy,
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

function mapAssignmentDto(dto: ReportAssignmentDto): ReportAssignment {
  return {
    id: dto.id,
    teamId: dto.teamId,
    teamName: dto.teamName,
    teamType: dto.teamType,
    status: dto.status,
    note: dto.note?.trim() || null,
    assignedAt: dto.assignedAt,
    startedAt: dto.startedAt || null,
    completedAt: dto.completedAt || null,
    progressPercent: dto.progressPercent ?? 0,
    progressNote: dto.progressNote?.trim() || null,
    progressUpdatedAt: dto.progressUpdatedAt || null,
    teamWasteTags: (dto.teamWasteTags ?? []).map(mapWasteTagDto),
  };
}

function mapCurrentAssignmentDto(
  dto: ReportAssignmentDto | null | undefined
): ReportAssignment | null {
  if (!dto) return null;
  return mapAssignmentDto(dto);
}

function mapAssignmentHistoryItemDto(
  dto: ReportAssignmentHistoryItemDto
): ReportAssignmentHistoryItem {
  return {
    assignmentId: dto.assignmentId,
    teamId: dto.teamId,
    teamName: dto.teamName,
    teamType: dto.teamType,
    status: dto.status,
    note: dto.note?.trim() || null,
    declineReason: dto.declineReason?.trim() || null,
    assignedAt: dto.assignedAt,
    startedAt: dto.startedAt || null,
    completedAt: dto.completedAt || null,
    assignedById: dto.assignedById || null,
    assignedByName: dto.assignedByName?.trim() || null,
    progressPercent: dto.progressPercent ?? 0,
    progressNote: dto.progressNote?.trim() || null,
    progressUpdatedAt: dto.progressUpdatedAt || null,
    isCurrent: Boolean(dto.isCurrent),
    teamWasteTags: (dto.teamWasteTags ?? []).map(mapWasteTagDto),
  };
}

function mapWasteTagDto(dto: ReportWasteTagDto): ReportWasteTag {
  return {
    tagId: dto.tagId,
    code: dto.code,
    nameVi: dto.nameVi,
    nameEn: dto.nameEn?.trim() || null,
    iconUrl: dto.iconUrl?.trim() || null,
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

function mapReopenHistoryItemDto(dto: ReportReopenHistoryItemDto): ReportReopenHistoryItem {
  return {
    requestId: dto.requestId,
    reason: dto.reason,
    status: dto.status,
    requestedAt: dto.requestedAt,
    requestedById: dto.requestedById,
    requestedByName: dto.requestedByName?.trim() || null,
    reviewedAt: dto.reviewedAt || null,
    reviewedById: dto.reviewedById || null,
    reviewedByName: dto.reviewedByName?.trim() || null,
    rejectionReason: dto.rejectionReason?.trim() || null,
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

function mapPriorClosedReportDto(
  dto: ReportPriorClosedReportDto | null | undefined
): ReportPriorClosedReport | null {
  if (!dto) return null;
  return {
    id: dto.id,
    code: dto.code,
    closedAt: dto.closedAt,
    categoryCode: dto.categoryCode,
    hadPriorInspection: Boolean(dto.hadPriorInspection),
  };
}

function normalizeSeveritySetBy(value: string): SeveritySetBy {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'ai') return 'AI';
  if (normalized === 'officer') return 'Officer';
  if (normalized === 'user') return 'User';
  return 'User';
}

/** GET /v1/reports/{id} — normalize optional BE fields → domain model. */
export function mapReportDetailDto(dto: ReportDetailDto): Omit<ReportDetail, 'status'> & {
  status: ReportDetailDto['status'];
} {
  return {
    id: dto.id,
    code: dto.code,
    reporterId: dto.reporterId,
    reporterName: dto.reporterName?.trim() || null,
    reporterAvatarUrl: dto.reporterAvatarUrl?.trim() || null,
    categoryId: dto.categoryId,
    categoryCode: dto.categoryCode,
    categoryName: dto.categoryName,
    severity: dto.severity,
    severitySetBy: normalizeSeveritySetBy(String(dto.severitySetBy ?? 'User')),
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
    assignments: (dto.assignments ?? []).map(mapAssignmentDto),
    currentAssignment: mapCurrentAssignmentDto(dto.currentAssignment),
    assignmentHistory: (dto.assignmentHistory ?? []).map(mapAssignmentHistoryItemDto),
    wasteTags: (dto.wasteTags ?? []).map(mapWasteTagDto),
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
    reopenHistory: (dto.reopenHistory ?? []).map(mapReopenHistoryItemDto),
    mergedIntoPrimaryReportId: dto.mergedIntoPrimaryReportId ?? null,
    mergedIntoPrimaryReportCode: dto.mergedIntoPrimaryReportCode ?? null,
    mergedReports: (dto.mergedReports ?? []).map(mapMergedChildDto),
    isSuspectedViolationRecurrence: Boolean(dto.isSuspectedViolationRecurrence),
    suspectedRecurrenceOfReportId: dto.suspectedRecurrenceOfReportId || null,
    priorClosedReport: mapPriorClosedReportDto(dto.priorClosedReport),
    isSuspicious: Boolean(dto.isSuspicious),
    suspiciousReasons: (dto.suspiciousReasons ?? []).filter(
      (r): r is string => typeof r === 'string' && Boolean(r.trim())
    ),
  };
}
