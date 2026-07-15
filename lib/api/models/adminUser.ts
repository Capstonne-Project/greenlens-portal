/** FE models ổn định — hooks (L4) và components (L6) chỉ import từ đây. */

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUser {
  googleId: string | null;
  updatedAt: string | null;
}

export interface AdminRole {
  name: string;
  description: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AdminUsersList {
  items: AdminUser[];
  pagination: PaginationMeta;
}

export interface AdminUsersListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  isEmailVerified?: boolean;
}

export interface CreateAdminUserInput {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

export interface UpdateAdminUserInput {
  fullName: string;
  phoneNumber?: string;
  role: string;
  isEmailVerified: boolean;
}

export interface AdminUserMutationResult {
  userId: string;
  message: string;
}
