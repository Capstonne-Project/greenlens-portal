import type {
  DepartmentDetailDto,
  DepartmentDto,
  DepartmentListItemDto,
  DepartmentOfficeSummaryDto,
  DepartmentsListDataDto,
} from '@/lib/api/dto/department.dto';
import type {
  Department,
  DepartmentDetail,
  DepartmentListItem,
  DepartmentOfficeSummary,
  DepartmentsList,
} from '@/lib/api/models/department';

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
  return {
    id: dto.id,
    name: dto.name,
    provinceCode: dto.provinceCode.trim(),
    provinceName: dto.provinceName,
    isActive: dto.isActive,
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
