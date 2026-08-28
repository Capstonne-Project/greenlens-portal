import { ADMIN_USERS_NAV } from '@/lib/constants/adminUsersNav';
import {
  getProfilePageTitleByPath,
  PROFILE_PORTAL_CONFIG,
  PROFILE_ROUTES,
} from '@/lib/constants/profilePortal';
import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Ban,
  Bell,
  Building2,
  FileText,
  Gavel,
  Globe2,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Recycle,
  ScrollText,
  Settings,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Tags,
  Trophy,
  User,
  UsersRound,
} from 'lucide-react';

export type AdminPageMeta = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const FALLBACK: AdminPageMeta = {
  title: 'GreenLens Admin',
  description: 'Quản trị hệ thống báo cáo ô nhiễm môi trường.',
  icon: LayoutDashboard,
};

/** Exact-path metadata for admin shell routes. */
export const adminPageMeta: Record<string, AdminPageMeta> = {
  '/admin': {
    title: 'Tổng quan quản trị',
    description: 'Theo dõi KPI, người dùng, báo cáo, SLA và phân bố địa lý trên toàn hệ thống.',
    icon: LayoutDashboard,
  },
  '/admin/reports': {
    title: 'Quản lý báo cáo ô nhiễm',
    description: 'Tra cứu, lọc và xử lý báo cáo ô nhiễm trên phạm vi toàn quốc.',
    icon: Shield,
  },
  '/admin/departments': {
    title: 'Sở TNMT · Cấp tỉnh',
    description: 'Quản lý Sở Tài nguyên và Môi trường cấp tỉnh và trạng thái hoạt động.',
    icon: Landmark,
  },
  '/admin/offices': {
    title: 'Văn phòng địa phương',
    description: 'Quản lý văn phòng phường/xã, onboarding và gán cán bộ môi trường.',
    icon: Building2,
  },
  '/admin/organization': {
    title: 'Văn phòng địa phương',
    description: 'Quản lý văn phòng phường/xã, onboarding và gán cán bộ môi trường.',
    icon: Building2,
  },
  '/admin/teams': {
    title: 'Quản lý đội môi trường',
    description: 'Theo dõi và quản lý các đội xử lý ô nhiễm thuộc văn phòng địa phương.',
    icon: UsersRound,
  },
  '/admin/map': {
    title: 'Bản đồ quản trị',
    description: 'Quan sát phân bố báo cáo, hotspot và trạng thái xử lý trên bản đồ toàn hệ thống.',
    icon: Globe2,
  },
  '/admin/pollution-categories': {
    title: 'Danh mục ô nhiễm',
    description: 'Cấu hình loại hình ô nhiễm, biểu tượng và thứ tự hiển thị khi người dân báo cáo.',
    icon: Tags,
  },
  '/admin/waste-tags': {
    title: 'Thẻ rác thải',
    description: 'Quản lý thẻ phân loại rác thải dùng trong báo cáo và thống kê môi trường.',
    icon: Recycle,
  },
  '/admin/penalty-frameworks': {
    title: 'Khung xử phạt',
    description: 'Định nghĩa khung mức xử phạt và quy định liên quan đến vi phạm môi trường.',
    icon: Gavel,
  },
  '/admin/gamification-configs': {
    title: 'Cấu hình điểm thưởng',
    description: 'Thiết lập quy tắc tích điểm, thưởng và động lực cộng đồng tham gia báo cáo.',
    icon: Trophy,
  },
  '/admin/badges': {
    title: 'Huy hiệu thành tích',
    description: 'Quản lý huy hiệu, điều kiện đạt và hiển thị thành tích người dùng.',
    icon: Award,
  },
  '/admin/blocked-words': {
    title: 'Từ cấm',
    description: 'Duy trì danh sách từ ngữ bị chặn để lọc nội dung spam hoặc không phù hợp.',
    icon: Ban,
  },
  '/admin/permissions': {
    title: 'Ma trận quyền',
    description: 'Xem và cấu hình quyền truy cập theo vai trò trên các module hệ thống.',
    icon: KeyRound,
  },
  '/admin/users': {
    title: 'Quản lý người dùng — Tổng quan',
    description: 'Tổng quan tài khoản theo vai trò và truy cập nhanh từng nhóm người dùng.',
    icon: UsersRound,
  },
  '/admin/notification-templates': {
    title: 'Mẫu thông báo',
    description: 'Soạn, kiểm thử và xuất bản mẫu thông báo gửi tới người dùng và cán bộ.',
    icon: Bell,
  },
  '/admin/spam-suspects': {
    title: 'Tài khoản nghi spam',
    description: 'Rà soát tài khoản có dấu hiệu spam và thực hiện biện pháp xử lý phù hợp.',
    icon: ShieldAlert,
  },
  '/admin/system-settings': {
    title: 'Cấu hình hệ thống',
    description: 'Điều chỉnh tham số vận hành, tích hợp và chính sách toàn cục của nền tảng.',
    icon: SlidersHorizontal,
  },
  '/admin/audit-logs': {
    title: 'Nhật ký kiểm toán',
    description: 'Theo dõi lịch sử thao tác quản trị để minh bạch và truy vết thay đổi.',
    icon: ScrollText,
  },
  '/admin/settings': {
    title: 'Cài đặt tài khoản',
    description: 'Quản lý thông tin tài khoản và tùy chọn cá nhân trong cổng quản trị.',
    icon: Settings,
  },
  '/admin/settings/account': {
    title: 'Cài đặt tài khoản',
    description: PROFILE_PORTAL_CONFIG.admin.subtitle,
    icon: User,
  },
  '/admin/settings/notifications': {
    title: 'Cài đặt thông báo',
    description: 'Tùy chỉnh loại thông báo và kênh nhận trong cổng quản trị.',
    icon: Bell,
  },
  '/admin/settings/privacy': {
    title: 'Quyền riêng tư',
    description: 'Chính sách quyền riêng tư và tùy chọn bảo mật dữ liệu cá nhân.',
    icon: Shield,
  },
  '/admin/notifications': {
    title: 'Thông báo',
    description: 'Hộp thư thông báo và cập nhật vận hành trong cổng quản trị.',
    icon: Bell,
  },
};

const USERS_BASE: AdminPageMeta = {
  title: 'Quản lý người dùng',
  description: 'Tra cứu, tạo và quản lý tài khoản người dùng theo vai trò trong hệ thống.',
  icon: UsersRound,
};

const REPORT_DETAIL: AdminPageMeta = {
  title: 'Chi tiết báo cáo',
  description: 'Xem thông tin đầy đủ, trạng thái và lịch sử xử lý của báo cáo ô nhiễm.',
  icon: FileText,
};

const AUDIT_DETAIL: AdminPageMeta = {
  title: 'Chi tiết nhật ký',
  description: 'Xem chi tiết sự kiện kiểm toán, tác nhân và dữ liệu thay đổi liên quan.',
  icon: ScrollText,
};

export function getAdminPageMeta(pathname: string): AdminPageMeta {
  const profileTitle = getProfilePageTitleByPath(pathname);
  if (profileTitle && pathname === PROFILE_ROUTES.admin) {
    return {
      title: profileTitle,
      description: PROFILE_PORTAL_CONFIG.admin.subtitle,
      icon: User,
    };
  }

  const exact = adminPageMeta[pathname];
  if (exact) return exact;

  const usersTab = ADMIN_USERS_NAV.find(
    item => item.slug != null && (pathname === item.href || pathname.startsWith(`${item.href}/`))
  );
  if (usersTab) {
    return {
      ...USERS_BASE,
      title: `Quản lý người dùng — ${usersTab.label}`,
      description: `Quản lý tài khoản vai trò ${usersTab.label} — tìm kiếm, tạo mới và cập nhật trạng thái.`,
    };
  }

  if (pathname.startsWith('/admin/reports/')) {
    return REPORT_DETAIL;
  }

  if (pathname.startsWith('/admin/audit-logs/')) {
    return AUDIT_DETAIL;
  }

  if (pathname.startsWith('/admin/map')) {
    return adminPageMeta['/admin/map']!;
  }

  if (pathname.startsWith('/admin/system-settings')) {
    return adminPageMeta['/admin/system-settings']!;
  }

  if (pathname.startsWith('/admin/users/')) {
    return USERS_BASE;
  }

  if (pathname.startsWith('/admin/notifications')) {
    return adminPageMeta['/admin/notifications']!;
  }

  if (pathname.startsWith('/admin/settings')) {
    if (pathname === '/admin/settings/notifications') {
      return adminPageMeta['/admin/settings/notifications']!;
    }
    if (pathname === '/admin/settings/privacy') {
      return adminPageMeta['/admin/settings/privacy']!;
    }
    if (pathname === '/admin/settings/account') {
      return adminPageMeta['/admin/settings/account']!;
    }
    return adminPageMeta['/admin/settings']!;
  }

  return FALLBACK;
}
