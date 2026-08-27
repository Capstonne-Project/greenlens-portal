'use client';

import UsersIcon from '@/components/ui/users-icon';
import { WasteTagBadgeRow } from '@/components/common/WasteTagSelectChip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { PaginationSimple } from '@/components/ui/pagination';
import { useRemoveTeamMember, useTeamDetail } from '@/hooks/useTeams';
import { useCatalogWasteTags } from '@/hooks/useWasteTags';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import type { TeamListItem } from '@/lib/api/models/team';
import { cn } from '@/lib/utils';
import { deferOpenFromMenu } from '@/lib/utils/radixUi';
import {
  Building2,
  ChevronDown,
  Crown,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { WorkforceViewModeSwitch, type WorkforceViewMode } from '../WorkforceToolbarActions';
import { EditTeamDialog, RemoveMemberConfirmDialog } from './TeamTabDialogs';
import {
  AVAILABLE_LABEL,
  FILTER_BTN_CLASS,
  filterTeamsBySearch,
  formatDate,
  getInitials,
  STATUS_LABEL,
  teamAvailabilityBadge,
  TEAM_TYPE_LABEL,
  toEditTeamTarget,
  type AddMemberTeamTarget,
  type AvailableFilter,
  type ClientPagination,
  type EditTeamTarget,
  type LeoCreateTeamType,
  type StatusFilter,
  type TeamTypeFilter,
} from './teamTab.shared';

const CARD_EXPAND_TRANSITION = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
};

function TeamCardActionsMenu({
  onEdit,
  canRemoveMember,
  showMemberActions,
  onToggleRemoveMember,
}: {
  onEdit: () => void;
  canRemoveMember: boolean;
  showMemberActions: boolean;
  onToggleRemoveMember: () => void;
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
        <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
          <Pencil className="mr-2 size-3.5" />
          Chỉnh sửa
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!canRemoveMember}
          onClick={onToggleRemoveMember}
          className={cn(
            'cursor-pointer',
            showMemberActions
              ? 'font-medium text-brand focus:text-brand'
              : 'text-destructive focus:text-destructive'
          )}
        >
          <Trash2 className="mr-2 size-3.5" />
          {showMemberActions ? 'Huỷ xoá thành viên' : 'Xóa thành viên'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TeamCard({
  team,
  isExpanded,
  onToggle,
  onAddMember,
  onEdit,
}: {
  team: TeamListItem;
  isExpanded: boolean;
  onToggle: () => void;
  onAddMember: () => void;
  onEdit: () => void;
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
    <div className={cn('relative h-full min-w-0', isExpanded && 'z-20')}>
      {/* Shell giữ chiều cao hàng — panel mở nối liền (không khe hở) */}
      <div
        className={cn(
          'flex h-full min-w-0 flex-col overflow-hidden border bg-card transition-[border-color,box-shadow,border-radius] duration-200',
          isExpanded
            ? 'rounded-t-lg rounded-b-none border-b-0 border-emerald-200 shadow-none'
            : 'rounded-lg border-border shadow-sm hover:shadow-md'
        )}
      >
        <button
          type="button"
          onClick={handleToggle}
          className="flex w-full flex-1 cursor-pointer flex-col gap-3 p-4 text-left transition-colors hover:bg-muted/20"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              <span className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800">
                {team.name}
              </span>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                  availability.className
                )}
              >
                {availability.label}
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
            <span className="truncate">{team.officeName ?? 'Đội công ty'}</span>
          </div>

          {team.teamType === 'Cleanup' ? <WasteTagBadgeRow tags={team.wasteTags} /> : null}
        </button>

        <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Users className="size-3.5" />
              <span>{team.memberCount}</span>
            </div>
            <span className="text-xs text-slate-500">{formatDate(team.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
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
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={CARD_EXPAND_TRANSITION}
            className="absolute inset-x-0 top-full z-20 -mt-px overflow-hidden rounded-b-lg border border-t-0 border-emerald-200 bg-card shadow-md"
          >
            <div className="bg-muted/20 px-4 pb-4 pt-3">
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
                <TeamCardActionsMenu
                  onEdit={onEdit}
                  canRemoveMember={!membersLoading && members.length > 0}
                  showMemberActions={showMemberActions}
                  onToggleRemoveMember={() => setShowMemberActions(prev => !prev)}
                />
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
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function TeamCardSkeleton() {
  return (
    <div className="flex h-full min-w-0 animate-pulse flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex-1 space-y-3 p-4">
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
  wasteTagFilter,
  onStatusChange,
  onTeamTypeChange,
  onAvailableChange,
  onWasteTagChange,
}: {
  statusFilter: StatusFilter;
  teamTypeFilter: TeamTypeFilter;
  availableFilter: AvailableFilter;
  wasteTagFilter: string[];
  onStatusChange: (v: StatusFilter) => void;
  onTeamTypeChange: (v: TeamTypeFilter) => void;
  onAvailableChange: (v: AvailableFilter) => void;
  onWasteTagChange: (v: string[]) => void;
}) {
  const [tagDropOpen, setTagDropOpen] = useState(false);
  const { data: catalogTags, isPending: tagsLoading } = useCatalogWasteTags(tagDropOpen);

  const toggleTag = (tagId: string) => {
    onWasteTagChange(
      wasteTagFilter.includes(tagId)
        ? wasteTagFilter.filter(id => id !== tagId)
        : [...wasteTagFilter, tagId]
    );
  };

  const tagBtnLabel =
    wasteTagFilter.length === 0 ? 'Loại rác thải' : `Loại rác thải (${wasteTagFilter.length})`;

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
                statusFilter === key ? 'cursor-pointer font-medium text-brand' : 'cursor-pointer'
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
                teamTypeFilter === key ? 'cursor-pointer font-medium text-brand' : 'cursor-pointer'
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
                availableFilter === key ? 'cursor-pointer font-medium text-brand' : 'cursor-pointer'
              }
            >
              {AVAILABLE_LABEL[key]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Waste tag multi-filter */}
      <DropdownMenu open={tagDropOpen} onOpenChange={setTagDropOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              FILTER_BTN_CLASS,
              wasteTagFilter.length > 0 && 'border-emerald-400 text-emerald-700'
            )}
          >
            <Tag className="size-3 opacity-70" aria-hidden />
            {tagBtnLabel}
            <ChevronDown className="size-3.5 opacity-60" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52 p-1">
          {tagsLoading ? (
            <div className="flex items-center justify-center gap-2 px-2 py-3 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Đang tải…
            </div>
          ) : !catalogTags?.length ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              Không có loại rác thải
            </div>
          ) : (
            <>
              {wasteTagFilter.length > 0 ? (
                <DropdownMenuItem
                  onSelect={() => onWasteTagChange([])}
                  className="cursor-pointer text-xs text-muted-foreground"
                >
                  Xóa bộ lọc
                </DropdownMenuItem>
              ) : null}
              {catalogTags.map(tag => {
                const checked = wasteTagFilter.includes(tag.id);
                return (
                  <DropdownMenuCheckboxItem
                    key={tag.id}
                    checked={checked}
                    onCheckedChange={() => toggleTag(tag.id)}
                    onSelect={e => e.preventDefault()}
                    className="cursor-pointer text-xs"
                  >
                    {tag.nameVi}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

type BoardViewProps = {
  cleanupTeams: TeamListItem[];
  inspectionTeams: TeamListItem[];
  cleanupPagination: ClientPagination;
  inspectionPagination: ClientPagination;
  cleanupLoading: boolean;
  inspectionLoading: boolean;
  isFetching: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  teamTypeFilter: TeamTypeFilter;
  availableFilter: AvailableFilter;
  wasteTagFilter: string[];
  onStatusChange: (value: StatusFilter) => void;
  onTeamTypeChange: (value: TeamTypeFilter) => void;
  onAvailableChange: (value: AvailableFilter) => void;
  onWasteTagChange: (value: string[]) => void;
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
  cleanupTeams: cleanupSource,
  inspectionTeams: inspectionSource,
  cleanupPagination,
  inspectionPagination,
  cleanupLoading,
  inspectionLoading,
  isFetching,
  search,
  onSearchChange,
  statusFilter,
  teamTypeFilter,
  availableFilter,
  wasteTagFilter,
  onStatusChange,
  onTeamTypeChange,
  onAvailableChange,
  onWasteTagChange,
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
  const [editTarget, setEditTarget] = useState<EditTeamTarget | null>(null);

  const showCleanup = teamTypeFilter === 'all' || teamTypeFilter === 'Cleanup';
  const showInspection = teamTypeFilter === 'all' || teamTypeFilter === 'Inspection';

  const cleanupTeams = useMemo(
    () => filterTeamsBySearch(cleanupSource, search),
    [cleanupSource, search]
  );
  const inspectionTeams = useMemo(
    () => filterTeamsBySearch(inspectionSource, search),
    [inspectionSource, search]
  );

  const inspLoading = inspectionLoading;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Search + filters (trái) + export + view mode (phải) */}
      <header className="mb-6 shrink-0">
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="relative w-72 max-w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Tìm tên đội..."
              className={cn(
                'h-8 w-full border-slate-200 bg-white pl-9 text-sm shadow-none',
                isFetching && !cleanupLoading && !inspLoading && 'pr-8'
              )}
              aria-label="Tìm tên đội"
            />
            {isFetching && !cleanupLoading && !inspLoading ? (
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
            wasteTagFilter={wasteTagFilter}
            onStatusChange={onStatusChange}
            onTeamTypeChange={onTeamTypeChange}
            onAvailableChange={onAvailableChange}
            onWasteTagChange={onWasteTagChange}
          />
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <WorkforceViewModeSwitch value={viewMode} onChange={onViewModeChange} />
          </div>
        </div>
      </header>

      {/* Kanban columns — fill remaining height; scroll only inside each column */}
      <div
        className={cn(
          'grid min-h-0 flex-1 gap-4 overflow-hidden',
          showCleanup && showInspection ? 'grid-cols-2' : 'grid-cols-1'
        )}
      >
        {/* ── Left: Cleanup ── */}
        {showCleanup ? (
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/30">
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

            <div className="scrollbar-smooth min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3">
              {cleanupLoading ? (
                <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
                  {[1, 2, 3, 4].map(i => (
                    <TeamCardSkeleton key={i} />
                  ))}
                </div>
              ) : cleanupTeams.length === 0 ? (
                <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-sm text-slate-500">
                  <UsersIcon size={32} className="opacity-30" />
                  <span>Không có đội nào</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
                  {cleanupTeams.map(team => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      isExpanded={expandedId === team.id}
                      onToggle={() => setExpandedId(prev => (prev === team.id ? null : team.id))}
                      onAddMember={() =>
                        onAddMember({
                          id: team.id,
                          name: team.name,
                          teamType: team.teamType,
                        })
                      }
                      onEdit={() => deferOpenFromMenu(() => setEditTarget(toEditTeamTarget(team)))}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Cleanup pagination — độc lập theo cột */}
            {!cleanupLoading && cleanupPagination.totalPages > 1 ? (
              <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-border px-3 py-2">
                <PaginationSimple
                  page={cleanupPage}
                  totalPages={cleanupPagination.totalPages}
                  onPageChange={onCleanupPageChange}
                  className="w-auto"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ── Right: Inspection ── */}
        {showInspection ? (
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/30">
            <div className="flex shrink-0 items-center gap-2 px-4 py-3.5">
              <span className="size-2.5 rounded-full bg-blue-500" />
              <h3 className="text-sm font-semibold text-slate-800">Đội Thanh tra</h3>
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

            <div className="scrollbar-smooth min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3">
              {inspLoading ? (
                <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
                  {[1, 2, 3, 4].map(i => (
                    <TeamCardSkeleton key={i} />
                  ))}
                </div>
              ) : inspectionTeams.length === 0 ? (
                <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-sm text-slate-500">
                  <UsersIcon size={32} className="opacity-30" />
                  <span>Không có đội nào</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
                  {inspectionTeams.map(team => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      isExpanded={expandedId === team.id}
                      onToggle={() => setExpandedId(prev => (prev === team.id ? null : team.id))}
                      onAddMember={() =>
                        onAddMember({
                          id: team.id,
                          name: team.name,
                          teamType: team.teamType,
                        })
                      }
                      onEdit={() => deferOpenFromMenu(() => setEditTarget(toEditTeamTarget(team)))}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Inspection pagination — độc lập theo cột */}
            {!inspLoading && inspectionPagination.totalPages > 1 ? (
              <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-border px-3 py-2">
                <PaginationSimple
                  page={inspectionPage}
                  totalPages={inspectionPagination.totalPages}
                  onPageChange={onInspectionPageChange}
                  className="w-auto"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <EditTeamDialog
        open={editTarget != null}
        team={editTarget}
        onClose={() => setEditTarget(null)}
      />
    </div>
  );
}
