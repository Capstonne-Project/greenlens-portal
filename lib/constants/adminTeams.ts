export const ADMIN_TEAMS_PAGE_SIZE = 20;
export const ADMIN_TEAMS_OFFICE_PAGE_SIZE = 500;
/** Số đội tối đa mỗi trang trên từng cột (dọn dẹp / thanh tra). */
export const ADMIN_TEAMS_BOARD_COLUMN_PAGE_SIZE = 2;

export type AdminTeamsColumnPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export function paginateAdminTeamsColumn<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function buildAdminTeamsColumnPagination(
  totalItems: number,
  page: number,
  pageSize: number
): AdminTeamsColumnPagination {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

export const TEAM_TYPE_OPTIONS = [
  { value: 'Cleanup', label: 'Dọn dẹp' },
  { value: 'Inspection', label: 'Kiểm tra' },
  { value: 'Response', label: 'Ứng cứu' },
  { value: 'Monitoring', label: 'Giám sát' },
] as const;

export function getTeamTypeLabel(teamType: string): string {
  return TEAM_TYPE_OPTIONS.find(option => option.value === teamType)?.label ?? teamType;
}

export function getTeamTypeClasses(teamType: string): string {
  switch (teamType) {
    case 'Cleanup':
      return 'bg-emerald-100 text-emerald-800';
    case 'Inspection':
      return 'bg-sky-100 text-sky-800';
    case 'Response':
      return 'bg-amber-100 text-amber-900';
    case 'Monitoring':
      return 'bg-violet-100 text-violet-800';
    default:
      return 'bg-muted text-muted-foreground';
  }
}
