/** Điều hướng Quản lý người dùng — slug URL ↔ `role` API. */

import type { SystemRole } from '@/lib/constants/systemRoles';

/** Số dòng / trang — vừa viewport Admin, tránh che cột Thao tác. */
export const ADMIN_USERS_PAGE_SIZE = 6;

export type AdminUsersRoleSlug = 'quan-tri' | 'nguoi-dan' | 'deo' | 'leo' | 'thanh-tra' | 'don-dep';

export const ADMIN_USERS_VALID_SLUGS: AdminUsersRoleSlug[] = [
  'quan-tri',
  'nguoi-dan',
  'deo',
  'leo',
  'thanh-tra',
  'don-dep',
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
    apiRole: 'Admin' satisfies SystemRole,
  },
  {
    slug: 'nguoi-dan' as const,
    href: '/admin/users/nguoi-dan',
    label: 'Người dân',
    apiRole: 'Citizen' satisfies SystemRole,
  },
  {
    slug: 'deo' as const,
    href: '/admin/users/deo',
    label: 'DEO (Sở)',
    apiRole: 'DEO' satisfies SystemRole,
  },
  {
    slug: 'leo' as const,
    href: '/admin/users/leo',
    label: 'LEO (Phường)',
    apiRole: 'LEO' satisfies SystemRole,
  },
  {
    slug: 'thanh-tra' as const,
    href: '/admin/users/thanh-tra',
    label: 'Thanh tra (Inspector)',
    apiRole: 'Inspector' satisfies SystemRole,
  },
  {
    slug: 'don-dep' as const,
    href: '/admin/users/don-dep',
    label: 'Đội dọn dẹp',
    apiRole: 'Cleaner' satisfies SystemRole,
  },
] as const;

export function isValidUsersRoleSlug(s: string): s is AdminUsersRoleSlug {
  return ADMIN_USERS_VALID_SLUGS.includes(s as AdminUsersRoleSlug);
}

export function getApiRoleFromSlug(slug: string): string | undefined {
  const row = ADMIN_USERS_NAV.find(n => n.slug === slug);
  return row?.apiRole;
}

/** Giá trị `role` khi tạo / cập nhật tài khoản — khớp Swagger. */
export const ADMIN_USER_ASSIGNABLE_ROLES = [
  { value: 'Admin' as const, label: 'Quản trị' },
  { value: 'Citizen' as const, label: 'Người dân' },
  { value: 'DEO' as const, label: 'DEO (Cán bộ sở)' },
  { value: 'LEO' as const, label: 'LEO (Cán bộ phường)' },
  { value: 'Cleaner' as const, label: 'Đội dọn dẹp (Cleaner)' },
  { value: 'CompanyManager' as const, label: 'Quản lý công ty (CompanyManager)' },
  { value: 'CompanyStaff' as const, label: 'Nhân viên công ty (CompanyStaff)' },
  { value: 'Inspector' as const, label: 'Thanh tra (Inspector)' },
] as const;

export type AdminUserAssignableRole = (typeof ADMIN_USER_ASSIGNABLE_ROLES)[number]['value'];
