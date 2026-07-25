import { RenewPasswordScreen } from '@/components/auth/RenewPasswordScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đổi mật khẩu lần đầu',
  description: 'Đặt mật khẩu mới để kích hoạt tài khoản công ty GreenLens',
};

export default function RenewPasswordPage() {
  return <RenewPasswordScreen />;
}
