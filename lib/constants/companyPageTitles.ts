import { getCompanyPageMeta } from '@/lib/constants/companyPageMeta';

/** Tiêu đề header Company Manager theo pathname. */
export function getCompanyPageTitle(pathname: string): string {
  return getCompanyPageMeta(pathname).title;
}
