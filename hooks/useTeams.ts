'use client';

import { fetchTeamDetail, fetchTeams } from '@/lib/api/services/fetchTeam';
import type { TeamsListParams } from '@/lib/api/models/team';
import { useQuery } from '@tanstack/react-query';

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
