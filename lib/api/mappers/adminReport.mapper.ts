import type {
  AdminReportAssignmentDto,
  AdminReportDetailDto,
  AdminReportListItemDto,
  AdminReportMediaDto,
  AdminReportsListDataDto,
} from '@/lib/api/dto/adminReport.dto';
import type {
  AdminReportAssignment,
  AdminReportDetail,
  AdminReportListItem,
  AdminReportMedia,
  AdminReportsList,
  PaginationMeta,
  ReportSeverity,
  ReportStatus,
} from '@/lib/api/models/adminReport';
import { normalizeReportStatus } from '@/lib/constants/reportStatus';

const SEVERITIES: ReportSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

function asReportStatus(value: string): ReportStatus {
  return normalizeReportStatus(value);
}

function asReportSeverity(value: string): ReportSeverity {
  return (SEVERITIES.includes(value as ReportSeverity) ? value : 'Low') as ReportSeverity;
}

export function mapAdminReportListItemDto(dto: AdminReportListItemDto): AdminReportListItem {
  return {
    id: dto.id,
    code: dto.code,
    categoryCode: dto.categoryCode,
    categoryName: dto.categoryName,
    severity: asReportSeverity(String(dto.severity)),
    status: asReportStatus(String(dto.status)),
    latitude: dto.latitude,
    longitude: dto.longitude,
    address: dto.address ?? '',
    wardCode: dto.wardCode ?? null,
    provinceCode: dto.provinceCode ?? null,
    reporterId: dto.reporterId ?? null,
    isAnonymous: Boolean(dto.isAnonymous),
    assignedOfficerId: dto.assignedOfficerId ?? null,
    assignmentCount: dto.assignmentCount ?? 0,
    priorityScore: dto.priorityScore ?? 0,
    reporterCount: dto.reporterCount ?? 0,
    reopenedCount: dto.reopenedCount ?? 0,
    createdAt: dto.createdAt ?? '',
  };
}

function mapPagination(dto: AdminReportsListDataDto): PaginationMeta {
  const page = Math.max(1, dto.page ?? 1);
  const pageSize = Math.max(1, dto.pageSize ?? 20);
  const totalItems = dto.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function mapAdminReportsListDataDto(dto: AdminReportsListDataDto): AdminReportsList {
  return {
    items: (dto.items ?? []).map(mapAdminReportListItemDto),
    pagination: mapPagination(dto),
  };
}

function mapMediaDto(dto: AdminReportMediaDto): AdminReportMedia {
  return {
    id: dto.id,
    mediaType: dto.mediaType,
    url: dto.url,
    mimeType: dto.mimeType ?? null,
    sizeBytes: dto.sizeBytes ?? null,
  };
}

function mapAssignmentDto(dto: AdminReportAssignmentDto): AdminReportAssignment {
  return {
    id: dto.id,
    teamId: dto.teamId ?? null,
    teamName: dto.teamName ?? null,
    teamType: dto.teamType ?? null,
    status: dto.status ?? null,
    note: dto.note ?? null,
    assignedAt: dto.assignedAt ?? null,
    startedAt: dto.startedAt ?? null,
    completedAt: dto.completedAt ?? null,
  };
}

export function mapAdminReportDetailDto(dto: AdminReportDetailDto): AdminReportDetail {
  const base = mapAdminReportListItemDto(dto);
  return {
    ...base,
    categoryId: dto.categoryId,
    severitySetBy: dto.severitySetBy ?? null,
    description: dto.description ?? '',
    aiClassifiedType: dto.aiClassifiedType ?? null,
    aiConfidence: dto.aiConfidence ?? null,
    assignedOfficeId: dto.assignedOfficeId ?? null,
    media: (dto.media ?? []).map(mapMediaDto),
    assignments: (dto.assignments ?? []).map(mapAssignmentDto),
    verifiedAt: dto.verifiedAt ?? null,
    resolvedAt: dto.resolvedAt ?? null,
    closedAt: dto.closedAt ?? null,
    startedAt: dto.startedAt ?? null,
    slaVerifyDueAt: dto.slaVerifyDueAt ?? null,
    slaResolveDueAt: dto.slaResolveDueAt ?? null,
  };
}
