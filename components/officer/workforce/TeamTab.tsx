'use client';

import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useTeamsList } from '@/hooks/useTeams';
import type { TeamListItem } from '@/lib/api/models/team';
import { useMemo, useState } from 'react';
import { BoardView } from './teamTab/TeamBoardView';
import { AddMemberDialog, CreateTeamDialog, TeamDetailDialog } from './teamTab/TeamTabDialogs';
import { TeamListView } from './teamTab/TeamListView';
import type { WorkforceViewMode } from './WorkforceToolbarActions';
import {
  BOARD_COLUMN_PAGE_SIZE,
  buildSharedTeamsQueryParams,
  filterTeamsBySearch,
  PAGE_SIZE,
  type AddMemberTeamTarget,
  type AvailableFilter,
  type ClientPagination,
  type LeoCreateTeamType,
  type StatusFilter,
  type TeamTypeFilter,
} from './teamTab/teamTab.shared';

function fallbackPagination(page: number, pageSize: number): ClientPagination {
  return {
    page,
    pageSize,
    totalItems: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };
}

function clampPage(requested: number, totalPages: number | undefined): number {
  if (totalPages == null) return requested;
  return Math.min(requested, Math.max(1, totalPages));
}

export function TeamTab() {
  const [viewMode, setViewMode] = useState<WorkforceViewMode>('board');
  const [page, setPage] = useState(1);
  const [cleanupPage, setCleanupPage] = useState(1);
  const [inspectionPage, setInspectionPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [teamTypeFilter, setTeamTypeFilter] = useState<TeamTypeFilter>('all');
  const [availableFilter, setAvailableFilter] = useState<AvailableFilter>('all');
  const [wasteTagFilter, setWasteTagFilter] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailTeam, setDetailTeam] = useState<TeamListItem | null>(null);
  const [addMemberTeam, setAddMemberTeam] = useState<AddMemberTeamTarget | null>(null);
  const [createTeamType, setCreateTeamType] = useState<LeoCreateTeamType | null>(null);

  const boardFilterParams = useMemo(
    () =>
      buildSharedTeamsQueryParams({
        statusFilter,
        teamTypeFilter: 'all',
        availableFilter,
        wasteTagFilter,
      }),
    [statusFilter, availableFilter, wasteTagFilter]
  );

  const listFilterParams = useMemo(
    () =>
      buildSharedTeamsQueryParams({
        statusFilter,
        teamTypeFilter,
        availableFilter,
        wasteTagFilter,
      }),
    [statusFilter, teamTypeFilter, availableFilter, wasteTagFilter]
  );

  const showCleanup = teamTypeFilter === 'all' || teamTypeFilter === 'Cleanup';
  const showInspection = teamTypeFilter === 'all' || teamTypeFilter === 'Inspection';

  const cleanupQuery = useTeamsList(
    {
      ...boardFilterParams,
      teamType: 'Cleanup',
      page: cleanupPage,
      pageSize: BOARD_COLUMN_PAGE_SIZE,
    },
    { enabled: viewMode === 'board' && showCleanup }
  );

  const inspectionQuery = useTeamsList(
    {
      ...boardFilterParams,
      teamType: 'Inspection',
      page: inspectionPage,
      pageSize: BOARD_COLUMN_PAGE_SIZE,
    },
    { enabled: viewMode === 'board' && showInspection }
  );

  const listQuery = useTeamsList(
    {
      ...listFilterParams,
      page,
      pageSize: PAGE_SIZE,
    },
    { enabled: viewMode === 'list' }
  );

  const cleanupPagination =
    cleanupQuery.data?.pagination ?? fallbackPagination(cleanupPage, BOARD_COLUMN_PAGE_SIZE);
  const inspectionPagination =
    inspectionQuery.data?.pagination ?? fallbackPagination(inspectionPage, BOARD_COLUMN_PAGE_SIZE);
  const listPagination = listQuery.data?.pagination ?? fallbackPagination(page, PAGE_SIZE);

  const cleanupPageSafe = clampPage(cleanupPage, cleanupQuery.data?.pagination.totalPages);
  const inspectionPageSafe = clampPage(inspectionPage, inspectionQuery.data?.pagination.totalPages);
  const listPageSafe = clampPage(page, listQuery.data?.pagination.totalPages);

  const resetAllPages = () => {
    setPage(1);
    setCleanupPage(1);
    setInspectionPage(1);
    setSelected(new Set());
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    resetAllPages();
  };

  const handleStatusFilter = (v: StatusFilter) => {
    setStatusFilter(v);
    resetAllPages();
  };

  const handleTeamTypeFilter = (v: TeamTypeFilter) => {
    setTeamTypeFilter(v);
    resetAllPages();
  };

  const handleAvailableFilter = (v: AvailableFilter) => {
    setAvailableFilter(v);
    resetAllPages();
  };

  const handleWasteTagFilter = (v: string[]) => {
    setWasteTagFilter(v);
    resetAllPages();
  };

  const listFiltered = useMemo(
    () => filterTeamsBySearch(listQuery.data?.items ?? [], debouncedSearch),
    [listQuery.data?.items, debouncedSearch]
  );

  const allChecked = listFiltered.length > 0 && selected.size === listFiltered.length;
  const indeterminate = selected.size > 0 && selected.size < listFiltered.length;

  const toggleAll = () => {
    if (allChecked || indeterminate) setSelected(new Set());
    else setSelected(new Set(listFiltered.map(t => t.id)));
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    setSelected(new Set());
  };

  const handleAddMember = (team: AddMemberTeamTarget) => {
    setAddMemberTeam(team);
  };

  return (
    <>
      {detailTeam && (
        <TeamDetailDialog
          team={detailTeam}
          onClose={() => setDetailTeam(null)}
          onAddMember={() => {
            handleAddMember({
              id: detailTeam.id,
              name: detailTeam.name,
              teamType: detailTeam.teamType,
            });
            setDetailTeam(null);
          }}
        />
      )}
      <AddMemberDialog
        open={addMemberTeam != null}
        teamId={addMemberTeam?.id ?? ''}
        teamName={addMemberTeam?.name ?? ''}
        teamType={addMemberTeam?.teamType ?? ''}
        onClose={() => setAddMemberTeam(null)}
      />
      <CreateTeamDialog
        open={createTeamType != null}
        teamType={createTeamType ?? 'Cleanup'}
        onClose={() => setCreateTeamType(null)}
      />

      {viewMode === 'board' ? (
        <BoardView
          cleanupTeams={cleanupQuery.data?.items ?? []}
          inspectionTeams={inspectionQuery.data?.items ?? []}
          cleanupPagination={cleanupPagination}
          inspectionPagination={inspectionPagination}
          cleanupLoading={cleanupQuery.isPending}
          inspectionLoading={inspectionQuery.isPending}
          isFetching={cleanupQuery.isFetching || inspectionQuery.isFetching}
          search={search}
          onSearchChange={handleSearch}
          statusFilter={statusFilter}
          teamTypeFilter={teamTypeFilter}
          availableFilter={availableFilter}
          wasteTagFilter={wasteTagFilter}
          onStatusChange={handleStatusFilter}
          onTeamTypeChange={handleTeamTypeFilter}
          onAvailableChange={handleAvailableFilter}
          onWasteTagChange={handleWasteTagFilter}
          cleanupPage={cleanupPageSafe}
          inspectionPage={inspectionPageSafe}
          onCleanupPageChange={setCleanupPage}
          onInspectionPageChange={setInspectionPage}
          onAddMember={handleAddMember}
          onCreateTeam={setCreateTeamType}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      ) : (
        <TeamListView
          search={search}
          onSearchChange={handleSearch}
          statusFilter={statusFilter}
          teamTypeFilter={teamTypeFilter}
          availableFilter={availableFilter}
          wasteTagFilter={wasteTagFilter}
          onStatusChange={handleStatusFilter}
          onTeamTypeChange={handleTeamTypeFilter}
          onAvailableChange={handleAvailableFilter}
          onWasteTagChange={handleWasteTagFilter}
          isLoading={listQuery.isPending}
          isFetching={listQuery.isFetching}
          isError={listQuery.isError}
          listFiltered={listFiltered}
          listTeams={listFiltered}
          listPagination={listPagination}
          page={listPageSafe}
          onPageChange={handlePageChange}
          selected={selected}
          allChecked={allChecked}
          indeterminate={indeterminate}
          onToggleAll={toggleAll}
          onToggleOne={toggleOne}
          onDetailTeam={setDetailTeam}
          onAddMember={handleAddMember}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}
    </>
  );
}
