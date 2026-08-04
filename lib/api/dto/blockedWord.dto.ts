export interface BlockedWordItemDto {
  id?: string;
  word?: string;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface BlockedWordPaginationDto {
  page?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface BlockedWordsListDataDto {
  items?: BlockedWordItemDto[];
  pagination?: BlockedWordPaginationDto;
}

export interface CreateBlockedWordBodyDto {
  word: string;
}

export interface UpdateBlockedWordBodyDto {
  word: string;
  isActive?: boolean;
}

export interface BlockedWordMutationDto {
  id: string;
  word: string;
  isActive?: boolean;
}
