export const ADMIN_TEAMS_PAGE_SIZE = 20;
export const ADMIN_TEAMS_OFFICE_PAGE_SIZE = 500;

export const TEAM_TYPE_OPTIONS = [
  { value: 'Cleanup', label: 'Cleanup' },
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
