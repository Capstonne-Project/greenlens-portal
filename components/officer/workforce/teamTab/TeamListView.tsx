'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { PaginationSimple } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TeamListItem } from '@/lib/api/models/team';
import { cn } from '@/lib/utils';
import { Loader2, MoreHorizontal, RefreshCw, Search, Users } from 'lucide-react';
import {
  WorkforceExportCsvButton,
  WorkforceViewModeSwitch,
  type WorkforceViewMode,
} from '../WorkforceToolbarActions';
import { TeamFilterDropdowns } from './TeamBoardView';
import {
  formatDate,
  TABLE_HEAD_CLASS,
  TYPE_DOT,
  TYPE_LABEL,
  type AddMemberTeamTarget,
  type AvailableFilter,
  type ClientPagination,
  type StatusFilter,
  type TeamTypeFilter,
} from './teamTab.shared';

function SkeletonRows() {
  return (
    <>
      {['s1', 's2', 's3', 's4', 's5'].map(key => (
        <TableRow key={key} className="animate-pulse">
          <TableCell className="px-3 py-2">
            <div className="size-4 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-3 py-2">
            <div className="h-3 w-36 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-3 py-2">
            <div className="h-5 w-20 rounded-full bg-muted" />
          </TableCell>
          <TableCell className="px-3 py-2">
            <div className="h-3 w-48 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-3 py-2">
            <div className="h-3 w-8 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-3 py-2">
            <div className="h-5 w-20 rounded-full bg-muted" />
          </TableCell>
          <TableCell className="px-3 py-2">
            <div className="h-3 w-20 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-3 py-2" />
        </TableRow>
      ))}
    </>
  );
}

export type TeamListViewProps = {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  teamTypeFilter: TeamTypeFilter;
  availableFilter: AvailableFilter;
  onStatusChange: (value: StatusFilter) => void;
  onTeamTypeChange: (value: TeamTypeFilter) => void;
  onAvailableChange: (value: AvailableFilter) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  listFiltered: TeamListItem[];
  listTeams: TeamListItem[];
  listPagination: ClientPagination;
  page: number;
  onPageChange: (page: number) => void;
  selected: Set<string>;
  allChecked: boolean;
  indeterminate: boolean;
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
  onDetailTeam: (team: TeamListItem) => void;
  onAddMember: (team: AddMemberTeamTarget) => void;
  viewMode: WorkforceViewMode;
  onViewModeChange: (mode: WorkforceViewMode) => void;
};

export function TeamListView({
  search,
  onSearchChange,
  statusFilter,
  teamTypeFilter,
  availableFilter,
  onStatusChange,
  onTeamTypeChange,
  onAvailableChange,
  isRefreshing,
  onRefresh,
  isLoading,
  isFetching,
  isError,
  listFiltered,
  listTeams,
  listPagination,
  page,
  onPageChange,
  selected,
  allChecked,
  indeterminate,
  onToggleAll,
  onToggleOne,
  onDetailTeam,
  onAddMember,
  viewMode,
  onViewModeChange,
}: TeamListViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* Toolbar — search (left) + filters + view/export (right) */}
      <div className="my-2 flex shrink-0 flex-wrap items-center gap-2">
        <div className="relative w-72 max-w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Tìm tên đội, văn phòng..."
            className={cn(
              'h-8 w-full border-slate-200 bg-white pl-9 text-sm shadow-none',
              isFetching && !isLoading && 'pr-8'
            )}
            aria-label="Tìm tên đội, văn phòng"
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 cursor-pointer text-slate-500"
          >
            <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <WorkforceViewModeSwitch value={viewMode} onChange={onViewModeChange} />
          <WorkforceExportCsvButton />
        </div>
      </div>

      {/* Table — always fills remaining height (0 or N rows) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="min-h-0 flex-1 overflow-auto [&_table]:border-collapse">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={cn(TABLE_HEAD_CLASS, 'w-12')}>
                  <Checkbox
                    checked={indeterminate ? 'indeterminate' : allChecked}
                    onCheckedChange={onToggleAll}
                  />
                </TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>Tên đội</TableHead>
                <TableHead className={cn(TABLE_HEAD_CLASS, 'w-[120px]')}>Loại</TableHead>
                <TableHead className={cn(TABLE_HEAD_CLASS, 'min-w-[160px]')}>
                  Văn phòng quản lý
                </TableHead>
                <TableHead className={cn(TABLE_HEAD_CLASS, 'w-[100px]')}>Thành viên</TableHead>
                <TableHead className={cn(TABLE_HEAD_CLASS, 'w-[120px]')}>Trạng thái</TableHead>
                <TableHead className={cn(TABLE_HEAD_CLASS, 'w-[110px]')}>Ngày tạo</TableHead>
                <TableHead className={cn(TABLE_HEAD_CLASS, 'w-12')} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <SkeletonRows />}
              {isError && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-40 px-3 py-2 text-center text-sm text-destructive"
                  >
                    Không thể tải dữ liệu. Vui lòng thử lại.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && listFiltered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-40 px-3 py-2 text-center text-sm text-slate-500"
                  >
                    Không có đội nào phù hợp.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                !isError &&
                listTeams.map(team => (
                  <TableRow
                    key={team.id}
                    onClick={() => onDetailTeam(team)}
                    className={cn(
                      'cursor-pointer border-slate-100 hover:bg-sky-50/40',
                      selected.has(team.id) && 'bg-sky-50/60'
                    )}
                  >
                    <TableCell className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.has(team.id)}
                        onCheckedChange={() => onToggleOne(team.id)}
                      />
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm font-medium text-slate-800">
                      {team.name}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                        <span
                          className={cn(
                            'inline-block size-2.5 shrink-0 rounded-full',
                            TYPE_DOT[team.teamType] ?? 'bg-slate-300'
                          )}
                          aria-hidden
                        />
                        {TYPE_LABEL[team.teamType] ?? team.teamType}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600">
                      {team.officeName}
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
                    <TableCell className="px-3 py-2 text-xs text-slate-600">
                      {formatDate(team.createdAt)}
                    </TableCell>
                    <TableCell className="px-3 py-2" onClick={e => e.stopPropagation()}>
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
                          <DropdownMenuItem onClick={() => onDetailTeam(team)}>
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              onAddMember({
                                id: team.id,
                                name: team.name,
                                teamType: team.teamType,
                              })
                            }
                          >
                            Phân công thành viên
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            Vô hiệu hoá
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-2">
          {listPagination.totalPages > 1 ? (
            <PaginationSimple
              page={page}
              totalPages={listPagination.totalPages}
              onPageChange={onPageChange}
              className="w-auto"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
