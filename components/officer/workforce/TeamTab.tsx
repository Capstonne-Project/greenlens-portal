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
  buildClientPagination,
  buildSharedTeamsQueryParams,
  PAGE_SIZE,
  paginateClient,
  type AddMemberTeamTarget,
  type AvailableFilter,
  type LeoCreateTeamType,
  type StatusFilter,
  type TeamTypeFilter,
} from './teamTab/teamTab.shared';

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [detailTeam, setDetailTeam] = useState<TeamListItem | null>(null);
  const [addMemberTeam, setAddMemberTeam] = useState<AddMemberTeamTarget | null>(null);
  const [createTeamType, setCreateTeamType] = useState<LeoCreateTeamType | null>(null);

  const sharedParams = useMemo(
    () => buildSharedTeamsQueryParams({ statusFilter, teamTypeFilter, availableFilter }),
    [statusFilter, teamTypeFilter, availableFilter]
  );

  const { data, isLoading, isFetching, isError, refetch } = useTeamsList(sharedParams);

  const allTeams = useMemo(() => data?.items ?? [], [data?.items]);

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

  const listFiltered = useMemo(() => {
    if (!debouncedSearch) return allTeams;
    const q = debouncedSearch.toLowerCase();
    return allTeams.filter(
      t => t.name.toLowerCase().includes(q) || t.officeName.toLowerCase().includes(q)
    );
  }, [allTeams, debouncedSearch]);

  const listTeams = useMemo(
    () => paginateClient(listFiltered, page, PAGE_SIZE),
    [listFiltered, page]
  );

  const listPagination = useMemo(
    () => buildClientPagination(listFiltered.length, page, PAGE_SIZE),
    [listFiltered.length, page]
  );

  const allChecked = listTeams.length > 0 && selected.size === listTeams.length;
  const indeterminate = selected.size > 0 && selected.size < listTeams.length;

  const toggleAll = () => {
    if (allChecked || indeterminate) setSelected(new Set());
    else setSelected(new Set(listTeams.map(t => t.id)));
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch().finally(() => setIsRefreshing(false));
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
          teams={allTeams}
          isLoading={isLoading}
          isFetching={isFetching}
          search={search}
          onSearchChange={handleSearch}
          statusFilter={statusFilter}
          teamTypeFilter={teamTypeFilter}
          availableFilter={availableFilter}
          onStatusChange={handleStatusFilter}
          onTeamTypeChange={handleTeamTypeFilter}
          onAvailableChange={handleAvailableFilter}
          cleanupPage={cleanupPage}
          inspectionPage={inspectionPage}
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
          onStatusChange={handleStatusFilter}
          onTeamTypeChange={handleTeamTypeFilter}
          onAvailableChange={handleAvailableFilter}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          listFiltered={listFiltered}
          listTeams={listTeams}
          listPagination={listPagination}
          page={page}
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
