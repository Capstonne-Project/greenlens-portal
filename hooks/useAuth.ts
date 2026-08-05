'use client';

import { isAxiosError } from '@/lib/api/core';
import { persistAuthSession } from '@/lib/api/authSessionClient';
import {
  changePassword,
  forgotPassword,
  loginWithEmailPassword,
  resetPassword,
} from '@/lib/api/services/fetchAuth';
import type {
  ApiErrorEnvelope,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/lib/api/services/fetchAuth';
import { buildAuthUserFromApi } from '@/lib/auth/buildAuthUser';
import { getDashboardPathByRole } from '@/lib/auth/mapUser';
import {
  clearLegacyClientAuthCookies,
  setMustChangePasswordCookie,
} from '@/lib/storage/authCookies';
import { useAuthStore } from '@/lib/store/authStore';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
};

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);

  return useMutation({
    mutationFn: async (input: Parameters<typeof loginWithEmailPassword>[0]) => {
      const envelope = await loginWithEmailPassword(input);
      const { accessToken, refreshToken } = envelope.data;
      const persisted = await persistAuthSession(accessToken, refreshToken);
      if (!persisted) {
        throw new Error('Không lưu được phiên đăng nhập. Vui lòng thử lại.');
      }
      return envelope;
    },
    onSuccess: envelope => {
      const { accessToken, user } = envelope.data;
      clearLegacyClientAuthCookies();
      const authUser = buildAuthUserFromApi(user);
      setMustChangePasswordCookie(Boolean(authUser.mustChangePassword));
      setAuth(accessToken, authUser);

      if (authUser.mustChangePassword) {
        router.push('/renew-password');
        return;
      }
      router.push(getDashboardPathByRole(authUser.role));
    },
  });
}

/** Public — POST /v1/auth/forgot-password */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (body: ForgotPasswordRequest) => forgotPassword(body),
  });
}

/** Public — POST /v1/auth/reset-password */
export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (body: ResetPasswordRequest) => resetPassword(body),
    onSuccess: () => {
      router.push('/login');
    },
  });
}

/** First-login / forced change — POST /v1/auth/change-password (authenticated). */
export function useChangePassword() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const updateUser = useAuthStore(s => s.updateUser);

  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setMustChangePasswordCookie(false);
      updateUser({ mustChangePassword: false });
      router.push(getDashboardPathByRole(user?.role ?? 'company'));
    },
  });
}

export function getLoginErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data as ApiErrorEnvelope | undefined;
    if (status === 422) {
      return (
        body?.message ??
        'Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.'
      );
    }
    if (body?.message) return body.message;
  }
  return 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.';
}

export function getChangePasswordErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const body = error.response?.data as ApiErrorEnvelope | undefined;
    if (body?.message) return body.message;
    if (error.response?.status === 422) {
      return 'Mật khẩu hiện tại không đúng.';
    }
  }
  return 'Không đổi được mật khẩu. Vui lòng thử lại.';
}

export function getForgotPasswordErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const body = error.response?.data as ApiErrorEnvelope | undefined;
    if (body?.message) return body.message;
  }
  return 'Không gửi được mã OTP. Vui lòng kiểm tra email và thử lại.';
}

export function getResetPasswordErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const body = error.response?.data as ApiErrorEnvelope | undefined;
    if (body?.message) return body.message;
    if (error.response?.status === 422) {
      return 'Mã OTP không hợp lệ hoặc đã hết hạn.';
    }
  }
  return 'Không đặt lại được mật khẩu. Vui lòng thử lại.';
}
