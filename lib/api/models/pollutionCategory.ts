/** FE models — danh mục ô nhiễm (admin + catalog). */

export interface PollutionCategory {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl: string | null;
  descriptionVi: string | null;
  isArchived: boolean;
  reportCount: number | null;
}

export interface PollutionCategoryList {
  items: PollutionCategory[];
}

export interface CreatePollutionCategoryInput {
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl?: string;
}

export interface UpdatePollutionCategoryInput {
  nameVi: string;
  nameEn: string;
  iconUrl?: string;
}

export interface ArchivePollutionCategoryInput {
  archive: boolean;
}

export interface PollutionCategoryMutationResult {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl: string | null;
}
