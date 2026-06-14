'use client';

import { isAxiosError } from '@/lib/api/core';
import { loginWithEmailPassword } from '@/lib/api/services/fetchAuth';
import type { ApiErrorEnvelope } from '@/lib/api/services/fetchAuth';
import { buildAuthUserFromApi } from '@/lib/auth/buildAuthUser';
import { getDashboardPathByRole } from '@/lib/auth/mapUser';
import { setAuthCookies } from '@/lib/storage/authCookies';
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
      setAuth(accessToken, authUser);
      router.push(getDashboardPathByRole(authUser.role));
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
