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
