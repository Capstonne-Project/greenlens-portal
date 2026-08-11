export interface ProvinceDto {
  code: string;
  name: string;
  boundaryUrl?: string | null;
}

export interface ProvinceListDataDto {
  items: ProvinceDto[];
}

export interface WardDto {
  code: string;
  name: string;
  unitAbbreviation?: string | null;
  boundaryUrl?: string | null;
}

export interface WardListDataDto {
  items: WardDto[];
}

/** GET /v1/catalog/wards/{wardCode}/boundary — đề xuất BE, chưa có trong Swagger hiện tại. */
export interface WardBoundaryDto {
  wardCode: string;
  boundaryUrl?: string | null;
}
