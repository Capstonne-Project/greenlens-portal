import type {
  LeoMyReportAssignmentDto,
  LeoMyReportItemDto,
  LeoMyReportsDataDto,
  LeoOfficePaginationDto,
  OfficeDetailDto,
  OfficeDto,
  OfficeListItemDto,
  OfficesListDataDto,
  OfficeTeamDto,
} from '@/lib/api/dto/office.dto';
import type {
  LeoMyReportAssignment,
  LeoMyReportItem,
  LeoMyReportsData,
  Office,
  OfficeDetail,
  OfficeListItem,
  OfficesList,
  OfficeTeam,
  PaginationMeta,
} from '@/lib/api/models/office';

function mapOfficeTeamDto(dto: OfficeTeamDto): OfficeTeam {
  return {
    id: dto.id,
    name: dto.name,
    teamType: dto.teamType,
    isActive: Boolean(dto.isActive),
    memberCount: dto.memberCount ?? 0,
  };
}

export function mapOfficeDto(dto: OfficeDto): Office {
  return {
    id: dto.id,
    name: dto.name,
    departmentId: dto.departmentId,
    wardCode: dto.wardCode,
  };
}

export function mapOfficeListItemDto(dto: OfficeListItemDto): OfficeListItem {
  return {
    id: dto.id,
    name: dto.name,
    departmentId: dto.departmentId,
    departmentName: dto.departmentName ?? '',
    wardCode: dto.wardCode,
    wardName: dto.wardName ?? '',
    officerId: dto.officerId ?? null,
    officerName: dto.officerName ?? null,
    isOnboarded: Boolean(dto.isOnboarded),
    teamCount: dto.teamCount ?? 0,
    createdAt: dto.createdAt ?? '',
  };
}

function mapOfficesPagination(dto: OfficesListDataDto): PaginationMeta {
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

export function mapOfficesListDataDto(dto: OfficesListDataDto): OfficesList {
  return {
    items: (dto.items ?? []).map(mapOfficeListItemDto),
    pagination: mapOfficesPagination(dto),
  };
}

export function mapOfficeDetailDto(dto: OfficeDetailDto): OfficeDetail {
  return {
    ...mapOfficeDto(dto),
    departmentName: dto.departmentName ?? '',
    wardName: dto.wardName ?? '',
    officerId: dto.officerId ?? null,
    officerName: dto.officerName ?? null,
    isOnboarded: Boolean(dto.isOnboarded),
    teams: (dto.teams ?? []).map(mapOfficeTeamDto),
    createdAt: dto.createdAt ?? '',
    updatedAt: dto.updatedAt ?? '',
  };
}

// ─── LEO — GET /v1/offices/my/reports ───────────────────────────────────────

function mapLeoMyReportAssignmentDto(dto: LeoMyReportAssignmentDto): LeoMyReportAssignment {
  return {
    assignmentId: dto.assignmentId,
    teamId: dto.teamId,
    teamName: dto.teamName,
    teamType: dto.teamType,
    // status: dto.status ?? null,
    status: 'checklai',
    progressPercent: dto.progressPercent,
    progressNote: dto.progressNote ?? null,
    note: dto.note ?? null,
    declineReason: dto.declineReason ?? null,
    assignedAt: dto.assignedAt,
    startedAt: dto.startedAt ?? null,
    completedAt: dto.completedAt ?? null,
    progressUpdatedAt: dto.progressUpdatedAt ?? null,
  };
}

function mapLeoMyReportItemDto(dto: LeoMyReportItemDto): LeoMyReportItem {
  return {
    id: dto.id,
    code: dto.code,
    categoryCode: dto.categoryCode,
    categoryName: dto.categoryName,
    severity: dto.severity,
    status: dto.status,
    latitude: dto.latitude,
    longitude: dto.longitude,
    address: dto.address,
    wardCode: dto.wardCode,
    reporterId: dto.reporterId,
    reporterName: dto.reporterName,
    description: dto.description ?? null,
    assignmentCount: dto.assignmentCount,
    priorityScore: dto.priorityScore,
    reporterCount: dto.reporterCount,
    reopenedCount: dto.reopenedCount,
    overallProgressPercent: dto.overallProgressPercent,
    createdAt: dto.createdAt,
    verifiedAt: dto.verifiedAt ?? null,
    dispatchedAt: dto.dispatchedAt ?? null,
    resolvedAt: dto.resolvedAt ?? null,
    closedAt: dto.closedAt ?? null,
    slaResolveDueAt: dto.slaResolveDueAt ?? null,
    assignments: (dto.assignments ?? []).map(mapLeoMyReportAssignmentDto),
  };
}

function mapLeoPagination(dto: LeoOfficePaginationDto): PaginationMeta {
  return {
    page: dto.page,
    pageSize: dto.pageSize,
    totalItems: dto.totalItems,
    totalPages: dto.totalPages,
    hasNext: dto.hasNext,
    hasPrev: dto.hasPrev,
  };
}

export function mapLeoMyReportsDataDto(data: LeoMyReportsDataDto): LeoMyReportsData {
  return {
    localOfficeId: data.localOfficeId,
    localOfficeName: data.localOfficeName,
    wardCode: data.wardCode,
    wardName: data.wardName,
    items: (data.items ?? []).map(mapLeoMyReportItemDto),
    pagination: mapLeoPagination(data.pagination),
  };
}
