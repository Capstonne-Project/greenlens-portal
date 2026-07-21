import type { OfficeStaffAssignRole, OfficeStaffListParams } from '@/lib/api/models/office';
import type { TeamListItem, TeamsListParams } from '@/lib/api/models/team';
import { z } from 'zod';

// ── Constants (list view) ─────────────────────────────────────────────────────
export const PAGE_SIZE = 10;

export const TYPE_LABEL: Record<string, string> = {
  Cleanup: 'Dọn dẹp',
  Inspection: 'Kiểm tra',
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
  'h-8 shrink-0 cursor-pointer gap-[0.35rem] border-slate-300 bg-white text-[0.8125rem] font-medium text-slate-900';

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
  Inspection: 'Kiểm tra (Inspection)',
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

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên đội')
    .max(100, 'Tên đội không được quá 100 ký tự'),
});

export type CreateTeamFormValues = z.infer<typeof createTeamSchema>;

export function teamTypeToStaffRole(teamType: string): OfficeStaffAssignRole | undefined {
  if (teamType === 'Cleanup') return 'Cleaner';
  if (teamType === 'Inspection') return 'Inspector';
  return undefined;
}

export type AddMemberTeamTarget = {
  id: string;
  name: string;
  teamType: TeamListItem['teamType'];
};

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

export function filterTeamsBySearch<T extends { name: string; officeName?: string }>(
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
  }
): TeamsListParams {
  const next = { ...params };
  if (filters.statusFilter === 'active') next.isActive = true;
  if (filters.statusFilter === 'inactive') next.isActive = false;
  if (filters.teamTypeFilter !== 'all') next.teamType = filters.teamTypeFilter;
  if (filters.availableFilter === 'available') next.isAvailable = true;
  if (filters.availableFilter === 'busy') next.isAvailable = false;
  return next;
}

/** Một query key ổn định cho board + list — mode chỉ đổi UI, không đổi fetch. */
export function buildSharedTeamsQueryParams(filters: {
  statusFilter: StatusFilter;
  teamTypeFilter: TeamTypeFilter;
  availableFilter: AvailableFilter;
}): TeamsListParams {
  return applyTeamListFilters({ page: 1, pageSize: PAGE_SIZE }, filters);
}
