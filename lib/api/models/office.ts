export interface Office {
  id: string;
  name: string;
  departmentId: string;
  wardCode: string;
}

export interface OfficeListItem {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  wardCode: string;
  wardName: string;
  officerId: string | null;
  officerName: string | null;
  isOnboarded: boolean;
  teamCount: number;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface OfficesList {
  items: OfficeListItem[];
  pagination: PaginationMeta;
}

export interface OfficesListParams {
  page?: number;
  pageSize?: number;
  departmentId?: string;
  isOnboarded?: boolean;
}

export interface UpdateOfficeInput {
  name: string;
}

export interface OfficeTeam {
  id: string;
  name: string;
  teamType: string;
  isActive: boolean;
  memberCount: number;
}

export interface OfficeDetail extends Office {
  departmentName: string;
  wardName: string;
  officerId: string | null;
  officerName: string | null;
  isOnboarded: boolean;
  teams: OfficeTeam[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfficeInput {
  name: string;
  departmentId: string;
  wardCode: string;
  officerId?: string;
}

export interface AssignOfficeOfficerInput {
  userId: string;
}

export interface ChangeUserRoleInput {
  newRole: string;
}
