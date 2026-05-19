export interface CreateDepartmentBodyDto {
  name: string;
  provinceCode: string;
}

export interface UpdateDepartmentBodyDto {
  name: string;
}

export interface DepartmentDto {
  id: string;
  name: string;
  provinceCode: string;
}

export interface DepartmentListItemDto {
  id: string;
  name: string;
  provinceCode: string;
  provinceName: string;
  isActive: boolean;
  officeCount: number;
  createdAt: string;
}

export interface DepartmentOfficeSummaryDto {
  id: string;
  name: string;
  wardCode: string;
  wardName: string;
  officerId: string | null;
  officerName: string | null;
  isOnboarded: boolean;
  teamCount: number;
}

export interface DepartmentDetailDto {
  id: string;
  name: string;
  provinceCode: string;
  provinceName: string;
  isActive: boolean;
  offices: DepartmentOfficeSummaryDto[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface DepartmentsListDataDto {
  items: DepartmentListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}
