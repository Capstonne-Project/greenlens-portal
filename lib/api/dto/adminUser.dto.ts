/** DTO khớp Swagger BE — đổi file này khi contract đổi, không sửa UI. */

export interface AdminUserDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AdminUsersPaginationDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AdminUsersPagedDto {
  items: AdminUserDto[];
  pagination: AdminUsersPaginationDto;
}

export interface AdminUsersListParamsDto {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  isEmailVerified?: boolean;
}

export interface CreateAdminUserBodyDto {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

export interface CreateAdminUserDataDto {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  message: string;
}

export interface UpdateAdminUserBodyDto {
  fullName: string;
  phoneNumber?: string;
  role: string;
  isEmailVerified: boolean;
}

export interface AdminUserMutationDataDto {
  userId: string;
  message: string;
}

export interface ChangeUserRoleBodyDto {
  newRole: string;
}
