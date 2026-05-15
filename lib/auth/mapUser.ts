import type { AuthUser } from '@/lib/store/authStore';

/** Maps API role string to internal auth role. */
export function mapApiRoleToAuth(role: string): AuthUser['role'] {
  const r = role.trim().toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'officer' || r === 'environmental officer') return 'officer';
  if (r === 'cleanup' || r === 'cleanup team') return 'cleanup';
  return 'citizen';
}

export function getDashboardPathByRole(role: AuthUser['role']): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'officer':
      return '/officer';
    case 'cleanup':
      return '/cleanup';
    default:
      return '/';
  }
}
