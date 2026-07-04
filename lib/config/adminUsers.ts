/** `auto` — thử `/users`, nhận dạng shape; lỗi hoặc không parse được → `/users/all`. */
export type AdminUsersListStrategy = 'auto' | 'paged' | 'all';

export function getAdminUsersListStrategy(): AdminUsersListStrategy {
  const raw = process.env.NEXT_PUBLIC_ADMIN_USERS_STRATEGY?.trim().toLowerCase();
  if (raw === 'paged' || raw === 'all') return raw;
  return 'auto';
}

export function adminUsersCountsUseAllSource(): boolean {
  return getAdminUsersListStrategy() === 'all';
}
