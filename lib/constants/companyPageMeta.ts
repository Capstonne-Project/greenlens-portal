import {
  getProfilePageTitleByPath,
  PROFILE_PORTAL_CONFIG,
  PROFILE_ROUTES,
} from '@/lib/constants/profilePortal';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Building2,
  ChartLine,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  Scroll,
  Settings,
  User,
  Users,
  UsersRound,
} from 'lucide-react';

export type CompanyPageMeta = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const FALLBACK: CompanyPageMeta = {
  title: 'GreenLens Company',
  description: 'Cổng quản lý công ty xử lý báo cáo ô nhiễm môi trường.',
  icon: Building2,
};

/** Exact-path metadata for company shell routes. */
export const companyPageMeta: Record<string, CompanyPageMeta> = {
  '/company': {
    title: 'Tổng quan công ty',
    description: 'Dashboard vận hành, KPI và phân công đang hoạt động.',
    icon: LayoutDashboard,
  },
  '/company/assign': {
    title: 'Phân công',
    description: 'Báo cáo Verified đã được LEO chuyển đến công ty — chọn đội để bắt đầu xử lý.',
    icon: ClipboardList,
  },
  '/company/tracking': {
    title: 'Theo dõi xử lý',
    description: 'Theo dõi tiến độ và trạng thái các báo cáo đã được phân công đội xử lý.',
    icon: ChartLine,
  },
  '/company/workforce': {
    title: 'Đội ngũ',
    description: 'Quản lý đội nhóm và thành viên công ty xử lý báo cáo.',
    icon: UsersRound,
  },
  '/company/staff': {
    title: 'Đội ngũ',
    description: 'Quản lý đội nhóm và thành viên công ty xử lý báo cáo.',
    icon: Users,
  },
  '/company/teams': {
    title: 'Đội ngũ',
    description: 'Quản lý đội nhóm và thành viên công ty xử lý báo cáo.',
    icon: UsersRound,
  },
  '/company/contract-history': {
    title: 'Lịch sử hợp đồng',
    description: 'Theo dõi hợp đồng và cam kết dịch vụ với cơ quan môi trường.',
    icon: Scroll,
  },
  '/company/settings': {
    title: 'Cài đặt tài khoản',
    description: 'Quản lý thông tin tài khoản và tùy chọn cổng công ty.',
    icon: Settings,
  },
  '/company/settings/account': {
    title: 'Cài đặt tài khoản',
    description: PROFILE_PORTAL_CONFIG.company.subtitle,
    icon: User,
  },
  '/company/settings/notifications': {
    title: 'Cài đặt thông báo',
    description: 'Tùy chỉnh loại thông báo và kênh nhận trong cổng công ty.',
    icon: Bell,
  },
  '/company/settings/media-lab': {
    title: 'Media API Lab',
    description: 'Thử nghiệm tải lên và xử lý media qua API.',
    icon: FlaskConical,
  },
  '/company/notifications': {
    title: 'Thông báo',
    description: 'Hộp thư thông báo nội bộ và cập nhật vận hành.',
    icon: Bell,
  },
};

export function getCompanyPageMeta(pathname: string): CompanyPageMeta {
  const profileTitle = getProfilePageTitleByPath(pathname);
  if (profileTitle && pathname === PROFILE_ROUTES.company) {
    return {
      title: profileTitle,
      description: PROFILE_PORTAL_CONFIG.company.subtitle,
      icon: User,
    };
  }

  const exact = companyPageMeta[pathname];
  if (exact) return exact;

  if (pathname.startsWith('/company/tracking')) {
    return companyPageMeta['/company/tracking']!;
  }

  if (
    pathname.startsWith('/company/workforce') ||
    pathname.startsWith('/company/staff') ||
    pathname.startsWith('/company/teams')
  ) {
    return companyPageMeta['/company/workforce']!;
  }

  if (pathname.startsWith('/company/assign')) {
    return companyPageMeta['/company/assign']!;
  }

  if (pathname.startsWith('/company/notifications')) {
    return companyPageMeta['/company/notifications']!;
  }

  if (pathname.startsWith('/company/settings')) {
    if (pathname === '/company/settings/notifications') {
      return companyPageMeta['/company/settings/notifications']!;
    }
    if (pathname === '/company/settings/media-lab') {
      return companyPageMeta['/company/settings/media-lab']!;
    }
    if (pathname === '/company/settings/account') {
      return companyPageMeta['/company/settings/account']!;
    }
    return companyPageMeta['/company/settings']!;
  }

  return FALLBACK;
}
