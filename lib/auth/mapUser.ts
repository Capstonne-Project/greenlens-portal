import { normalizeApiRole } from '@/lib/constants/systemRoles';
import type { AuthUser } from '@/lib/store/authStore';

/** Maps API role string to internal auth role (route groups). */
export function mapApiRoleToAuth(role: string): AuthUser['role'] {
  const canonical = normalizeApiRole(role);
  const r = canonical.toLowerCase().replace(/\s+/g, '');

  if (r === 'admin') return 'admin';
  if (r === 'companymanager') return 'company';
  if (r === 'cleaner' || r === 'cleanup') return 'cleanup';
  if (r === 'deo' || r === 'leo' || r === 'inspector') return 'officer';
  if (r === 'citizen') return 'citizen';
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
