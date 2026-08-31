import { CITIZEN_HOME_PATH, isSafeInternalReturnPath } from '@/lib/auth/citizenAccess';
import { getDashboardPathByRole } from '@/lib/auth/mapUser';
import type { AuthUser } from '@/lib/store/authStore';

/**
 * Resolve navigation target after successful login / password change.
 * Citizens always land on the public map — never staff dashboards or marketing home.
 */
export function resolvePostLoginPath(
  role: AuthUser['role'],
  returnPath?: string | null
): string {
  if (role === 'citizen') {
    return CITIZEN_HOME_PATH;
  }

  if (isSafeInternalReturnPath(returnPath)) {
    return returnPath;
  }

  return getDashboardPathByRole(role);
}
