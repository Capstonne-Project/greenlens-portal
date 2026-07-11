/** DTO khớp Swagger BE — khung xử phạt môi trường (admin). */

export interface PenaltyFrameworkDto {
  id: string;
  categoryId: string;
  categoryNameVi: string;
  violationLevel: string;
  minAmount: number;
  maxAmount: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PenaltyFrameworkPaginationDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PenaltyFrameworksListDataDto {
  items: PenaltyFrameworkDto[];
  pagination: PenaltyFrameworkPaginationDto;
}

export interface PenaltyFrameworksListParamsDto {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  violationLevel?: string;
  isActive?: boolean;
}

export interface CreatePenaltyFrameworkBodyDto {
  categoryId: string;
  violationLevel: string;
  minAmount: number;
  maxAmount: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface UpdatePenaltyFrameworkBodyDto {
  minAmount: number;
  maxAmount: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface TogglePenaltyFrameworkBodyDto {
  activate: boolean;
}

export interface CreatePenaltyFrameworkDataDto {
  id: string;
  categoryId: string;
  violationLevel: string;
  minAmount: number;
  maxAmount: number;
  effectiveFrom: string;
}
