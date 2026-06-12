export interface CreateDepartmentBodyDto {
  name: string;
  provinceCode: string;
}

export interface UpdateDepartmentBodyDto {
  name: string;
}

export interface AssignDepartmentOfficerBodyDto {
  userId: string;
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
  officerId?: string | null;
  officerName?: string | null;
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

/** DEO điều phối cấp Sở — GET /v1/departments/{id}. */
export interface DepartmentDeoDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
}

export interface DepartmentDetailDto {
  id: string;
  name: string;
  provinceCode: string;
  provinceName: string;
  isActive: boolean;
  /** Legacy flat fields — một số response cũ. */
  officerId?: string | null;
  officerName?: string | null;
  deo?: DepartmentDeoDto | null;
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
