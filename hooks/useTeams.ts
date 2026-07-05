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
import type { OfficeStaffList, OfficeStaffListParams } from '@/lib/api/models/office';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';

/** Khớp `leoOfficesKeys.myStaff()` — tách key tránh circular import với useLeoOffices. */
const LEO_MY_STAFF_QUERY_KEY = ['officer', 'leo', 'my-staff'] as const;

function removeStaffFromAvailableCache(queryClient: QueryClient, userId: string) {
  queryClient.setQueriesData<OfficeStaffList>(
    {
      queryKey: LEO_MY_STAFF_QUERY_KEY,
      predicate: query => {
        const params = query.queryKey[3] as OfficeStaffListParams | undefined;
        return params?.hasTeam === false;
      },
    },
    old => {
      if (!old?.items?.length) return old;
      const items = old.items.filter(item => item.userId !== userId);
      if (items.length === old.items.length) return old;
      return {
        ...old,
        items,
        pagination: {
          ...old.pagination,
          totalItems: Math.max(0, old.pagination.totalItems - 1),
        },
      };
    }
  );
}

export const teamKeys = {
  all: ['admin', 'teams'] as const,
  list: (params: TeamsListParams) => [...teamKeys.all, 'list', params] as const,
  infiniteList: (params: Omit<TeamsListParams, 'page'>) =>
    [...teamKeys.all, 'infinite-list', params] as const,
  detail: (id: string) => [...teamKeys.all, 'detail', id] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;
const DETAIL_STALE_MS = 3 * 60 * 1000;

export const TEAMS_ASSIGN_PAGE_SIZE = 10;

export function useTeamsList(params: TeamsListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: teamKeys.list(params),
    queryFn: () => fetchTeams(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled ?? true,
  });
}

/** GET /v1/teams — infinite scroll (pageSize cố định, load thêm khi scroll). */
export function useTeamsInfiniteList(
  params: Omit<TeamsListParams, 'page'>,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery({
    queryKey: teamKeys.infiniteList(params),
    queryFn: async ({ pageParam }) => {
      const envelope = await fetchTeams({ ...params, page: pageParam });
      return envelope.data;
    },
    initialPageParam: 1,
    getNextPageParam: lastPage =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled ?? true,
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
    onSuccess: (_data, { teamId, body }) => {
      removeStaffFromAvailableCache(queryClient, body.userId);
      void queryClient.invalidateQueries({ queryKey: teamKeys.all });
      void queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      void queryClient.invalidateQueries({ queryKey: LEO_MY_STAFF_QUERY_KEY });
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
      void queryClient.invalidateQueries({ queryKey: LEO_MY_STAFF_QUERY_KEY });
    },
  });
}
