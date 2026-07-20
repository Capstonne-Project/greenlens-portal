/** FE models — danh mục ô nhiễm (admin + catalog). */

export type PollutionCategorySortBy =
  | 'code'
  | 'nameVi'
  | 'nameEn'
  | 'isActive'
  | 'reportCount'
  | 'createdAt';

export interface PollutionCategory {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl: string | null;
  descriptionVi: string | null;
  isActive: boolean;
  /** Derived từ !isActive — dùng cho UI archive/restore. */
  isArchived: boolean;
  reportCount: number;
  createdAt: string | null;
}

export interface PollutionCategoryPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Catalog / non-paginated list. */
export interface PollutionCategoryList {
  items: PollutionCategory[];
}

/** Admin paginated list — GET /v1/admin/pollution-categories */
export interface PollutionCategoryAdminList {
  items: PollutionCategory[];
  pagination: PollutionCategoryPagination;
}

export interface AdminPollutionCategoriesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: PollutionCategorySortBy | string;
  sortDesc?: boolean;
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
