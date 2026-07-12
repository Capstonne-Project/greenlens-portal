'use client';

import { fetchSpamSuspects } from '@/lib/api/services/fetchSpamSuspect';
import type { SpamSuspectsList, SpamSuspectsListParams } from '@/lib/api/models/spamSuspect';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const spamSuspectKeys = {
  all: ['admin', 'spam-suspects'] as const,
  list: (params: SpamSuspectsListParams) => [...spamSuspectKeys.all, 'list', params] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;

export function useSpamSuspectsList(params: SpamSuspectsListParams) {
  return useQuery({
    queryKey: spamSuspectKeys.list(params),
    queryFn: () => fetchSpamSuspects(params),
    select: (envelope: ApiEnvelope<SpamSuspectsList>) => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
  });
}
