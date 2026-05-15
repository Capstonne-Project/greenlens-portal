/** Điều hướng Quản lý — slug URL ↔ tham số `role` API. */

export type AdminUsersRoleSlug = 'quan-tri' | 'nguoi-dan' | 'can-bo-moi-truong' | 'doi-don-dep';

export const ADMIN_USERS_VALID_SLUGS: AdminUsersRoleSlug[] = [
  'quan-tri',
  'nguoi-dan',
  'can-bo-moi-truong',
  'doi-don-dep',
];

export const ADMIN_USERS_NAV = [
  {
    slug: null as null,
    href: '/admin/users',
    label: 'Tổng quan',
    apiRole: undefined as string | undefined,
  },
  {
    slug: 'quan-tri' as const,
    href: '/admin/users/quan-tri',
    label: 'Quản trị',
    apiRole: 'Admin',
  },
  {
    slug: 'nguoi-dan' as const,
    href: '/admin/users/nguoi-dan',
    label: 'Người dân',
    apiRole: 'Citizen',
  },
  {
    slug: 'can-bo-moi-truong' as const,
    href: '/admin/users/can-bo-moi-truong',
    label: 'Cán bộ môi trường',
    /** Khớp query Swagger: role=Officer */
    apiRole: 'Officer',
  },
  {
    slug: 'doi-don-dep' as const,
    href: '/admin/users/doi-don-dep',
    label: 'Đội dọn dẹp',
    /** Khớp query Swagger: role=CleanupTeam */
    apiRole: 'CleanupTeam',
  },
] as const;

export function isValidUsersRoleSlug(s: string): s is AdminUsersRoleSlug {
  return ADMIN_USERS_VALID_SLUGS.includes(s as AdminUsersRoleSlug);
}

export function getApiRoleFromSlug(slug: string): string | undefined {
  const row = ADMIN_USERS_NAV.find(n => n.slug === slug);
  return row?.apiRole;
}

/** Giá trị `role` khi tạo / cập nhật tài khoản (khớp Swagger). */
export const ADMIN_USER_ASSIGNABLE_ROLES = [
  { value: 'Admin', label: 'Quản trị' },
  { value: 'Citizen', label: 'Người dân' },
  { value: 'Officer', label: 'Cán bộ môi trường' },
  { value: 'CleanupTeam', label: 'Đội dọn dẹp' },
] as const;

export type AdminUserAssignableRole = (typeof ADMIN_USER_ASSIGNABLE_ROLES)[number]['value'];
