import type {
  AdminBadgeItemDto,
  AdminBadgeListDataDto,
  AdminBadgePaginationDto,
} from '@/lib/api/dto/adminBadge.dto';
import type { AdminBadge, AdminBadgeList, AdminBadgePagination } from '@/lib/api/models/adminBadge';

function optionalNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function mapAdminBadgeDto(dto: AdminBadgeItemDto): AdminBadge {
  return {
    id: dto.id ?? '',
    code: dto.code ?? '',
    nameVi: dto.nameVi ?? '',
    nameEn: dto.nameEn ?? '',
    description: dto.description?.trim() ? dto.description.trim() : null,
    iconUrl: dto.iconUrl?.trim() ? dto.iconUrl.trim() : null,
    isActive: dto.isActive ?? true,
    requiredPoints: optionalNumber(dto.requiredPoints),
    requiredReportCount: optionalNumber(dto.requiredReportCount),
    requiredStreakDays: optionalNumber(dto.requiredStreakDays),
    createdAt: dto.createdAt?.trim() ? dto.createdAt.trim() : null,
  };
}

export function mapAdminBadgePaginationDto(dto?: AdminBadgePaginationDto): AdminBadgePagination {
  return {
    page: dto?.page ?? 1,
    pageSize: dto?.pageSize ?? 0,
    totalItems: dto?.totalItems ?? 0,
    totalPages: dto?.totalPages ?? 0,
    hasNext: dto?.hasNext ?? false,
    hasPrev: dto?.hasPrev ?? false,
  };
}

export function mapAdminBadgeListDataDto(data: AdminBadgeListDataDto): AdminBadgeList {
  return {
    items: (data.items ?? []).map(mapAdminBadgeDto),
    pagination: mapAdminBadgePaginationDto(data.pagination),
  };
}
