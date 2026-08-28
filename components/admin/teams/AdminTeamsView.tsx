'use client';

import {
  ADMIN_PAGINATION_BTN,
  ADMIN_TOOLBAR_SELECT,
} from '@/components/admin/shared/adminUiTokens';
import {
  ADMIN_TABLE_CLASS,
  ADMIN_TABLE_HEAD_CELL,
  ADMIN_TABLE_ROW_BORDER,
  ADMIN_TABLE_SCROLL,
  ADMIN_TABLE_SHELL,
  ADMIN_TABLE_PAGINATION_FOOTER,
  ADMIN_TABLE_PAGINATION_META,
  ADMIN_TABLE_PAGINATION_NAV,
  adminTableCellPad,
} from '@/components/admin/shared/adminDataTableChrome';
import { TeamDetailDialog } from '@/components/admin/teams/TeamDetailDialog';
import { AdminRetryButton } from '@/components/admin/shared/AdminRetryButton';
import { AdminSearchField } from '@/components/admin/shared/AdminSearchField';
import { Button } from '@/components/ui/button';
import { PaginationSimple } from '@/components/ui/pagination';
import SaveIcon from '@/components/ui/save-icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOfficesList } from '@/hooks/useOffices';
import { useTeamsList } from '@/hooks/useTeams';
import {
  ADMIN_TEAMS_BOARD_COLUMN_PAGE_SIZE,
  ADMIN_TEAMS_OFFICE_PAGE_SIZE,
  ADMIN_TEAMS_PAGE_SIZE,
  buildAdminTeamsColumnPagination,
  getTeamTypeClasses,
  getTeamTypeLabel,
  paginateAdminTeamsColumn,
  TEAM_TYPE_OPTIONS,
} from '@/lib/constants/adminTeams';
import type { TeamListItem } from '@/lib/api/models/team';
import { cn } from '@/lib/utils';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  LayoutGrid,
  RadioTower,
  ShieldCheck,
  Table2,
  UsersRound,
  Waves,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

type ActiveFilter = 'active' | 'inactive' | 'all';
type ViewMode = 'cards' | 'table';

function formatDate(iso: string): string {
  if (!iso?.trim() || iso.startsWith('0001-01-01')) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

function getTeamIconSurface(teamType: string): string {
  switch (teamType) {
    case 'Cleanup':
      return 'bg-emerald-700 text-white';
    case 'Inspection':
      return 'bg-sky-700 text-white';
    case 'Response':
      return 'bg-amber-600 text-white';
    case 'Monitoring':
      return 'bg-violet-700 text-white';
    default:
      return 'bg-zinc-700 text-white';
  }
}

function getTeamRail(teamType: string): string {
  switch (teamType) {
    case 'Cleanup':
      return 'bg-emerald-600';
    case 'Inspection':
      return 'bg-sky-500';
    case 'Response':
      return 'bg-amber-500';
    case 'Monitoring':
      return 'bg-violet-500';
    default:
      return 'bg-zinc-400';
  }
}

interface TeamSpotlightCardProps {
  team: TeamListItem;
  onOpen: (id: string) => void;
}

interface TeamColumnProps {
  title: string;
  dotClassName: string;
  teams: TeamListItem[];
  totalCount: number;
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
  onOpen: (id: string) => void;
  emptyLabel: string;
}

function TeamColumn({
  title,
  dotClassName,
  teams,
  totalCount,
  page,
  totalPages,
  hasPrev,
  hasNext,
  onPageChange,
  onOpen,
  emptyLabel,
}: TeamColumnProps) {
  return (
    <div className="flex min-h-[220px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        <span className={`size-2.5 shrink-0 rounded-full ${dotClassName}`} aria-hidden />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-semibold text-muted-foreground">
          {totalCount}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        {teams.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <UsersRound className="size-8 opacity-30" aria-hidden />
            <span>{emptyLabel}</span>
          </div>
        ) : (
          teams.map(team => <TeamSpotlightCard key={team.id} team={team} onOpen={onOpen} />)
        )}
      </div>
      {totalPages > 1 ? (
        <div className={cn(ADMIN_TABLE_PAGINATION_NAV, 'border-t border-border bg-muted/20 px-4')}>
          <span className="text-xs text-muted-foreground">
            Trang {page}/{totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasPrev}
              onClick={() => onPageChange(page - 1)}
              className={ADMIN_PAGINATION_BTN}
            >
              <ChevronLeft className="size-3.5" />
              Trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => onPageChange(page + 1)}
              className={ADMIN_PAGINATION_BTN}
            >
              Sau
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TeamSpotlightCard({ team, onOpen }: TeamSpotlightCardProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onOpen(team.id)}
      className="group relative h-auto w-full justify-start overflow-hidden rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-card hover:shadow-md"
    >
      <span
        className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${getTeamRail(team.teamType)}`}
        aria-hidden
      />
      <div className="pl-2">
        <div className="mb-3 flex items-start justify-between gap-3">
          <span
            className={`flex size-10 items-center justify-center rounded-lg ${getTeamIconSurface(
              team.teamType
            )}`}
          >
            <UsersRound className="size-4" />
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTeamTypeClasses(
              team.teamType
            )}`}
          >
            {getTeamTypeLabel(team.teamType)}
          </span>
        </div>
        <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">{team.name}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{team.officeName || '—'}</p>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900/50">
          <span className="text-xs font-medium text-muted-foreground">Thành viên</span>
          <span className="text-lg font-bold tabular-nums text-foreground">{team.memberCount}</span>
        </div>
      </div>
    </Button>
  );
}

export function AdminTeamsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const cleanupPage = Math.max(1, Number(searchParams.get('cPage')) || 1);
  const inspectionPage = Math.max(1, Number(searchParams.get('iPage')) || 1);
  const searchQ = searchParams.get('q') ?? '';
  const officeId = searchParams.get('officeId') ?? '';
  const teamType = searchParams.get('type') ?? 'all';
  const viewMode: ViewMode = searchParams.get('view') === 'table' ? 'table' : 'cards';
  const activeFilter: ActiveFilter =
    searchParams.get('status') === 'inactive'
      ? 'inactive'
      : searchParams.get('status') === 'all'
        ? 'all'
        : 'active';

  const [detailId, setDetailId] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: ADMIN_TEAMS_PAGE_SIZE,
      ...(officeId ? { localOfficeId: officeId } : {}),
      ...(teamType !== 'all' ? { teamType } : {}),
      ...(activeFilter === 'active'
        ? { isActive: true }
        : activeFilter === 'inactive'
          ? { isActive: false }
          : {}),
    }),
    [activeFilter, officeId, page, teamType]
  );

  const { data, isPending, isError, error, refetch } = useTeamsList(queryParams);
  const statsQuery = useTeamsList({ page: 1, pageSize: 500 });
  const officesQuery = useOfficesList({ page: 1, pageSize: ADMIN_TEAMS_OFFICE_PAGE_SIZE });

  const setQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === '') next.delete(k);
        else next.set(k, v);
      });
      router.push(`${pathname}?${next.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const items = useMemo(() => {
    const base = data?.items ?? [];
    const q = searchQ.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      team =>
        team.name.toLowerCase().includes(q) ||
        (team.officeName?.toLowerCase().includes(q) ?? false) ||
        team.teamType.toLowerCase().includes(q) ||
        getTeamTypeLabel(team.teamType).toLowerCase().includes(q)
    );
  }, [data, searchQ]);

  const boardItems = useMemo(() => {
    if (viewMode !== 'cards' || teamType !== 'all') return null;

    let base = statsQuery.data?.items ?? [];
    if (officeId) base = base.filter(team => team.localOfficeId === officeId);
    if (activeFilter === 'active') base = base.filter(team => team.isActive);
    else if (activeFilter === 'inactive') base = base.filter(team => !team.isActive);

    const q = searchQ.trim().toLowerCase();
    if (!q) return base;

    return base.filter(
      team =>
        team.name.toLowerCase().includes(q) ||
        (team.officeName?.toLowerCase().includes(q) ?? false) ||
        team.teamType.toLowerCase().includes(q) ||
        getTeamTypeLabel(team.teamType).toLowerCase().includes(q)
    );
  }, [activeFilter, officeId, searchQ, statsQuery.data?.items, teamType, viewMode]);

  const cleanupBoardItems = useMemo(
    () => boardItems?.filter(team => team.teamType === 'Cleanup') ?? [],
    [boardItems]
  );
  const inspectionBoardItems = useMemo(
    () => boardItems?.filter(team => team.teamType === 'Inspection') ?? [],
    [boardItems]
  );
  const otherBoardItems = useMemo(
    () =>
      boardItems?.filter(team => team.teamType !== 'Cleanup' && team.teamType !== 'Inspection') ??
      [],
    [boardItems]
  );

  const cleanupPagination = useMemo(
    () =>
      buildAdminTeamsColumnPagination(
        cleanupBoardItems.length,
        cleanupPage,
        ADMIN_TEAMS_BOARD_COLUMN_PAGE_SIZE
      ),
    [cleanupBoardItems.length, cleanupPage]
  );
  const inspectionPagination = useMemo(
    () =>
      buildAdminTeamsColumnPagination(
        inspectionBoardItems.length,
        inspectionPage,
        ADMIN_TEAMS_BOARD_COLUMN_PAGE_SIZE
      ),
    [inspectionBoardItems.length, inspectionPage]
  );

  const cleanupPageItems = useMemo(
    () =>
      paginateAdminTeamsColumn(
        cleanupBoardItems,
        cleanupPagination.page,
        ADMIN_TEAMS_BOARD_COLUMN_PAGE_SIZE
      ),
    [cleanupBoardItems, cleanupPagination.page]
  );
  const inspectionPageItems = useMemo(
    () =>
      paginateAdminTeamsColumn(
        inspectionBoardItems,
        inspectionPagination.page,
        ADMIN_TEAMS_BOARD_COLUMN_PAGE_SIZE
      ),
    [inspectionBoardItems, inspectionPagination.page]
  );

  const resetBoardPages = { cPage: null, iPage: null };

  const statsItems = statsQuery.data?.items ?? [];
  const totalTeams = statsQuery.data?.pagination.totalItems ?? 0;
  const activeTeams = statsItems.filter(team => team.isActive).length;
  const totalMembers = statsItems.reduce((sum, team) => sum + team.memberCount, 0);
  const cleanupTeams = statsItems.filter(team => team.teamType === 'Cleanup').length;
  const pagination = data?.pagination;

  return (
    <div className="w-full min-w-0">
      <section className="overflow-hidden rounded-card border border-border bg-card shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <RadioTower className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Điều phối đội môi trường
              </p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                Theo dõi đội dọn dẹp và đội thanh tra theo từng văn phòng.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              {[
                {
                  label: 'Nhóm',
                  value: totalTeams,
                  icon: UsersRound,
                  tone: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
                },
                {
                  label: 'Đang hoạt động',
                  value: activeTeams,
                  icon: Activity,
                  tone: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
                },
                {
                  label: 'Thành viên',
                  value: totalMembers,
                  icon: ShieldCheck,
                  tone: 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
                },
                {
                  label: 'Dọn dẹp',
                  value: cleanupTeams,
                  icon: Waves,
                  tone: 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
                },
              ].map(item => (
                <span
                  key={item.label}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${item.tone}`}
                >
                  <item.icon className="size-3.5 shrink-0" />
                  <span className="opacity-80">{item.label}</span>
                  <strong className="font-bold tabular-nums">{item.value}</strong>
                </span>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              className="h-9 shrink-0 gap-2 text-xs font-semibold"
            >
              <RadioTower className="size-3.5" />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Filters + view toggle — một hàng, không card riêng */}
        <div className="space-y-3 border-b border-border px-4 py-4 sm:px-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_10rem_auto] lg:items-end">
            <AdminSearchField
              id="team-search"
              label="Tìm team"
              value={searchQ}
              onCommit={q => setQuery({ q: q || null, page: '1', ...resetBoardPages })}
              placeholder="Tên đội, văn phòng, loại đội…"
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="team-office" className="text-xs font-medium text-muted-foreground">
                Văn phòng
              </label>
              <Select
                value={officeId || 'all'}
                onValueChange={v =>
                  setQuery({ officeId: v === 'all' ? null : v, page: '1', ...resetBoardPages })
                }
              >
                <SelectTrigger id="team-office" className={cn(ADMIN_TOOLBAR_SELECT, 'rounded-lg')}>
                  <SelectValue placeholder="Tất cả văn phòng" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="all">Tất cả văn phòng</SelectItem>
                  {(officesQuery.data?.items ?? []).map(office => (
                    <SelectItem key={office.id} value={office.id}>
                      {office.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="team-type" className="text-xs font-medium text-muted-foreground">
                Loại team
              </label>
              <Select
                value={teamType || 'all'}
                onValueChange={v =>
                  setQuery({ type: v === 'all' ? null : v, page: '1', ...resetBoardPages })
                }
              >
                <SelectTrigger id="team-type" className={cn(ADMIN_TOOLBAR_SELECT, 'rounded-lg')}>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {TEAM_TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div className="flex h-10 rounded-lg border border-border bg-background p-1">
                {(
                  [
                    ['active', 'Đang hoạt động'],
                    ['inactive', 'Tạm dừng'],
                    ['all', 'Tất cả'],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setQuery({
                        status: value === 'active' ? null : value,
                        page: '1',
                        ...resetBoardPages,
                      })
                    }
                    className={cn(
                      'rounded-md px-2.5 text-xs font-medium',
                      activeFilter === value
                        ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              <div className="flex h-10 rounded-lg border border-border bg-background p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery({ view: null })}
                  title="Xem ô"
                  className={cn(
                    'gap-1 rounded-md px-2.5 text-xs font-medium',
                    viewMode === 'cards'
                      ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <LayoutGrid className="size-3.5" />Ô
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery({ view: 'table' })}
                  title="Xem bảng"
                  className={cn(
                    'gap-1 rounded-md px-2.5 text-xs font-medium',
                    viewMode === 'table'
                      ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Table2 className="size-3.5" />
                  Bảng
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {(isPending || (viewMode === 'cards' && teamType === 'all' && statsQuery.isPending)) && (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Đang tải team…
          </div>
        )}

        {isError && (
          <div className="py-16 text-center">
            <p className="text-sm text-destructive">
              {(error as Error)?.message ?? 'Không tải được danh sách team.'}
            </p>
            <div className="mt-2">
              <AdminRetryButton onClick={() => void refetch()} />
            </div>
          </div>
        )}

        {!isPending &&
          !(viewMode === 'cards' && teamType === 'all' && statsQuery.isPending) &&
          !isError &&
          viewMode === 'cards' && (
            <>
              {teamType === 'all' ? (
                <div className="space-y-4 bg-zinc-50/80 p-4 dark:bg-zinc-900/30">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <TeamColumn
                      title="Đội dọn dẹp"
                      dotClassName="bg-emerald-600"
                      teams={cleanupPageItems}
                      totalCount={cleanupBoardItems.length}
                      page={cleanupPagination.page}
                      totalPages={cleanupPagination.totalPages}
                      hasPrev={cleanupPagination.hasPrev}
                      hasNext={cleanupPagination.hasNext}
                      onPageChange={p => setQuery({ cPage: p === 1 ? null : String(p) })}
                      onOpen={setDetailId}
                      emptyLabel="Chưa có đội dọn dẹp"
                    />
                    <TeamColumn
                      title="Đội thanh tra"
                      dotClassName="bg-sky-500"
                      teams={inspectionPageItems}
                      totalCount={inspectionBoardItems.length}
                      page={inspectionPagination.page}
                      totalPages={inspectionPagination.totalPages}
                      hasPrev={inspectionPagination.hasPrev}
                      hasNext={inspectionPagination.hasNext}
                      onPageChange={p => setQuery({ iPage: p === 1 ? null : String(p) })}
                      onOpen={setDetailId}
                      emptyLabel="Chưa có đội thanh tra"
                    />
                  </div>
                  {otherBoardItems.length > 0 ? (
                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <h3 className="mb-3 text-sm font-semibold text-foreground">
                        Loại đội khác
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          ({otherBoardItems.length})
                        </span>
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {otherBoardItems.map(team => (
                          <TeamSpotlightCard key={team.id} team={team} onOpen={setDetailId} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : items.length === 0 ? (
                <div className="px-6 py-16 text-center text-muted-foreground">
                  <UsersRound className="mx-auto mb-2 size-8 opacity-30" />
                  Chưa có đội phù hợp bộ lọc.
                </div>
              ) : (
                <div className="grid gap-3 bg-zinc-50/80 p-4 dark:bg-zinc-900/30 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map(team => (
                    <TeamSpotlightCard key={team.id} team={team} onOpen={setDetailId} />
                  ))}
                </div>
              )}

              {teamType !== 'all' && pagination && pagination.totalPages > 1 && (
                <div className={ADMIN_TABLE_PAGINATION_NAV}>
                  <span className="text-xs text-muted-foreground">
                    Trang {pagination.page}/{pagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrev}
                      onClick={() => setQuery({ page: String(page - 1) })}
                      className={ADMIN_PAGINATION_BTN}
                    >
                      <ChevronLeft className="size-3.5" />
                      Trước
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNext}
                      onClick={() => setQuery({ page: String(page + 1) })}
                      className={ADMIN_PAGINATION_BTN}
                    >
                      Sau
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

        {!isPending && !isError && viewMode === 'table' && (
          <div className={ADMIN_TABLE_SHELL}>
            <div className={ADMIN_TABLE_SCROLL}>
              <Table className={ADMIN_TABLE_CLASS}>
                <TableHeader className="sticky top-0 z-10 bg-slate-100">
                  <TableRow
                    className={cn(ADMIN_TABLE_ROW_BORDER, 'bg-slate-100 hover:bg-slate-100')}
                  >
                    <TableHead
                      className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('first', 'head'))}
                    >
                      Đội
                    </TableHead>
                    <TableHead
                      className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('middle', 'head'))}
                    >
                      Loại
                    </TableHead>
                    <TableHead
                      className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('middle', 'head'))}
                    >
                      Văn phòng
                    </TableHead>
                    <TableHead
                      className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('middle', 'head'))}
                    >
                      Thành viên
                    </TableHead>
                    <TableHead
                      className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('middle', 'head'))}
                    >
                      Trạng thái
                    </TableHead>
                    <TableHead
                      className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('middle', 'head'))}
                    >
                      Ngày tạo
                    </TableHead>
                    <TableHead
                      className={cn(
                        ADMIN_TABLE_HEAD_CELL,
                        adminTableCellPad('last', 'head'),
                        'text-right'
                      )}
                    >
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow className={cn(ADMIN_TABLE_ROW_BORDER, 'hover:bg-transparent')}>
                      <TableCell colSpan={7} className="h-40 px-6 py-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                          <SaveIcon size={32} className="opacity-30" />
                          <span>Chưa có team phù hợp bộ lọc.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map(team => (
                      <TableRow
                        key={team.id}
                        className={cn(ADMIN_TABLE_ROW_BORDER, 'hover:bg-sky-50/40')}
                      >
                        <TableCell className={cn(adminTableCellPad('first'), 'align-middle')}>
                          <span className="font-semibold text-foreground">{team.name}</span>
                        </TableCell>
                        <TableCell className={cn(adminTableCellPad('middle'), 'align-middle')}>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTeamTypeClasses(
                              team.teamType
                            )}`}
                          >
                            {getTeamTypeLabel(team.teamType)}
                          </span>
                        </TableCell>
                        <TableCell
                          className={cn(
                            adminTableCellPad('middle'),
                            'align-middle text-muted-foreground'
                          )}
                        >
                          {team.officeName}
                        </TableCell>
                        <TableCell
                          className={cn(adminTableCellPad('middle'), 'align-middle tabular-nums')}
                        >
                          {team.memberCount}
                        </TableCell>
                        <TableCell className={cn(adminTableCellPad('middle'), 'align-middle')}>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              team.isActive
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {team.isActive ? 'Hoạt động' : 'Tạm dừng'}
                          </span>
                        </TableCell>
                        <TableCell
                          className={cn(
                            adminTableCellPad('middle'),
                            'align-middle whitespace-nowrap text-muted-foreground'
                          )}
                        >
                          {formatDate(team.createdAt)}
                        </TableCell>
                        <TableCell
                          className={cn(adminTableCellPad('last'), 'text-right align-middle')}
                        >
                          <div className="inline-flex items-center justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title="Chi tiết"
                              onClick={() => setDetailId(team.id)}
                              aria-label="Chi tiết team"
                            >
                              <Eye className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {pagination ? (
              <div className={ADMIN_TABLE_PAGINATION_FOOTER}>
                {pagination.totalPages > 1 ? (
                  <PaginationSimple
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={p => setQuery({ page: String(p) })}
                    className="w-auto"
                  />
                ) : null}
                <p className={ADMIN_TABLE_PAGINATION_META}>
                  {pagination.totalItems.toLocaleString('vi-VN')} rows
                </p>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <TeamDetailDialog
        open={Boolean(detailId)}
        teamId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
