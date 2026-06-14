'use client';

import {
  addTeamMember,
  createTeam,
  fetchTeamDetail,
  fetchTeams,
  removeTeamMember,
} from '@/lib/api/services/fetchTeam';
import type {
  AddTeamMemberInput,
  CreateTeamInput,
  TeamDetail,
  TeamsListParams,
} from '@/lib/api/models/team';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

export const teamKeys = {
  all: ['admin', 'teams'] as const,
  list: (params: TeamsListParams) => [...teamKeys.all, 'list', params] as const,
  detail: (id: string) => [...teamKeys.all, 'detail', id] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;
const DETAIL_STALE_MS = 3 * 60 * 1000;

export function useTeamsList(params: TeamsListParams) {
  return useQuery({
    queryKey: teamKeys.list(params),
    queryFn: () => fetchTeams(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
  });
}

export function useTeamDetail(id: string | null) {
  return useQuery({
    queryKey: teamKeys.detail(id ?? ''),
    queryFn: () => fetchTeamDetail(id!),
    select: envelope => envelope.data,
    enabled: Boolean(id),
    staleTime: DETAIL_STALE_MS,
  });
}

/** Chi tiết nhiều đội — thứ tự kết quả khớp `teamIds` (MembersTab, v.v.). */
export function useTeamDetails(teamIds: string[]) {
  return useQueries({
    queries: teamIds.map(id => ({
      queryKey: teamKeys.detail(id),
      queryFn: () => fetchTeamDetail(id),
      select: (envelope: ApiEnvelope<TeamDetail>) => envelope.data,
      staleTime: DETAIL_STALE_MS,
      enabled: Boolean(id),
    })),
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTeamInput) => createTeam(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamKeys.all });
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, body }: { teamId: string; body: AddTeamMemberInput }) =>
      addTeamMember(teamId, body),
    onSuccess: (_data, { teamId }) => {
      void queryClient.invalidateQueries({ queryKey: teamKeys.all });
      void queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      removeTeamMember(teamId, userId),
    onSuccess: (_data, { teamId }) => {
      void queryClient.invalidateQueries({ queryKey: teamKeys.all });
      void queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
    },
  });
}
