export interface PollutionCategoryItemDto {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl?: string | null;
  descriptionVi?: string | null;
  descriptionEn?: string | null;
  isArchived?: boolean;
  isActive?: boolean;
  archived?: boolean;
  reportCount?: number;
}

export interface PollutionCategoryListDataDto {
  items: PollutionCategoryItemDto[];
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
