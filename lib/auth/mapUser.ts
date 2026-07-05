import { normalizeApiRole } from '@/lib/constants/systemRoles';
import type { AuthUser } from '@/lib/store/authStore';

/**
 * Maps BE `UserRole` → FE route bucket.
 * Officer portal: chỉ DEO + LEO. Company portal: CompanyManager + CompanyStaff.
 */
export function mapApiRoleToAuth(role: string): AuthUser['role'] {
  const canonical = normalizeApiRole(role);
  const r = canonical.toLowerCase().replace(/\s+/g, '');

  if (r === 'admin') return 'admin';
  if (r === 'companymanager' || r === 'companystaff') return 'company';
  if (r === 'cleaner') return 'cleanup';
  if (r === 'deo' || r === 'leo') return 'officer';
  if (r === 'citizen') return 'citizen';
  // Inspector và role chưa có cổng web → citizen bucket (/)
  return 'citizen';
}

export function getDashboardPathByRole(role: AuthUser['role']): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'company':
      return '/company';
    case 'officer':
      return '/officer';
    case 'cleanup':
      return '/cleanup';
    default:
      return '/';
  }
}
