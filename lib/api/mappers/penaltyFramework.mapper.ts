import type {
  CreatePenaltyFrameworkDataDto,
  PenaltyFrameworkDto,
  PenaltyFrameworksListDataDto,
  PenaltyFrameworkPaginationDto,
} from '@/lib/api/dto/penaltyFramework.dto';
import type {
  CreatedPenaltyFramework,
  PenaltyFramework,
  PenaltyFrameworkPagination,
  PenaltyFrameworksList,
} from '@/lib/api/models/penaltyFramework';

export function mapPenaltyFrameworkDto(dto: PenaltyFrameworkDto): PenaltyFramework {
  return {
    id: dto.id ?? '',
    categoryId: dto.categoryId ?? '',
    categoryNameVi: dto.categoryNameVi ?? '',
    violationLevel: dto.violationLevel ?? '',
    minAmount: dto.minAmount ?? 0,
    maxAmount: dto.maxAmount ?? 0,
    currency: dto.currency ?? 'VND',
    effectiveFrom: dto.effectiveFrom ?? '',
    effectiveTo: dto.effectiveTo ?? null,
    isActive: dto.isActive ?? false,
    createdAt: dto.createdAt ?? '',
  };
}

export function mapPenaltyFrameworkPaginationDto(
  dto: PenaltyFrameworkPaginationDto
): PenaltyFrameworkPagination {
  return {
    page: dto.page ?? 1,
    pageSize: dto.pageSize ?? 0,
    totalItems: dto.totalItems ?? 0,
    totalPages: dto.totalPages ?? 0,
    hasNext: dto.hasNext ?? false,
    hasPrev: dto.hasPrev ?? false,
  };
}

export function mapPenaltyFrameworksListDataDto(
  dto: PenaltyFrameworksListDataDto
): PenaltyFrameworksList {
  return {
    items: dto.items.map(mapPenaltyFrameworkDto),
    pagination: mapPenaltyFrameworkPaginationDto(dto.pagination),
  };
}

export function mapCreatePenaltyFrameworkDataDto(
  dto: CreatePenaltyFrameworkDataDto
): CreatedPenaltyFramework {
  return {
    id: dto.id ?? '',
    categoryId: dto.categoryId ?? '',
    violationLevel: dto.violationLevel ?? '',
    minAmount: dto.minAmount ?? 0,
    maxAmount: dto.maxAmount ?? 0,
    effectiveFrom: dto.effectiveFrom ?? '',
  };
}
