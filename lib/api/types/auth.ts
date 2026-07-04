/** Shared auth API shapes — safe for L1 / refresh client without circular imports. */

export type { ApiEnvelope } from '@/lib/api/types/envelope';

export interface LoginUserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isEmailVerified: boolean;
}

export interface LoginSuccessData {
  accessToken: string;
  refreshToken: string;
  user: LoginUserDto;
}
