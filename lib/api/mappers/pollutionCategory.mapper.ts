import type {
  PollutionCategoryItemDto,
  PollutionCategoryListDataDto,
  PollutionCategoryMutationDto,
  PollutionCategoryPaginationDto,
} from '@/lib/api/dto/pollutionCategory.dto';
import type {
  PollutionCategory,
  PollutionCategoryAdminList,
  PollutionCategoryList,
  PollutionCategoryMutationResult,
  PollutionCategoryPagination,
} from '@/lib/api/models/pollutionCategory';

function resolveIsActive(dto: PollutionCategoryItemDto): boolean {
  if (typeof dto.isActive === 'boolean') return dto.isActive;
  if (dto.isArchived === true || dto.archived === true) return false;
  return true;
}

export function mapPollutionCategoryDto(dto: PollutionCategoryItemDto): PollutionCategory {
  const isActive = resolveIsActive(dto);
  return {
    id: dto.id ?? '',
    code: dto.code ?? '',
    nameVi: dto.nameVi ?? '',
    nameEn: dto.nameEn ?? '',
    iconUrl: dto.iconUrl?.trim() ? dto.iconUrl.trim() : null,
    descriptionVi: dto.descriptionVi?.trim() ? dto.descriptionVi.trim() : null,
    isActive,
    isArchived: !isActive,
    reportCount: typeof dto.reportCount === 'number' ? dto.reportCount : 0,
    createdAt: dto.createdAt?.trim() ? dto.createdAt.trim() : null,
  };
}

export function mapPollutionCategoryPaginationDto(
  dto?: PollutionCategoryPaginationDto
): PollutionCategoryPagination {
  return {
    page: dto?.page ?? 1,
    pageSize: dto?.pageSize ?? 0,
    totalItems: dto?.totalItems ?? 0,
    totalPages: dto?.totalPages ?? 0,
    hasNext: dto?.hasNext ?? false,
    hasPrev: dto?.hasPrev ?? false,
  };
}

/** Catalog — chỉ items. */
export function mapPollutionCategoryListDataDto(
  data: PollutionCategoryListDataDto
): PollutionCategoryList {
  return {
    items: (data.items ?? []).map(mapPollutionCategoryDto),
  };
}

/** Admin — items + pagination. */
export function mapPollutionCategoryAdminListDataDto(
  data: PollutionCategoryListDataDto
): PollutionCategoryAdminList {
  return {
    items: (data.items ?? []).map(mapPollutionCategoryDto),
    pagination: mapPollutionCategoryPaginationDto(data.pagination),
  };
}

export function mapPollutionCategoryMutationDto(
  dto: PollutionCategoryMutationDto
): PollutionCategoryMutationResult {
  return {
    id: dto.id,
    code: dto.code,
    nameVi: dto.nameVi,
    nameEn: dto.nameEn,
    iconUrl: dto.iconUrl?.trim() ? dto.iconUrl.trim() : null,
  };
}
