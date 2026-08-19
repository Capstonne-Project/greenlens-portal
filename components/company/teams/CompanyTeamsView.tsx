'use client';

import {
  CompanyTeamArchiveDialog,
  type CompanyTeamArchiveTarget,
} from '@/components/company/teams/CompanyTeamArchiveDialog';
import {
  CompanyTeamAddMemberDialog,
  type CompanyTeamAddMemberTarget,
} from '@/components/company/teams/CompanyTeamAddMemberDialog';
import {
  CompanyTeamDeleteDialog,
  type CompanyTeamDeleteTarget,
} from '@/components/company/teams/CompanyTeamDeleteDialog';
import { CompanyTeamCreateDialog } from '@/components/company/teams/CompanyTeamCreateDialog';
import { CompanyTeamRenameDialog } from '@/components/company/teams/CompanyTeamRenameDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { GreenLensLookupSpinner } from '@/components/ui/greenlens-lookup-spinner';
import { PaginationSimple } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import UsersIcon from '@/components/ui/users-icon';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useArchiveCompanyTeam,
  useCompanyStaffList,
  useCompanyTeamsList,
  useDeleteCompanyTeam,
  useMyCompany,
} from '@/hooks/useCompany';
import type { CompanyTeamListItem } from '@/lib/api/models/company';
import { cn } from '@/lib/utils';
import {
  formatCompanyDate,
  formatCompanyTeamAffiliationLine,
  getCompanyMutationError,
} from '@/utils/companyUi';
import {
  Building2,
  ChevronDown,
  Crown,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

type ActiveFilter = 'all' | 'active' | 'inactive';
export type CompanyTeamsViewMode = 'board' | 'list';

/** 2 hàng × 4 cột (xl) — parity mật độ officer (2 bảng × 2 masonry). */
const BOARD_PAGE_SIZE = 8;
const LIST_PAGE_SIZE = 10;
/** Load tối đa cho board/list client filter (parity officer workforce). */
const FETCH_PAGE_SIZE = 100;

const CARD_EXPAND_TRANSITION = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
};

/** 1 → 2 → 3 → 4 cột; items-start tránh card expand kéo cao cả hàng.
 *  Breakpoint theo bề rộng nội dung (có sidebar company): ~4 cột ≈ officer 2 bảng × 2 masonry. */
const BOARD_GRID_CLASS =
  'grid grid-cols-1 items-start gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4';

const FILTER_BTN_CLASS =
  'h-8 shrink-0 cursor-pointer gap-[0.35rem] border-slate-300 bg-white text-[0.8125rem] font-medium text-brand shadow-none outline-none ring-0 ring-offset-0 focus:border-slate-300 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-slate-300 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 active:border-slate-300 active:outline-none data-[state=open]:border-slate-300 data-[state=open]:ring-0';

const TABLE_HEAD_CLASS =
  'h-9 border-b border-slate-200 bg-slate-50/80 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500';

const STATUS_LABEL: Record<ActiveFilter, string> = {
  all: 'Trạng thái',
  active: 'Hoạt động',
  inactive: 'Tạm dừng',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function paginateClient<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function buildClientPagination(totalItems: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}

function TeamCardSkeleton() {
  return (
    <div className="min-w-0 animate-pulse overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="space-y-2.5 p-3 sm:space-y-3 sm:p-4">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-4 w-20 rounded-full bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
      <div className="border-t border-border px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="flex gap-3">
          <div className="h-3 w-10 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

function TeamExpandedMembers({
  teamId,
  actions,
  onAddMember,
  canAddMember,
  enabled = true,
}: {
  teamId: string;
  actions?: ReactNode;
  onAddMember: () => void;
  canAddMember: boolean;
  enabled?: boolean;
}) {
  const { data: staffData, isLoading: membersLoading } = useCompanyStaffList(
    {
      page: 1,
      pageSize: FETCH_PAGE_SIZE,
    },
    { enabled }
  );

  const members = useMemo(() => {
    const list = (staffData?.items ?? []).filter(s => s.teamId === teamId);
    return [...list].sort((a, b) => {
      const aLead = a.position === 'Team Leader' ? 1 : 0;
      const bLead = b.position === 'Team Leader' ? 1 : 0;
      return bLead - aLead;
    });
  }, [staffData?.items, teamId]);

  return (
    <div className="border-t border-border bg-muted/20 px-3 pb-3 pt-2.5 sm:px-4 sm:pb-4 sm:pt-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Thành viên ({membersLoading ? '…' : members.length})
        </p>
        {actions}
      </div>
      {membersLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex animate-pulse items-center gap-2.5">
              <div className="size-8 rounded-full bg-muted" />
              <div className="space-y-1.5">
                <div className="h-2.5 w-28 rounded bg-muted" />
                <div className="h-2 w-36 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="py-2 text-center text-xs text-slate-500">Chưa có thành viên</p>
      ) : (
        <ul className="space-y-2">
          {members.map(m => {
            const isLeader = m.position === 'Team Leader';
            return (
              <li key={m.userId} className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
                    isLeader ? 'bg-amber-400' : 'bg-slate-300'
                  )}
                >
                  {getInitials(m.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-800">{m.fullName}</p>
                  <p className="truncate text-[11px] text-slate-500">{m.email}</p>
                </div>
                {isLeader ? <Crown className="size-3.5 shrink-0 text-amber-400" /> : null}
              </li>
            );
          })}
        </ul>
      )}

      {canAddMember ? (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onAddMember();
          }}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground transition hover:border-emerald-300 hover:text-emerald-600"
        >
          <UserPlus className="size-3.5" />
          Thêm thành viên vào đội
        </button>
      ) : null}
    </div>
  );
}

function TeamCardMenu({
  team,
  onRename,
  onArchive,
  onDelete,
}: {
  team: CompanyTeamListItem;
  onRename: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-slate-500 hover:bg-muted hover:text-slate-700"
          onClick={e => e.stopPropagation()}
          aria-label="Thao tác đội"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
        <DropdownMenuItem onClick={onRename}>
          <Pencil className="mr-2 size-3.5" />
          Đổi tên
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onArchive}>
          <Power className="mr-2 size-3.5" />
          {team.isActive ? 'Vô hiệu hoá' : 'Kích hoạt'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
          <Trash2 className="mr-2 size-3.5" />
          Xóa đội
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CompanyTeamCard({
  team,
  companyName,
  isExpanded,
  queryEnabled = true,
  onToggle,
  onRename,
  onArchive,
  onDelete,
  onAddMember,
}: {
  team: CompanyTeamListItem;
  companyName: string;
  isExpanded: boolean;
  queryEnabled?: boolean;
  onToggle: () => void;
  onRename: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onAddMember: () => void;
}) {
  const canAddMember = team.isActive;
  const affiliationLine = formatCompanyTeamAffiliationLine(companyName);

  return (
    <div
      className={cn(
        'flex min-w-0 w-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-[border-color,box-shadow] duration-200 hover:shadow-md',
        isExpanded ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-border'
      )}
    >
      {/* Body — parity officer TeamCard (full-width expand hit area) */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer flex-col gap-3 p-3 text-left transition-colors hover:bg-muted/20 sm:p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <span className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800">
              {team.name}
            </span>
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                team.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              )}
            >
              {team.isActive ? '● Hoạt động' : '● Tạm dừng'}
            </span>
          </div>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.22, ease: CARD_EXPAND_TRANSITION.ease }}
            className="mt-0.5 inline-flex shrink-0"
          >
            <ChevronDown className="size-4 text-slate-400" />
          </motion.span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Building2 className="size-3 shrink-0" />
          <span className="truncate">{affiliationLine}</span>
        </div>
      </button>

      <AnimatePresence initial={false} mode="sync">
        {!isExpanded ? (
          <motion.div
            key="footer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={CARD_EXPAND_TRANSITION}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2 sm:px-4 sm:py-2.5">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Users className="size-3.5 shrink-0" />
                  <span>{team.memberCount}</span>
                </div>
                <span className="truncate text-xs text-slate-500">
                  {formatCompanyDate(team.createdAt)}
                </span>
              </div>
              {canAddMember ? (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onAddMember();
                  }}
                  className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-50"
                >
                  <Plus className="size-3" />
                  Thêm thành viên
                </button>
              ) : null}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={CARD_EXPAND_TRANSITION}
            className="overflow-hidden"
          >
            <TeamExpandedMembers
              teamId={team.id}
              onAddMember={onAddMember}
              canAddMember={canAddMember}
              enabled={queryEnabled && isExpanded}
              actions={
                <TeamCardMenu
                  team={team}
                  onRename={onRename}
                  onArchive={onArchive}
                  onDelete={onDelete}
                />
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CompanyTeamsView({
  viewMode,
  enabled = true,
}: {
  viewMode: CompanyTeamsViewMode;
  enabled?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [boardPage, setBoardPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<CompanyTeamArchiveTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompanyTeamDeleteTarget | null>(null);
  const [addMemberTarget, setAddMemberTarget] = useState<CompanyTeamAddMemberTarget | null>(null);

  const isActiveParam =
    activeFilter === 'all' ? undefined : activeFilter === 'active' ? true : false;

  const { data, isPending, isError, isFetching, refetch } = useCompanyTeamsList(
    {
      page: 1,
      pageSize: FETCH_PAGE_SIZE,
      isActive: isActiveParam,
    },
    { enabled }
  );
  const { data: myCompany } = useMyCompany();
  const companyName = myCompany?.name?.trim() ?? '';

  const archiveTeam = useArchiveCompanyTeam();
  const deleteTeam = useDeleteCompanyTeam();

  const allTeams = useMemo(() => data?.items ?? [], [data?.items]);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return allTeams;
    const q = debouncedSearch.toLowerCase();
    return allTeams.filter(
      t => t.name.toLowerCase().includes(q) || t.teamType.toLowerCase().includes(q)
    );
  }, [allTeams, debouncedSearch]);

  const boardTeams = useMemo(
    () => paginateClient(filtered, boardPage, BOARD_PAGE_SIZE),
    [filtered, boardPage]
  );
  const boardPagination = useMemo(
    () => buildClientPagination(filtered.length, boardPage, BOARD_PAGE_SIZE),
    [filtered.length, boardPage]
  );

  const listTeams = useMemo(() => paginateClient(filtered, page, LIST_PAGE_SIZE), [filtered, page]);
  const listPagination = useMemo(
    () => buildClientPagination(filtered.length, page, LIST_PAGE_SIZE),
    [filtered.length, page]
  );

  const resetPages = () => {
    setPage(1);
    setBoardPage(1);
    setExpandedId(null);
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    resetPages();
  };

  const handleStatusFilter = (v: ActiveFilter) => {
    setActiveFilter(v);
    resetPages();
  };

  const confirmArchiveToggle = () => {
    if (!archiveTarget) return;
    const nextActive = !archiveTarget.isActive;
    archiveTeam.mutate(
      { id: archiveTarget.id, body: { isActive: nextActive } },
      {
        onSuccess: env => {
          toast.success(
            env.message ?? (nextActive ? 'Đã kích hoạt lại đội' : 'Đã vô hiệu hóa đội')
          );
          setArchiveTarget(null);
        },
        onError: err =>
          toast.error(
            getCompanyMutationError(
              err,
              nextActive ? 'Không thể kích hoạt đội' : 'Không thể vô hiệu hóa đội'
            )
          ),
      }
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget?.id?.trim()) {
      toast.error('Không xác định được đội cần xóa');
      return;
    }
    deleteTeam.mutate(deleteTarget.id, {
      onSuccess: env => {
        toast.success(env.message?.trim() || 'Đã xóa đội');
        setDeleteTarget(null);
        setExpandedId(null);
      },
      onError: err => toast.error(getCompanyMutationError(err, 'Không thể xóa đội')),
    });
  };

  const toolbar = (
    <header className="shrink-0 py-3 sm:py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full min-w-0 sm:w-72 sm:max-w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Tìm tên đội..."
            className={cn(
              'h-8 w-full border-slate-200 bg-white pl-9 text-sm shadow-none',
              isFetching && !isPending && 'pr-8'
            )}
            aria-label="Tìm tên đội"
          />
          {isFetching && !isPending ? (
            <Loader2
              className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-slate-400"
              aria-hidden
            />
          ) : null}
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:min-w-0 sm:flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className={FILTER_BTN_CLASS}>
                {STATUS_LABEL[activeFilter]}
                <ChevronDown className="size-3.5 opacity-60" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36">
              {(Object.keys(STATUS_LABEL) as ActiveFilter[]).map(key => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleStatusFilter(key)}
                  className={
                    activeFilter === key
                      ? 'cursor-pointer font-medium text-brand'
                      : 'cursor-pointer'
                  }
                >
                  {STATUS_LABEL[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="h-8 shrink-0 cursor-pointer bg-emerald-600 px-3 text-xs font-medium text-white shadow-none hover:bg-emerald-700"
            >
              Tạo đội
            </Button>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {toolbar}

      {viewMode === 'board' ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-muted/30">
          <div className="flex shrink-0 items-center gap-2 px-4 py-3.5">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-800">Đội xử lý</h3>
            <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-500">
              {isPending ? '…' : boardPagination.totalItems}
            </span>
          </div>

          <div className="scrollbar-smooth min-h-0 flex-1 overflow-y-auto px-2 pb-3 sm:px-3">
            {isPending ? (
              <div className={BOARD_GRID_CLASS}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <TeamCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 text-sm">
                <p className="font-medium text-destructive">Không tải được danh sách đội</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => void refetch()}
                >
                  <RefreshCw className="size-3.5" aria-hidden />
                  Thử lại
                </Button>
              </div>
            ) : boardTeams.length === 0 ? (
              <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-sm text-slate-500">
                <UsersIcon size={32} className="opacity-30" />
                <span>Không có đội nào</span>
              </div>
            ) : (
              <div className={BOARD_GRID_CLASS}>
                {boardTeams.map(team => (
                  <CompanyTeamCard
                    key={team.id}
                    team={team}
                    companyName={companyName}
                    queryEnabled={enabled}
                    isExpanded={expandedId === team.id}
                    onToggle={() => setExpandedId(prev => (prev === team.id ? null : team.id))}
                    onRename={() => setRenameTarget({ id: team.id, name: team.name })}
                    onAddMember={() => setAddMemberTarget({ id: team.id, name: team.name })}
                    onArchive={() =>
                      setArchiveTarget({
                        id: team.id,
                        name: team.name,
                        isActive: team.isActive,
                      })
                    }
                    onDelete={() =>
                      setDeleteTarget({
                        id: team.id,
                        name: team.name,
                        memberCount: team.memberCount,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {boardPagination.totalPages > 1 ? (
            <div className="flex shrink-0 justify-center border-t border-border px-3 py-2">
              <PaginationSimple
                page={boardPage}
                totalPages={boardPagination.totalPages}
                onPageChange={setBoardPage}
                className="w-auto"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="min-h-0 flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={TABLE_HEAD_CLASS}>Tên đội</TableHead>
                  <TableHead className={cn(TABLE_HEAD_CLASS, 'hidden md:table-cell')}>
                    Loại
                  </TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Thành viên</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Trạng thái</TableHead>
                  <TableHead className={cn(TABLE_HEAD_CLASS, 'hidden lg:table-cell')}>
                    Ngày tạo
                  </TableHead>
                  <TableHead className={cn(TABLE_HEAD_CLASS, 'w-12')} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-sm text-slate-500">
                      <GreenLensLookupSpinner className="mx-auto size-8" />
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-sm text-destructive">
                      Không thể tải dữ liệu.{' '}
                      <button type="button" className="underline" onClick={() => void refetch()}>
                        Thử lại
                      </button>
                    </TableCell>
                  </TableRow>
                ) : listTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-sm text-slate-500">
                      Không có đội nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  listTeams.map(team => (
                    <TableRow key={team.id} className="border-slate-100 hover:bg-sky-50/40">
                      <TableCell className="max-w-[10rem] px-3 py-2 sm:max-w-none">
                        <p className="truncate text-sm font-medium text-slate-800">{team.name}</p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          {formatCompanyTeamAffiliationLine(companyName)}
                        </p>
                      </TableCell>
                      <TableCell className="hidden px-3 py-2 md:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                          <span className="size-2.5 shrink-0 rounded-full bg-emerald-500" />
                          {team.teamType}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Users className="size-3.5" />
                          <span>{team.memberCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {team.isActive ? (
                          <Badge
                            variant="secondary"
                            className="rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-green-600"
                          >
                            Hoạt động
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500"
                          >
                            Tạm dừng
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden px-3 py-2 text-xs text-slate-600 lg:table-cell">
                        {formatCompanyDate(team.createdAt)}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7 cursor-pointer text-slate-500 hover:text-slate-700"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setRenameTarget({ id: team.id, name: team.name })}
                            >
                              Đổi tên
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setArchiveTarget({
                                  id: team.id,
                                  name: team.name,
                                  isActive: team.isActive,
                                })
                              }
                            >
                              {team.isActive ? 'Vô hiệu hoá' : 'Kích hoạt'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                setDeleteTarget({
                                  id: team.id,
                                  name: team.name,
                                  memberCount: team.memberCount,
                                })
                              }
                            >
                              Xóa đội
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {listPagination.totalPages > 1 ? (
            <div className="flex shrink-0 justify-center border-t border-slate-100 px-3 py-2">
              <PaginationSimple
                page={page}
                totalPages={listPagination.totalPages}
                onPageChange={setPage}
                className="w-auto"
              />
            </div>
          ) : null}
        </div>
      )}

      <CompanyTeamCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <CompanyTeamAddMemberDialog
        open={Boolean(addMemberTarget)}
        team={addMemberTarget}
        onClose={() => setAddMemberTarget(null)}
      />

      <CompanyTeamRenameDialog
        open={Boolean(renameTarget)}
        team={renameTarget}
        onClose={() => setRenameTarget(null)}
      />

      <CompanyTeamArchiveDialog
        open={Boolean(archiveTarget)}
        team={archiveTarget}
        submitting={archiveTeam.isPending}
        onConfirm={confirmArchiveToggle}
        onClose={() => {
          if (!archiveTeam.isPending) setArchiveTarget(null);
        }}
      />

      <CompanyTeamDeleteDialog
        open={Boolean(deleteTarget)}
        team={deleteTarget}
        submitting={deleteTeam.isPending}
        onConfirm={confirmDelete}
        onClose={() => {
          if (!deleteTeam.isPending) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
