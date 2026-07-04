import type { ApiEnvelope, LoginSuccessData, LoginUserDto } from '@/lib/api/types/auth';
import apiService from '../core';

export type { ApiEnvelope, LoginSuccessData, LoginUserDto };

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiErrorEnvelope {
  code?: string;
  message?: string;
  status?: number;
  data?: unknown;
}

export async function loginWithEmailPassword(
  body: LoginRequest
): Promise<ApiEnvelope<LoginSuccessData>> {
  const res = await apiService.post<ApiEnvelope<LoginSuccessData>>('/v1/auth/login', body);
  return res.data;
}

export default {
  loginWithEmailPassword,
};
