import type { UserProfile } from '@/lib/api/services/fetchUser';
import type { AuthUser } from '@/lib/store/authStore';
import { mapApiRoleToAuth } from '@/lib/auth/mapUser';

export function userProfileToAuthUser(profile: UserProfile): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.fullName,
    role: mapApiRoleToAuth(profile.role),
    avatarUrl: profile.avatarUrl ?? undefined,
  };
}
