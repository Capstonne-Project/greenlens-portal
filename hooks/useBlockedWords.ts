'use client';

import {
  createBlockedWord,
  deleteBlockedWord,
  fetchBlockedWords,
  updateBlockedWord,
} from '@/lib/api/services/fetchBlockedWords';
import type {
  BlockedWordsList,
  BlockedWordsListParams,
  CreateBlockedWordInput,
  UpdateBlockedWordInput,
} from '@/lib/api/models/blockedWord';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const blockedWordKeys = {
  all: ['admin', 'blocked-words'] as const,
  list: (params: BlockedWordsListParams) => [...blockedWordKeys.all, 'list', params] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;

export function useBlockedWordsList(params: BlockedWordsListParams) {
  return useQuery({
    queryKey: blockedWordKeys.list(params),
    queryFn: () => fetchBlockedWords(params),
    select: (envelope: ApiEnvelope<BlockedWordsList>) => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
  });
}

export function useCreateBlockedWord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBlockedWordInput) => createBlockedWord(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: blockedWordKeys.all });
    },
  });
}

export function useUpdateBlockedWord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateBlockedWordInput }) =>
      updateBlockedWord(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: blockedWordKeys.all });
    },
  });
}

export function useDeleteBlockedWord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBlockedWord(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: blockedWordKeys.all });
    },
  });
}
