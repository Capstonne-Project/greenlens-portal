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

/** GET /v1/departments/my-offices — office item */
export interface MyOfficesOfficeItem extends DepartmentOfficeSummary {
  createdAt: string;
}

/** GET /v1/departments/my-offices — 200 data */
export interface MyOffices {
  departmentId: string;
  departmentName: string;
  provinceCode: string;
  offices: MyOfficesOfficeItem[];
  pagination: DepartmentPagination;
}

/** GET /v1/departments/my-offices — giá trị `sortBy` hợp lệ. */
export type MyOfficesSortBy = 'name' | 'wardName' | 'officerName' | 'teamCount' | 'createdAt';

/** Page size mặc định cho dropdown phường/xã (khớp BE default 20). */
export const MY_OFFICES_PAGE_SIZE = 20;

export interface MyOfficesParams {
  page?: number;
  pageSize?: number;
  /** Tìm theo tên văn phòng, phường/xã hoặc tên LEO. */
  search?: string;
  isOnboarded?: boolean;
  /** API hỗ trợ — không truyền từ UI company dialog. */
  sortBy?: MyOfficesSortBy;
  sortDesc?: boolean;
}
