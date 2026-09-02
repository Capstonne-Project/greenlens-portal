import type { OfficeStaffAssignRole, OfficeStaffListParams } from '@/lib/api/models/office';
import type { TeamListItem, TeamsListParams } from '@/lib/api/models/team';
import { z } from 'zod';

// ── Constants (list view) ─────────────────────────────────────────────────────
export const PAGE_SIZE = 10;

/** Giới hạn tên đội — dùng chung schema Zod + ValidatedInput counter. */
export const TEAM_NAME_MIN = 3;
export const TEAM_NAME_MAX = 100;

export const TYPE_LABEL: Record<string, string> = {
  Cleanup: 'Dọn dẹp',
  Inspection: 'Thanh tra',
  Survey: 'Khảo sát',
};

export const TYPE_DOT: Record<string, string> = {
  Cleanup: 'bg-emerald-500',
  Inspection: 'bg-blue-500',
  Survey: 'bg-purple-500',
};

export const TABLE_HEAD_CLASS =
  'h-9 border-b border-slate-200 bg-slate-50/80 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500';

export const FILTER_BTN_CLASS =
  'h-8 shrink-0 cursor-pointer gap-[0.35rem] border-slate-300 bg-white text-[0.8125rem] font-medium text-brand shadow-none outline-none ring-0 ring-offset-0 focus:border-slate-300 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-slate-300 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 active:border-slate-300 active:outline-none data-[state=open]:border-slate-300 data-[state=open]:ring-0';

export const BOARD_COLUMN_PAGE_SIZE = 8;

export type StatusFilter = 'all' | 'active' | 'inactive';
export type TeamTypeFilter = 'all' | 'Cleanup' | 'Inspection';
export type AvailableFilter = 'all' | 'available' | 'busy';

export const STATUS_LABEL: Record<StatusFilter, string> = {
  all: 'Trạng thái',
  active: 'Hoạt động',
  inactive: 'Tạm dừng',
};

export const TEAM_TYPE_LABEL: Record<TeamTypeFilter, string> = {
  all: 'Loại đội',
  Cleanup: 'Dọn dẹp (Cleanup)',
  Inspection: 'Thanh tra (Inspection)',
};

export const AVAILABLE_LABEL: Record<AvailableFilter, string> = {
  all: 'Sẵn sàng',
  available: 'Rảnh (Available)',
  busy: 'Đang xử lý (Busy)',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  const a = parts[parts.length - 2]?.[0] ?? '';
  const b = parts[parts.length - 1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

/** BE: `currentStatus` Available = rảnh, Busy = đang xử lý báo cáo. */
export function isTeamAvailable(currentStatus: string): boolean {
  return currentStatus.trim().toLowerCase() === 'available';
}

export function teamAvailabilityBadge(currentStatus: string) {
  const available = isTeamAvailable(currentStatus);
  return {
    label: available ? '● Sẵn sàng' : '● Đang xử lý',
    className: available ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
  };
}

export const addMemberSchema = z.object({
  userId: z.string().min(1, 'Vui lòng chọn thành viên'),
  isLeader: z.boolean(),
});

export type AddMemberFormValues = z.infer<typeof addMemberSchema>;

export type LeoCreateTeamType = 'Cleanup' | 'Inspection';

/**
 * Schema tạo đội — conditional theo teamType:
 * - Cleanup  → wasteTagIds bắt buộc ≥ 1
 * - Inspection → wasteTagIds không cần (bỏ qua khi gửi)
 */
export function buildCreateTeamSchema(teamType: LeoCreateTeamType) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập tên đội')
      .min(TEAM_NAME_MIN, `Tên đội phải có ít nhất ${TEAM_NAME_MIN} ký tự`)
      .max(TEAM_NAME_MAX, `Tên đội không được quá ${TEAM_NAME_MAX} ký tự`),
    wasteTagIds:
      teamType === 'Cleanup'
        ? z.array(z.string()).min(1, 'Đội dọn dẹp phải chọn ít nhất 1 loại rác thải')
        : z.array(z.string()),
  });
}

/** Giữ lại để không break import cũ — dùng buildCreateTeamSchema(teamType) khi cần wasteTagIds. */
export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên đội')
    .min(TEAM_NAME_MIN, `Tên đội phải có ít nhất ${TEAM_NAME_MIN} ký tự`)
    .max(TEAM_NAME_MAX, `Tên đội không được quá ${TEAM_NAME_MAX} ký tự`),
  wasteTagIds: z.array(z.string()).default([]),
});

export type CreateTeamFormValues = {
  name: string;
  wasteTagIds: string[];
};

/**
 * Schema chỉnh sửa đội — conditional theo teamType:
 * - Cleanup  → wasteTagIds bắt buộc ≥ 1 (replace toàn bộ tag)
 * - Inspection → wasteTagIds không hiển thị (gửi → BE trả 422)
 */
export function buildEditTeamSchema(teamType: LeoCreateTeamType) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập tên đội')
      .min(TEAM_NAME_MIN, `Tên đội phải có ít nhất ${TEAM_NAME_MIN} ký tự`)
      .max(TEAM_NAME_MAX, `Tên đội không được quá ${TEAM_NAME_MAX} ký tự`),
    wasteTagIds:
      teamType === 'Cleanup'
        ? z.array(z.string()).min(1, 'Đội dọn dẹp phải chọn ít nhất 1 loại rác thải')
        : z.array(z.string()),
  });
}

export type EditTeamFormValues = {
  name: string;
  wasteTagIds: string[];
};

export type EditTeamTarget = {
  id: string;
  name: string;
  teamType: TeamListItem['teamType'];
  wasteTags: TeamListItem['wasteTags'];
};

export function toEditTeamTarget(
  team: Pick<TeamListItem, 'id' | 'name' | 'teamType' | 'wasteTags'>
): EditTeamTarget {
  return {
    id: team.id,
    name: team.name,
    teamType: team.teamType,
    wasteTags: team.wasteTags,
  };
}

export function teamTypeToStaffRole(teamType: string): OfficeStaffAssignRole | undefined {
  if (teamType === 'Cleanup') return 'Cleaner';
  if (teamType === 'Inspection') return 'Inspector';
  return undefined;
}

/** Cleaner → Cleanup, Inspector → Inspection — dùng khi lọc danh sách đội theo vai trò tuyển dụng. */
export function staffRoleToTeamType(role: OfficeStaffAssignRole): 'Cleanup' | 'Inspection' {
  return role === 'Cleaner' ? 'Cleanup' : 'Inspection';
}

export type AddMemberTeamTarget = {
  id: string;
  name: string;
  teamType: TeamListItem['teamType'];
};

export function toAddMemberTarget(
  team: Pick<TeamListItem, 'id' | 'name' | 'teamType'>
): AddMemberTeamTarget {
  return {
    id: team.id,
    name: team.name,
    teamType: team.teamType,
  };
}

export function buildAddMemberStaffParams(teamType: string): OfficeStaffListParams | null {
  const role = teamTypeToStaffRole(teamType);
  if (!role) return null;
  return {
    page: 1,
    pageSize: PAGE_SIZE,
    hasTeam: false,
    role,
  };
}

export type ClientPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export function paginateClient<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function buildClientPagination(
  totalItems: number,
  page: number,
  pageSize: number
): ClientPagination {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function filterTeamsBySearch<T extends { name: string; officeName?: string | null }>(
  items: T[],
  query: string
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    t => t.name.toLowerCase().includes(q) || (t.officeName?.toLowerCase().includes(q) ?? false)
  );
}

export function applyTeamListFilters(
  params: TeamsListParams,
  filters: {
    statusFilter: StatusFilter;
    teamTypeFilter: TeamTypeFilter;
    availableFilter: AvailableFilter;
    wasteTagFilter?: string[];
  }
): TeamsListParams {
  const next = { ...params };
  if (filters.statusFilter === 'active') next.isActive = true;
  if (filters.statusFilter === 'inactive') next.isActive = false;
  if (filters.teamTypeFilter !== 'all') next.teamType = filters.teamTypeFilter;
  if (filters.availableFilter === 'available') next.isAvailable = true;
  if (filters.availableFilter === 'busy') next.isAvailable = false;
  if (filters.wasteTagFilter?.length) next.wasteTagIds = filters.wasteTagFilter;
  return next;
}

/** Một query filters ổn định — `page` / `pageSize` gắn ở chỗ gọi hook. */
export function buildSharedTeamsQueryParams(filters: {
  statusFilter: StatusFilter;
  teamTypeFilter: TeamTypeFilter;
  availableFilter: AvailableFilter;
  wasteTagFilter?: string[];
}): TeamsListParams {
  return applyTeamListFilters({}, filters);
}
