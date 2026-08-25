/** FE models — huy hiệu gamification (admin). */

export type AdminBadgeSortBy =
  | 'code'
  | 'nameVi'
  | 'nameEn'
  | 'isActive'
  | 'requiredPoints'
  | 'requiredReportCount'
  | 'requiredStreakDays'
  | 'requiredActionCount'
  | 'createdAt';

export interface AdminBadge {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  requiredPoints: number | null;
  requiredReportCount: number | null;
  requiredStreakDays: number | null;
  requiredActionCount: number | null;
  createdAt: string | null;
}

export interface AdminBadgePagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AdminBadgeList {
  items: AdminBadge[];
  pagination: AdminBadgePagination;
}

export interface AdminBadgesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: AdminBadgeSortBy | string;
  sortDesc?: boolean;
}

export interface UpdateAdminBadgeInput {
  nameVi: string;
  nameEn: string;
  description?: string;
  iconUrl?: string;
}

export interface ToggleAdminBadgeInput {
  isActive: boolean;
}

export interface UpdateAdminBadgeThresholdInput {
  threshold: number;
}
