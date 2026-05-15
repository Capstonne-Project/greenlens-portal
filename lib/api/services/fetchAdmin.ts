import type { ApiEnvelope } from '@/lib/api/types/auth';
import apiService from '../core';

export interface AdminUserItem {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AdminUsersPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AdminUsersPaged {
  items: AdminUserItem[];
  pagination: AdminUsersPagination;
}

export interface AdminUsersQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  isEmailVerified?: boolean;
}

export async function fetchAdminUsers(
  params?: AdminUsersQueryParams
): Promise<ApiEnvelope<AdminUsersPaged>> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.role?.trim()) query.role = params.role.trim();
  if (params?.isEmailVerified !== undefined) query.isEmailVerified = params.isEmailVerified;

  const res = await apiService.get<ApiEnvelope<AdminUsersPaged>>('/v1/admin/users', query);
  return res.data;
}

export async function fetchAdminAllUsers(): Promise<ApiEnvelope<AdminUserItem[]>> {
  const res = await apiService.get<ApiEnvelope<AdminUserItem[]>>('/v1/admin/users/all');
  return res.data;
}

export interface CreateAdminUserBody {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

export interface CreateAdminUserData {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  message: string;
}

export interface UpdateAdminUserBody {
  fullName: string;
  phoneNumber?: string;
  role: string;
  isEmailVerified: boolean;
}

export interface AdminUserMutationData {
  userId: string;
  message: string;
}

export async function createAdminUser(
  body: CreateAdminUserBody
): Promise<ApiEnvelope<CreateAdminUserData>> {
  const res = await apiService.post<ApiEnvelope<CreateAdminUserData>>('/v1/admin/users', body);
  return res.data;
}

export async function updateAdminUser(
  id: string,
  body: UpdateAdminUserBody
): Promise<ApiEnvelope<AdminUserMutationData>> {
  const res = await apiService.put<ApiEnvelope<AdminUserMutationData>>(
    `/v1/admin/users/${id}`,
    body
  );
  return res.data;
}

export async function deleteAdminUser(id: string): Promise<ApiEnvelope<AdminUserMutationData>> {
  const res = await apiService.delete<ApiEnvelope<AdminUserMutationData>>(`/v1/admin/users/${id}`);
  return res.data;
}

export default {
  fetchAdminUsers,
  fetchAdminAllUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
};
