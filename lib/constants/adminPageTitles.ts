import { getAdminPageMeta } from '@/lib/constants/adminPageMeta';

/** Tiêu đề header admin theo pathname (tiếng Việt). */
export function getAdminPageTitle(pathname: string): string {
  return getAdminPageMeta(pathname).title;
}
