import type { PaginationMeta } from '@/lib/api/models/adminUser';

export interface BlockedWord {
  id: string;
  word: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface BlockedWordsList {
  items: BlockedWord[];
  pagination: PaginationMeta;
}

export interface BlockedWordsListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateBlockedWordInput {
  word: string;
}

export interface UpdateBlockedWordInput {
  word: string;
  isActive?: boolean;
}

export interface BlockedWordMutationResult {
  id: string;
  word: string;
  isActive: boolean;
}
