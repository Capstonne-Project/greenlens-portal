import { LEGACY_ROLE_TO_CANONICAL, normalizeApiRole } from '@/lib/constants/systemRoles';

const ROLE_LABEL_VI: Record<string, string> = {
  Admin: 'Quản trị',
  Citizen: 'Người dân',
  DEO: 'DEO (Cán bộ sở)',
  LEO: 'LEO (Cán bộ phường)',
  Cleanup: 'Đội dọn dẹp',
  Inspector: 'Thanh tra',
};

const ROLE_BADGE_CLASSES: Record<string, string> = {
  Admin: 'bg-emerald-600 text-white',
  Citizen: 'bg-muted text-foreground',
  DEO: 'bg-violet-100 text-violet-900',
  LEO: 'bg-indigo-100 text-indigo-900',
  Cleanup: 'bg-emerald-100 text-emerald-900',
  Inspector: 'bg-sky-100 text-sky-900',
};

/** Nhãn vai trò hiển thị (API tiếng Anh → tiếng Việt). Hỗ trợ alias role cũ. */
export function roleDisplayVi(role: string): string {
  const canonical = normalizeApiRole(role);
  return ROLE_LABEL_VI[canonical] ?? ROLE_LABEL_VI[role] ?? role;
}

export function roleBadgeClasses(role: string): string {
  const canonical = normalizeApiRole(role);
  return (
    ROLE_BADGE_CLASSES[canonical] ??
    ROLE_BADGE_CLASSES[role] ??
    'bg-secondary text-secondary-foreground'
  );
}

/** Map role cũ trong URL/query sang role API mới (nếu cần). */
export function legacyRoleFilterValue(role: string): string {
  return normalizeApiRole(role);
}

export { LEGACY_ROLE_TO_CANONICAL };
