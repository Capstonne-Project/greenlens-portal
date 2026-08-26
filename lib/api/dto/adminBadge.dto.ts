export interface AdminBadgeItemDto {
  id?: string;
  code?: string;
  nameVi?: string;
  nameEn?: string;
  description?: string | null;
  iconUrl?: string | null;
  isActive?: boolean;
  requiredPoints?: number;
  requiredReportCount?: number;
  requiredStreakDays?: number;
  requiredActionCount?: number;
  createdAt?: string | null;
}

export interface UpdateAdminBadgeThresholdBodyDto {
  threshold: number;
}

export interface AdminBadgePaginationDto {
  page?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface AdminBadgeListDataDto {
  items?: AdminBadgeItemDto[];
  pagination?: AdminBadgePaginationDto;
}

export interface UpdateAdminBadgeBodyDto {
  nameVi: string;
  nameEn: string;
  description?: string;
  iconUrl?: string;
}

export interface ToggleAdminBadgeBodyDto {
  isActive: boolean;
}
