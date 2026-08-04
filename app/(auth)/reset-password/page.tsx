import { ResetPasswordScreen } from '@/components/auth/ResetPasswordScreen';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Đặt lại mật khẩu',
  description: 'Nhập OTP và mật khẩu mới cho tài khoản GreenLens',
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Đang tải…
        </main>
      }
    >
      <ResetPasswordScreen />
    </Suspense>
  );
}
