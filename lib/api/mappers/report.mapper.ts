import type { ReportDetailDto } from '@/lib/api/dto/report.dto';
import type { ReportDetail } from '@/lib/api/models/report';

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
    media: dto.media ?? [],
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
  };
}
