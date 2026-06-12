import type {
  DepartmentDeoDto,
  DepartmentDetailDto,
  DepartmentDto,
  DepartmentListItemDto,
  DepartmentOfficeSummaryDto,
  DepartmentsListDataDto,
} from '@/lib/api/dto/department.dto';
import type {
  Department,
  DepartmentDeo,
  DepartmentDetail,
  DepartmentListItem,
  DepartmentOfficeSummary,
  DepartmentsList,
} from '@/lib/api/models/department';

function mapDepartmentDeoDto(dto: DepartmentDeoDto): DepartmentDeo {
  return {
    id: dto.id,
    fullName: dto.fullName.trim(),
    email: dto.email.trim(),
    phoneNumber: dto.phoneNumber?.trim() ? dto.phoneNumber.trim() : null,
    avatarUrl: dto.avatarUrl?.trim() ? dto.avatarUrl.trim() : null,
  };
}

export function mapDepartmentDto(dto: DepartmentDto): Department {
  return {
    id: dto.id,
    name: dto.name,
    provinceCode: dto.provinceCode.trim(),
  };
}

export function mapDepartmentListItemDto(dto: DepartmentListItemDto): DepartmentListItem {
  return {
    id: dto.id,
    name: dto.name,
    provinceCode: dto.provinceCode.trim(),
    provinceName: dto.provinceName,
    isActive: dto.isActive,
    officeCount: dto.officeCount,
    officerId: dto.officerId ?? null,
    officerName: dto.officerName?.trim() ? dto.officerName.trim() : null,
    createdAt: dto.createdAt,
  };
}

function mapDepartmentOfficeSummaryDto(dto: DepartmentOfficeSummaryDto): DepartmentOfficeSummary {
  return {
    id: dto.id,
    name: dto.name,
    wardCode: dto.wardCode,
    wardName: dto.wardName,
    officerId: dto.officerId,
    officerName: dto.officerName,
    isOnboarded: dto.isOnboarded,
    teamCount: dto.teamCount,
  };
}

export function mapDepartmentDetailDto(dto: DepartmentDetailDto): DepartmentDetail {
  const deo = dto.deo ? mapDepartmentDeoDto(dto.deo) : null;
  const officerId = deo?.id ?? dto.officerId ?? null;
  const officerName = deo?.fullName ?? (dto.officerName?.trim() ? dto.officerName.trim() : null);

  return {
    id: dto.id,
    name: dto.name,
    provinceCode: dto.provinceCode.trim(),
    provinceName: dto.provinceName,
    isActive: dto.isActive,
    deo,
    officerId,
    officerName,
    offices: (dto.offices ?? []).map(mapDepartmentOfficeSummaryDto),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt ?? null,
  };
}

export function mapDepartmentsListDataDto(data: DepartmentsListDataDto): DepartmentsList {
  const totalPages = Math.max(1, Math.ceil(data.totalCount / Math.max(data.pageSize, 1)));
  return {
    items: data.items.map(mapDepartmentListItemDto),
    pagination: {
      page: data.page,
      pageSize: data.pageSize,
      totalItems: data.totalCount,
      totalPages,
      hasNext: data.page < totalPages,
      hasPrev: data.page > 1,
    },
  };
}
