/** FE models — department (ủy ban / Sở TNMT cấp tỉnh). */

export interface Department {
  id: string;
  name: string;
  provinceCode: string;
}

export interface DepartmentListItem {
  id: string;
  name: string;
  provinceCode: string;
  provinceName: string;
  isActive: boolean;
  officeCount: number;
  officerId: string | null;
  officerName: string | null;
  createdAt: string;
}

export interface DepartmentOfficeSummary {
  id: string;
  name: string;
  wardCode: string;
  wardName: string;
  officerId: string | null;
  officerName: string | null;
  isOnboarded: boolean;
  teamCount: number;
}

export interface DepartmentDeo {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
}

export interface DepartmentDetail {
  id: string;
  name: string;
  provinceCode: string;
  provinceName: string;
  isActive: boolean;
  deo: DepartmentDeo | null;
  officerId: string | null;
  officerName: string | null;
  offices: DepartmentOfficeSummary[];
  createdAt: string;
  updatedAt: string | null;
}

export interface DepartmentPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface DepartmentsList {
  items: DepartmentListItem[];
  pagination: DepartmentPagination;
}

export interface DepartmentsListParams {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
}

export interface CreateDepartmentInput {
  name: string;
  provinceCode: string;
}

export interface UpdateDepartmentInput {
  name: string;
}

export interface AssignDepartmentOfficerInput {
  userId: string;
}
