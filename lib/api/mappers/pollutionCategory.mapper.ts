import type {
  PollutionCategoryItemDto,
  PollutionCategoryMutationDto,
} from '@/lib/api/dto/pollutionCategory.dto';
import type {
  PollutionCategory,
  PollutionCategoryList,
  PollutionCategoryMutationResult,
} from '@/lib/api/models/pollutionCategory';

function resolveArchived(dto: PollutionCategoryItemDto): boolean {
  if (dto.isArchived === true || dto.archived === true) return true;
  if (dto.isActive === false) return true;
  return false;
}

export function mapPollutionCategoryDto(dto: PollutionCategoryItemDto): PollutionCategory {
  return {
    id: dto.id,
    code: dto.code,
    nameVi: dto.nameVi,
    nameEn: dto.nameEn,
    iconUrl: dto.iconUrl?.trim() ? dto.iconUrl.trim() : null,
    descriptionVi: dto.descriptionVi?.trim() ? dto.descriptionVi.trim() : null,
    isArchived: resolveArchived(dto),
    reportCount: typeof dto.reportCount === 'number' ? dto.reportCount : null,
  };
}

export function mapPollutionCategoryListDataDto(data: {
  items: PollutionCategoryItemDto[];
}): PollutionCategoryList {
  return {
    items: data.items.map(mapPollutionCategoryDto),
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
