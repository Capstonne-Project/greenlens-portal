/** Catalog GET /v1/waste-tags — chỉ tag active. */
export interface WasteTagCatalogItemDto {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl?: string | null;
  description?: string | null;
  displayOrder: number;
}

export interface WasteTagCatalogDataDto {
  tags: WasteTagCatalogItemDto[];
}

export interface WasteTagItemDto {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl?: string | null;
  description?: string | null;
  displayOrder: number;
  isActive?: boolean;
}

export interface WasteTagListDataDto {
  items: WasteTagItemDto[];
}

export interface CreateWasteTagBodyDto {
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl?: string;
  description?: string;
  displayOrder: number;
}

export interface UpdateWasteTagBodyDto {
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl?: string;
  description?: string;
  displayOrder: number;
}

export interface ToggleWasteTagBodyDto {
  isActive: boolean;
}

export interface WasteTagMutationDto {
  id: string;
  code: string;
}
