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
  OfficeStaffItemDto,
  OfficeStaffListDataDto,
  RecruitOfficeStaffDataDto,
} from '@/lib/api/dto/office.dto';
import type {
  LeoMyReportAssignment,
  LeoMyReportItem,
  LeoMyReportsData,
  LeoReportAssignmentStatus,
  Office,
  OfficeDetail,
  OfficeListItem,
  OfficesList,
  OfficeStaffList,
  OfficeStaffMember,
  OfficeStaffRoleFilter,
  OfficeTeam,
  PaginationMeta,
  RecruitOfficeStaffResult,
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

const ASSIGNMENT_STATUSES: LeoReportAssignmentStatus[] = [
  'Assigned',
  'InProgress',
  'Completed',
  'Declined',
];

function mapAssignmentStatus(value: string | undefined): LeoReportAssignmentStatus {
  if (value && ASSIGNMENT_STATUSES.includes(value as LeoReportAssignmentStatus)) {
    return value as LeoReportAssignmentStatus;
  }
  return 'Assigned';
}

function mapLeoMyReportAssignmentDto(dto: LeoMyReportAssignmentDto): LeoMyReportAssignment {
  return {
    assignmentId: dto.assignmentId,
    teamId: dto.teamId,
    teamName: dto.teamName,
    teamType: dto.teamType,
    status: mapAssignmentStatus(dto.status),
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
    startedAt: dto.startedAt ?? null,
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

const OFFICE_STAFF_ROLE_FILTERS: OfficeStaffRoleFilter[] = [
  'Citizen',
  'DEO',
  'LEO',
  'Cleaner',
  'CompanyManager',
  'CompanyStaff',
  'Inspector',
  'Admin',
];

function mapOfficeStaffRole(value: string | undefined): OfficeStaffRoleFilter {
  if (value && OFFICE_STAFF_ROLE_FILTERS.includes(value as OfficeStaffRoleFilter)) {
    return value as OfficeStaffRoleFilter;
  }
  return 'Citizen';
}

function mapOfficeStaffItemDto(dto: OfficeStaffItemDto): OfficeStaffMember {
  const raw = dto as OfficeStaffItemDto & { CreatedAt?: string };
  const createdAt = dto.createdAt ?? raw.CreatedAt ?? '';

  return {
    userId: dto.userId,
    fullName: dto.fullName,
    email: dto.email,
    phoneNumber: dto.phoneNumber ?? null,
    avatarUrl: dto.avatarUrl ?? null,
    role: mapOfficeStaffRole(typeof dto.role === 'string' ? dto.role : undefined),
    teamId: dto.teamId ?? null,
    teamName: dto.teamName ?? null,
    isLeader: Boolean(dto.isLeader),
    createdAt,
  };
}

export function mapOfficeStaffListDataDto(data: OfficeStaffListDataDto): OfficeStaffList {
  return {
    items: (data.items ?? []).map(mapOfficeStaffItemDto),
    pagination: mapLeoPagination(data.pagination),
  };
}

export function mapRecruitOfficeStaffDataDto(
  data: RecruitOfficeStaffDataDto
): RecruitOfficeStaffResult {
  return {
    userId: data.userId,
    email: data.email,
    fullName: data.fullName,
    assignedRole: data.assignedRole,
    localOfficeId: data.localOfficeId,
    teamId: data.teamId ?? null,
    teamMemberId: data.teamMemberId ?? null,
  };
}
