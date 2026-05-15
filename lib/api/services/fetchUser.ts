import type { ApiEnvelope } from './fetchAuth';
import apiService from '../core';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isEmailVerified: boolean;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  googleId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface UpdateProfileBody {
  fullName: string;
  phoneNumber?: string;
}

export interface UpdateProfileResult {
  userId: string;
  message: string;
}

export interface AvatarUploadResult {
  avatarUrl: string;
  message: string;
}

export async function getMyProfile(): Promise<ApiEnvelope<UserProfile>> {
  const res = await apiService.get<ApiEnvelope<UserProfile>>('/v1/users/profile');
  return res.data;
}

export async function updateMyProfile(
  body: UpdateProfileBody
): Promise<ApiEnvelope<UpdateProfileResult>> {
  const res = await apiService.put<ApiEnvelope<UpdateProfileResult>>('/v1/users/profile', body);
  return res.data;
}

export async function uploadMyAvatar(file: File): Promise<ApiEnvelope<AvatarUploadResult>> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiService.upload<ApiEnvelope<AvatarUploadResult>>(
    '/v1/users/avatar',
    formData
  );
  return res.data;
}

export default {
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
};
