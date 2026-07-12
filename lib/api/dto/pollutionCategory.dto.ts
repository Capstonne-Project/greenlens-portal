export interface PollutionCategoryItemDto {
  id?: string;
  code?: string;
  nameVi?: string;
  nameEn?: string;
  iconUrl?: string | null;
  descriptionVi?: string | null;
  descriptionEn?: string | null;
  isArchived?: boolean;
  isActive?: boolean;
  archived?: boolean;
  reportCount?: number;
  createdAt?: string | null;
}

export interface PollutionCategoryPaginationDto {
  page?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

/** Admin list — có pagination. Catalog có thể chỉ có items. */
export interface PollutionCategoryListDataDto {
  items?: PollutionCategoryItemDto[];
  pagination?: PollutionCategoryPaginationDto;
}

export interface CreatePollutionCategoryBodyDto {
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl?: string;
}

export interface UpdatePollutionCategoryBodyDto {
  nameVi: string;
  nameEn: string;
  iconUrl?: string;
}

export interface ArchivePollutionCategoryBodyDto {
  archive: boolean;
}

export interface PollutionCategoryMutationDto {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl?: string | null;
}
