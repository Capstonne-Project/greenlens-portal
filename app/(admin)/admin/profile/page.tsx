import { AdminProfilePage } from '@/components/admin/AdminProfilePage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hồ sơ',
  description: 'Thông tin tài khoản GreenLens',
};

export default function AdminProfileRoutePage() {
  return <AdminProfilePage />;
}
