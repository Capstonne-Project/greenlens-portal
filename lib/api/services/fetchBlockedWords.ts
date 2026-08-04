/**
 * L2 — Admin blocked words (thin).
 */
import {
  adaptBlockedWordsList,
  adaptCreateBlockedWord,
  adaptDeleteBlockedWord,
  adaptUpdateBlockedWord,
} from '@/lib/api/adapters/blockedWords.adapter';
import type {
  BlockedWordMutationResult,
  BlockedWordsList,
  BlockedWordsListParams,
  CreateBlockedWordInput,
  UpdateBlockedWordInput,
} from '@/lib/api/models/blockedWord';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  BlockedWord,
  BlockedWordMutationResult,
  BlockedWordsList,
  BlockedWordsListParams,
  CreateBlockedWordInput,
  UpdateBlockedWordInput,
} from '@/lib/api/models/blockedWord';

export async function fetchBlockedWords(
  params?: BlockedWordsListParams
): Promise<ApiEnvelope<BlockedWordsList>> {
  return adaptBlockedWordsList(params);
}

export async function createBlockedWord(
  body: CreateBlockedWordInput
): Promise<ApiEnvelope<BlockedWordMutationResult>> {
  return adaptCreateBlockedWord(body);
}

export async function updateBlockedWord(
  id: string,
  body: UpdateBlockedWordInput
): Promise<ApiEnvelope<null>> {
  return adaptUpdateBlockedWord(id, body);
}

export async function deleteBlockedWord(id: string): Promise<ApiEnvelope<null>> {
  return adaptDeleteBlockedWord(id);
}

export default {
  fetchBlockedWords,
  createBlockedWord,
  updateBlockedWord,
  deleteBlockedWord,
};
