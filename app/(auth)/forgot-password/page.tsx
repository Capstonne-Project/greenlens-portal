import { ForgotPasswordScreen } from '@/components/auth/ForgotPasswordScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quên mật khẩu',
  description: 'Gửi mã OTP để khôi phục tài khoản GreenLens',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
}
