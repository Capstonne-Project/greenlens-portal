export interface CreateOfficeBodyDto {
  name: string;
  departmentId: string;
  wardCode: string;
  officerId?: string;
}

export interface OfficeDto {
  id: string;
  name: string;
  departmentId: string;
  wardCode: string;
}

export interface OfficeListItemDto {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  wardCode: string;
  wardName: string;
  officerId?: string | null;
  officerName?: string | null;
  isOnboarded: boolean;
  teamCount: number;
  createdAt: string;
}

export interface OfficesListDataDto {
  items: OfficeListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface OfficesListParamsDto {
  page?: number;
  pageSize?: number;
  departmentId?: string;
  isOnboarded?: boolean;
}

export interface OfficeTeamDto {
  id: string;
  name: string;
  teamType: string;
  isActive: boolean;
  memberCount: number;
}

export interface OfficeDetailDto extends OfficeDto {
  departmentName: string;
  wardName: string;
  officerId?: string | null;
  officerName?: string | null;
  isOnboarded: boolean;
  teams: OfficeTeamDto[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOfficeBodyDto {
  name: string;
}

export interface AssignOfficeOfficerBodyDto {
  userId: string;
}
