/** Shared auth API shapes — safe for L1 / refresh client without circular imports. */

export type { ApiEnvelope } from '@/lib/api/types/envelope';

export interface LoginUserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isEmailVerified: boolean;
  mustChangePassword?: boolean;
}

export interface LoginSuccessData {
  accessToken: string;
  refreshToken: string;
  user: LoginUserDto;
}

/** POST /v1/auth/change-password — ChangePasswordCommand */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** ChangePasswordResponse data payload */
export interface ChangePasswordData {
  message: string;
}
