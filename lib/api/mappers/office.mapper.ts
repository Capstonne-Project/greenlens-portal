import type {
  OfficeDetailDto,
  OfficeDto,
  OfficeListItemDto,
  OfficesListDataDto,
  OfficeTeamDto,
} from '@/lib/api/dto/office.dto';
import type {
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
