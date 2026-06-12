import type {
  WasteTagCatalogItemDto,
  WasteTagItemDto,
  WasteTagMutationDto,
} from '@/lib/api/dto/wasteTag.dto';
import type { WasteTag, WasteTagList, WasteTagMutationResult } from '@/lib/api/models/wasteTag';

export function mapWasteTagCatalogItemDto(dto: WasteTagCatalogItemDto): WasteTag {
  return {
    id: dto.id,
    code: dto.code,
    nameVi: dto.nameVi,
    nameEn: dto.nameEn,
    iconUrl: dto.iconUrl?.trim() ? dto.iconUrl.trim() : null,
    description: dto.description?.trim() ? dto.description.trim() : null,
    displayOrder: dto.displayOrder,
    isActive: true,
  };
}

export function mapWasteTagCatalogDataDto(data: { tags: WasteTagCatalogItemDto[] }): WasteTagList {
  return {
    items: data.tags.map(mapWasteTagCatalogItemDto),
  };
}

export function mapWasteTagDto(dto: WasteTagItemDto): WasteTag {
  return {
    id: dto.id,
    code: dto.code,
    nameVi: dto.nameVi,
    nameEn: dto.nameEn,
    iconUrl: dto.iconUrl?.trim() ? dto.iconUrl.trim() : null,
    description: dto.description?.trim() ? dto.description.trim() : null,
    displayOrder: dto.displayOrder,
    isActive: dto.isActive ?? true,
  };
}

export function mapWasteTagListDataDto(data: { items: WasteTagItemDto[] }): WasteTagList {
  return {
    items: data.items.map(mapWasteTagDto),
  };
}

export function mapWasteTagMutationDto(dto: WasteTagMutationDto): WasteTagMutationResult {
  return {
    id: dto.id,
    code: dto.code,
  };
}
