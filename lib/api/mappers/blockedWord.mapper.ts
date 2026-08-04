import type {
  BlockedWordItemDto,
  BlockedWordMutationDto,
  BlockedWordsListDataDto,
} from '@/lib/api/dto/blockedWord.dto';
import type {
  BlockedWord,
  BlockedWordMutationResult,
  BlockedWordsList,
} from '@/lib/api/models/blockedWord';
import type { PaginationMeta } from '@/lib/api/models/adminUser';

function mapBlockedWordItemDto(dto: BlockedWordItemDto): BlockedWord {
  return {
    id: dto.id ?? '',
    word: dto.word?.trim() ?? '',
    isActive: dto.isActive !== false,
    createdAt: dto.createdAt?.trim() ?? '',
    updatedAt: dto.updatedAt?.trim() ?? null,
  };
}

function mapPagination(
  dto: BlockedWordsListDataDto['pagination'],
  page: number,
  pageSize: number,
  totalItems: number
): PaginationMeta {
  const totalPages = Math.max(1, dto?.totalPages ?? (Math.ceil(totalItems / pageSize) || 1));
  return {
    page: dto?.page ?? page,
    pageSize: dto?.pageSize ?? pageSize,
    totalItems: dto?.totalItems ?? totalItems,
    totalPages,
    hasNext: dto?.hasNext ?? page < totalPages,
    hasPrev: dto?.hasPrev ?? page > 1,
  };
}

export function mapBlockedWordsListDataDto(
  dto: BlockedWordsListDataDto,
  page: number,
  pageSize: number
): BlockedWordsList {
  const items = (dto.items ?? []).map(mapBlockedWordItemDto);
  return {
    items,
    pagination: mapPagination(dto.pagination, page, pageSize, items.length),
  };
}

export function mapBlockedWordMutationDto(dto: BlockedWordMutationDto): BlockedWordMutationResult {
  return {
    id: dto.id,
    word: dto.word.trim(),
    isActive: dto.isActive !== false,
  };
}
