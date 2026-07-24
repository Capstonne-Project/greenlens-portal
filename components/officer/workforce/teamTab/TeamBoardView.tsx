'use client';

import UsersIcon from '@/components/ui/users-icon';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { PaginationSimple } from '@/components/ui/pagination';
import { useRemoveTeamMember, useTeamDetail } from '@/hooks/useTeams';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import type { TeamListItem } from '@/lib/api/models/team';
import { cn } from '@/lib/utils';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Crown,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  WorkforceExportCsvButton,
  WorkforceViewModeSwitch,
  type WorkforceViewMode,
} from '../WorkforceToolbarActions';
import { RemoveMemberConfirmDialog } from './TeamTabDialogs';
import {
  AVAILABLE_LABEL,
  BOARD_COLUMN_PAGE_SIZE,
  buildClientPagination,
  FILTER_BTN_CLASS,
  filterTeamsBySearch,
  formatDate,
  getInitials,
  paginateClient,
  STATUS_LABEL,
  teamAvailabilityBadge,
  TEAM_TYPE_LABEL,
  type AddMemberTeamTarget,
  type AvailableFilter,
  type LeoCreateTeamType,
  type StatusFilter,
  type TeamTypeFilter,
} from './teamTab.shared';

function TeamCard({
  team,
  isExpanded,
  onToggle,
  onAddMember,
}: {
  team: TeamListItem;
  isExpanded: boolean;
  onToggle: () => void;
  onAddMember: () => void;
}) {
  const { data: detail, isLoading: membersLoading } = useTeamDetail(isExpanded ? team.id : null);
  const removeMemberMutation = useRemoveTeamMember();
  const [showMemberActions, setShowMemberActions] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    userId: string;
    fullName: string;
  } | null>(null);

  const members = [...(detail?.members ?? [])].sort(
    (a, b) => Number(b.isLeader) - Number(a.isLeader)
  );
  const availability = teamAvailabilityBadge(team.currentStatus);

  const handleToggle = () => {
    if (isExpanded) {
      setShowMemberActions(false);
      setMemberToRemove(null);
    }
    onToggle();
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    try {
      const res = await removeMemberMutation.mutateAsync({
        teamId: team.id,
        userId: memberToRemove.userId,
      });
      toastApiSuccess(res, `Đã xoá ${memberToRemove.fullName} khỏi đội.`);
      setMemberToRemove(null);
      setShowMemberActions(false);
    } catch (err) {
      toastApiError(err, 'Không thể xoá thành viên. Vui lòng thử lại.');
    }
  };

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-200 hover:shadow-md ${
        isExpanded ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-border'
      }`}
    >
      {/* Card body — click to expand */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full cursor-pointer flex-col gap-3 p-4 text-left transition-colors hover:bg-muted/20"
      >
        {/* Row 1: name + status + chevron */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold leading-snug text-slate-800">{team.name}</span>
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                availability.className
              )}
            >
              {availability.label}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="mt-0.5 size-4 shrink-0 text-slate-400" />
          ) : (
            <ChevronDown className="mt-0.5 size-4 shrink-0 text-slate-400" />
          )}
        </div>

        {/* Row 2: office */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Building2 className="size-3 shrink-0" />
          <span className="truncate">{team.officeName}</span>
        </div>
      </button>

      {/* Card footer — hidden when expanded */}
      {!isExpanded && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Users className="size-3.5" />
              <span>{team.memberCount}</span>
            </div>
            <span className="text-xs text-slate-500">{formatDate(team.createdAt)}</span>
          </div>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onAddMember();
            }}
            className="flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-50"
          >
            <Plus className="size-3" />
            Thêm thành viên
          </button>
        </div>
      )}

      {/* Expanded: member list */}
      {isExpanded && (
        <div className="border-t border-border bg-muted/20 px-4 pb-4 pt-3">
          <RemoveMemberConfirmDialog
            open={memberToRemove != null}
            memberName={memberToRemove?.fullName ?? ''}
            submitting={removeMemberMutation.isPending}
            onConfirm={() => void handleConfirmRemove()}
            onClose={() => setMemberToRemove(null)}
          />

          <div className="mb-2.5 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Thành viên ({membersLoading ? '…' : members.length})
            </p>
            {!membersLoading && members.length > 0 && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setShowMemberActions(prev => !prev);
                }}
                className={`flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg transition ${
                  showMemberActions
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title="Quản lý thành viên"
                aria-pressed={showMemberActions}
              >
                <MoreHorizontal className="size-4" />
              </button>
            )}
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
              {members.map(m => (
                <li key={m.userId} className="flex items-center gap-2.5">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      m.isLeader ? 'bg-amber-400' : 'bg-slate-300'
                    }`}
                  >
                    {getInitials(m.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-800">{m.fullName}</p>
                    <p className="truncate text-[11px] text-slate-500">{m.email}</p>
                  </div>
                  {m.isLeader && <Crown className="size-3.5 shrink-0 text-amber-400" />}
                  {showMemberActions && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setMemberToRemove({ userId: m.userId, fullName: m.fullName });
                      }}
                      className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      title="Xóa thành viên"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

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
        </div>
      )}
    </div>
  );
}

function TeamCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="flex gap-1.5">
          <div className="h-4 w-16 rounded-full bg-muted" />
          <div className="h-4 w-20 rounded-full bg-muted" />
        </div>
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
      <div className="border-t border-border px-4 py-2.5">
        <div className="flex gap-3">
          <div className="h-3 w-10 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function TeamFilterDropdowns({
  statusFilter,
  teamTypeFilter,
  availableFilter,
  onStatusChange,
  onTeamTypeChange,
  onAvailableChange,
}: {
  statusFilter: StatusFilter;
  teamTypeFilter: TeamTypeFilter;
  availableFilter: AvailableFilter;
  onStatusChange: (v: StatusFilter) => void;
  onTeamTypeChange: (v: TeamTypeFilter) => void;
  onAvailableChange: (v: AvailableFilter) => void;
}) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className={FILTER_BTN_CLASS}>
            {STATUS_LABEL[statusFilter]}
            <ChevronDown className="size-3.5 opacity-60" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          {(Object.keys(STATUS_LABEL) as StatusFilter[]).map(key => (
            <DropdownMenuItem
              key={key}
              onClick={() => onStatusChange(key)}
              className={
                statusFilter === key
                  ? 'cursor-pointer font-medium text-slate-900'
                  : 'cursor-pointer'
              }
            >
              {STATUS_LABEL[key]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className={FILTER_BTN_CLASS}>
            {TEAM_TYPE_LABEL[teamTypeFilter]}
            <ChevronDown className="size-3.5 opacity-60" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {(Object.keys(TEAM_TYPE_LABEL) as TeamTypeFilter[]).map(key => (
            <DropdownMenuItem
              key={key}
              onClick={() => onTeamTypeChange(key)}
              className={
                teamTypeFilter === key
                  ? 'cursor-pointer font-medium text-slate-900'
                  : 'cursor-pointer'
              }
            >
              {TEAM_TYPE_LABEL[key]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className={FILTER_BTN_CLASS}>
            {AVAILABLE_LABEL[availableFilter]}
            <ChevronDown className="size-3.5 opacity-60" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {(Object.keys(AVAILABLE_LABEL) as AvailableFilter[]).map(key => (
            <DropdownMenuItem
              key={key}
              onClick={() => onAvailableChange(key)}
              className={
                availableFilter === key
                  ? 'cursor-pointer font-medium text-slate-900'
                  : 'cursor-pointer'
              }
            >
              {AVAILABLE_LABEL[key]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

type BoardViewProps = {
  teams: TeamListItem[];
  isLoading: boolean;
  isFetching: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  teamTypeFilter: TeamTypeFilter;
  availableFilter: AvailableFilter;
  onStatusChange: (value: StatusFilter) => void;
  onTeamTypeChange: (value: TeamTypeFilter) => void;
  onAvailableChange: (value: AvailableFilter) => void;
  cleanupPage: number;
  inspectionPage: number;
  onCleanupPageChange: (page: number) => void;
  onInspectionPageChange: (page: number) => void;
  onAddMember: (team: AddMemberTeamTarget) => void;
  onCreateTeam: (teamType: LeoCreateTeamType) => void;
  viewMode: WorkforceViewMode;
  onViewModeChange: (mode: WorkforceViewMode) => void;
};

export function BoardView({
  teams,
  isLoading,
  isFetching,
  search,
  onSearchChange,
  statusFilter,
  teamTypeFilter,
  availableFilter,
  onStatusChange,
  onTeamTypeChange,
  onAvailableChange,
  cleanupPage,
  inspectionPage,
  onCleanupPageChange,
  onInspectionPageChange,
  onAddMember,
  onCreateTeam,
  viewMode,
  onViewModeChange,
}: BoardViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const showCleanup = teamTypeFilter === 'all' || teamTypeFilter === 'Cleanup';
  const showInspection = teamTypeFilter === 'all' || teamTypeFilter === 'Inspection';
  const isDualColumn = showCleanup && showInspection;

  const cleanupSource = useMemo(() => {
    if (!isDualColumn) {
      return teamTypeFilter === 'Cleanup' ? teams : [];
    }
    return teams.filter(t => t.teamType === 'Cleanup');
  }, [teams, isDualColumn, teamTypeFilter]);

  const inspectionSource = useMemo(() => {
    if (!isDualColumn) {
      return teamTypeFilter === 'Inspection' ? teams : [];
    }
    return teams.filter(t => t.teamType === 'Inspection');
  }, [teams, isDualColumn, teamTypeFilter]);

  const cleanupFiltered = useMemo(
    () => filterTeamsBySearch(cleanupSource, search),
    [cleanupSource, search]
  );
  const inspectionFiltered = useMemo(
    () => filterTeamsBySearch(inspectionSource, search),
    [inspectionSource, search]
  );

  const cleanupTeams = useMemo(
    () => paginateClient(cleanupFiltered, cleanupPage, BOARD_COLUMN_PAGE_SIZE),
    [cleanupFiltered, cleanupPage]
  );
  const inspectionTeams = useMemo(
    () => paginateClient(inspectionFiltered, inspectionPage, BOARD_COLUMN_PAGE_SIZE),
    [inspectionFiltered, inspectionPage]
  );

  const cleanupPagination = useMemo(
    () => buildClientPagination(cleanupFiltered.length, cleanupPage, BOARD_COLUMN_PAGE_SIZE),
    [cleanupFiltered.length, cleanupPage]
  );

  const inspectionPagination = useMemo(
    () => buildClientPagination(inspectionFiltered.length, inspectionPage, BOARD_COLUMN_PAGE_SIZE),
    [inspectionFiltered.length, inspectionPage]
  );

  const cleanupLoading = isLoading && showCleanup;
  const inspLoading = isLoading && showInspection;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* Search (left) + filters + view/export (right) */}
      <div className="my-2 flex shrink-0 flex-wrap items-center gap-2">
        <div className="relative w-72 max-w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Tìm tên đội..."
            className={cn(
              'h-8 w-full border-slate-200 bg-white pl-9 text-sm shadow-none',
              isFetching && !isLoading && 'pr-8'
            )}
            aria-label="Tìm tên đội"
          />
          {isFetching && !isLoading ? (
            <Loader2
              className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-slate-400"
              aria-hidden
            />
          ) : null}
        </div>
        <TeamFilterDropdowns
          statusFilter={statusFilter}
          teamTypeFilter={teamTypeFilter}
          availableFilter={availableFilter}
          onStatusChange={onStatusChange}
          onTeamTypeChange={onTeamTypeChange}
          onAvailableChange={onAvailableChange}
        />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <WorkforceViewModeSwitch value={viewMode} onChange={onViewModeChange} />
          <WorkforceExportCsvButton />
        </div>
      </div>

      {/* Kanban columns — always fill remaining height (0 or N cards) */}
      <div
        className={cn(
          'grid min-h-0 flex-1 gap-4',
          showCleanup && showInspection ? 'grid-cols-2' : 'grid-cols-1'
        )}
      >
        {/* ── Left: Cleanup ── */}
        {showCleanup ? (
          <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/30">
            <div className="flex shrink-0 items-center gap-2 px-4 py-3.5">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-800">Đội Dọn dẹp</h3>
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-500">
                {cleanupLoading ? '…' : cleanupPagination.totalItems}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onCreateTeam('Cleanup')}
                  className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  title="Thêm đội dọn dẹp"
                >
                  <Plus className="size-4" />
                </button>
                <button
                  type="button"
                  className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
            </div>

            <div className="scrollbar-smooth min-h-0 flex-1 overflow-y-auto px-3 pb-3">
              {cleanupLoading ? (
                <div className="flex gap-3">
                  <div className="flex flex-1 flex-col gap-3">
                    {[1, 3].map(i => (
                      <TeamCardSkeleton key={i} />
                    ))}
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    {[2, 4].map(i => (
                      <TeamCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              ) : cleanupTeams.length === 0 ? (
                <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-sm text-slate-500">
                  <UsersIcon size={32} className="opacity-30" />
                  <span>Không có đội nào</span>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex flex-1 flex-col gap-3">
                    {cleanupTeams
                      .filter((_, i) => i % 2 === 0)
                      .map(team => (
                        <TeamCard
                          key={`${team.id}-${expandedId === team.id ? 'open' : 'closed'}`}
                          team={team}
                          isExpanded={expandedId === team.id}
                          onToggle={() =>
                            setExpandedId(prev => (prev === team.id ? null : team.id))
                          }
                          onAddMember={() =>
                            onAddMember({
                              id: team.id,
                              name: team.name,
                              teamType: team.teamType,
                            })
                          }
                        />
                      ))}
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    {cleanupTeams
                      .filter((_, i) => i % 2 !== 0)
                      .map(team => (
                        <TeamCard
                          key={`${team.id}-${expandedId === team.id ? 'open' : 'closed'}`}
                          team={team}
                          isExpanded={expandedId === team.id}
                          onToggle={() =>
                            setExpandedId(prev => (prev === team.id ? null : team.id))
                          }
                          onAddMember={() =>
                            onAddMember({
                              id: team.id,
                              name: team.name,
                              teamType: team.teamType,
                            })
                          }
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cleanup pagination — độc lập theo cột */}
            {!cleanupLoading ? (
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-2">
                {cleanupPagination.totalPages > 1 ? (
                  <PaginationSimple
                    page={cleanupPage}
                    totalPages={cleanupPagination.totalPages}
                    onPageChange={onCleanupPageChange}
                    className="w-auto"
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ── Right: Inspection ── */}
        {showInspection ? (
          <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/30">
            <div className="flex shrink-0 items-center gap-2 px-4 py-3.5">
              <span className="size-2.5 rounded-full bg-blue-500" />
              <h3 className="text-sm font-semibold text-slate-800">Đội Kiểm tra</h3>
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-500">
                {inspLoading ? '…' : inspectionPagination.totalItems}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onCreateTeam('Inspection')}
                  className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  title="Thêm đội kiểm tra"
                >
                  <Plus className="size-4" />
                </button>
                <button
                  type="button"
                  className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
            </div>

            <div className="scrollbar-smooth min-h-0 flex-1 overflow-y-auto px-3 pb-3">
              {inspLoading ? (
                <div className="flex gap-3">
                  <div className="flex flex-1 flex-col gap-3">
                    {[1, 3].map(i => (
                      <TeamCardSkeleton key={i} />
                    ))}
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    {[2, 4].map(i => (
                      <TeamCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              ) : inspectionTeams.length === 0 ? (
                <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-sm text-slate-500">
                  <UsersIcon size={32} className="opacity-30" />
                  <span>Không có đội nào</span>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex flex-1 flex-col gap-3">
                    {inspectionTeams
                      .filter((_, i) => i % 2 === 0)
                      .map(team => (
                        <TeamCard
                          key={`${team.id}-${expandedId === team.id ? 'open' : 'closed'}`}
                          team={team}
                          isExpanded={expandedId === team.id}
                          onToggle={() =>
                            setExpandedId(prev => (prev === team.id ? null : team.id))
                          }
                          onAddMember={() =>
                            onAddMember({
                              id: team.id,
                              name: team.name,
                              teamType: team.teamType,
                            })
                          }
                        />
                      ))}
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    {inspectionTeams
                      .filter((_, i) => i % 2 !== 0)
                      .map(team => (
                        <TeamCard
                          key={`${team.id}-${expandedId === team.id ? 'open' : 'closed'}`}
                          team={team}
                          isExpanded={expandedId === team.id}
                          onToggle={() =>
                            setExpandedId(prev => (prev === team.id ? null : team.id))
                          }
                          onAddMember={() =>
                            onAddMember({
                              id: team.id,
                              name: team.name,
                              teamType: team.teamType,
                            })
                          }
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Inspection pagination — độc lập theo cột */}
            {!inspLoading ? (
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-2">
                {inspectionPagination.totalPages > 1 ? (
                  <PaginationSimple
                    page={inspectionPage}
                    totalPages={inspectionPagination.totalPages}
                    onPageChange={onInspectionPageChange}
                    className="w-auto"
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
