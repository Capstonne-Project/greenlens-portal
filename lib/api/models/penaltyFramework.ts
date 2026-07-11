/** FE models — khung xử phạt môi trường (admin). */

export interface PenaltyFramework {
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

export interface PenaltyFrameworkPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PenaltyFrameworksList {
  items: PenaltyFramework[];
  pagination: PenaltyFrameworkPagination;
}

export interface PenaltyFrameworksListParams {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  violationLevel?: string;
  isActive?: boolean;
}

export interface CreatePenaltyFrameworkInput {
  categoryId: string;
  violationLevel: string;
  minAmount: number;
  maxAmount: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface UpdatePenaltyFrameworkInput {
  minAmount: number;
  maxAmount: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface TogglePenaltyFrameworkInput {
  activate: boolean;
}

export interface CreatedPenaltyFramework {
  id: string;
  categoryId: string;
  violationLevel: string;
  minAmount: number;
  maxAmount: number;
  effectiveFrom: string;
}
