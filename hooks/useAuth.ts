'use client';

import { isAxiosError } from '@/lib/api/core';
import { changePassword, loginWithEmailPassword } from '@/lib/api/services/fetchAuth';
import type { ApiErrorEnvelope } from '@/lib/api/services/fetchAuth';
import { buildAuthUserFromApi } from '@/lib/auth/buildAuthUser';
import { getDashboardPathByRole } from '@/lib/auth/mapUser';
import { setAuthCookies, setMustChangePasswordCookie } from '@/lib/storage/authCookies';
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
    mutationFn: loginWithEmailPassword,
    onSuccess: envelope => {
      const { accessToken, refreshToken, user } = envelope.data;
      setAuthCookies(accessToken, refreshToken);
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
