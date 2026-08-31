import { LoginScreen } from '@/components/auth/LoginScreen';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  description: 'Đăng nhập GreenLens — hành động vì môi trường xanh',
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}
