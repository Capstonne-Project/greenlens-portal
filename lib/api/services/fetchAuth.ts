import type {
  ChangePasswordData,
  ChangePasswordRequest,
  ForgotPasswordData,
  ForgotPasswordRequest,
  LoginSuccessData,
  ResetPasswordData,
  ResetPasswordRequest,
} from '@/lib/api/types/auth';
import apiService from '../core';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  ApiEnvelope,
  ChangePasswordData,
  ChangePasswordRequest,
  ForgotPasswordData,
  ForgotPasswordRequest,
  LoginSuccessData,
  LoginUserDto,
  ResetPasswordData,
  ResetPasswordRequest,
} from '@/lib/api/types/auth';

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

/** Authenticated — POST /v1/auth/change-password */
export async function changePassword(
  body: ChangePasswordRequest
): Promise<ApiEnvelope<ChangePasswordData>> {
  const res = await apiService.post<ApiEnvelope<ChangePasswordData>>(
    '/v1/auth/change-password',
    body
  );
  return res.data;
}

/** Public — POST /v1/auth/forgot-password (gửi OTP email). */
export async function forgotPassword(
  body: ForgotPasswordRequest
): Promise<ApiEnvelope<ForgotPasswordData>> {
  const res = await apiService.post<ApiEnvelope<ForgotPasswordData>>('/v1/auth/forgot-password', {
    email: body.email.trim(),
  });
  return res.data;
}

/** Public — POST /v1/auth/reset-password (OTP + mật khẩu mới). */
export async function resetPassword(
  body: ResetPasswordRequest
): Promise<ApiEnvelope<ResetPasswordData>> {
  const res = await apiService.post<ApiEnvelope<ResetPasswordData>>('/v1/auth/reset-password', {
    email: body.email.trim(),
    otpCode: body.otpCode.trim(),
    newPassword: body.newPassword,
  });
  return res.data;
}

export default {
  loginWithEmailPassword,
  changePassword,
  forgotPassword,
  resetPassword,
};
