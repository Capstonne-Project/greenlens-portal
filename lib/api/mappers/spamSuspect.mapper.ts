import type { SpamSuspectItemDto, SpamSuspectsListDataDto } from '@/lib/api/dto/spamSuspect.dto';
import type {
  SpamSuspect,
  SpamSuspectsList,
  SpamSuspectsPagination,
} from '@/lib/api/models/spamSuspect';

export function mapSpamSuspectItemDto(dto: SpamSuspectItemDto): SpamSuspect {
  return {
    userId: dto.userId,
    fullName: dto.fullName?.trim() || '—',
    email: dto.email?.trim() || '—',
    isBanned: Boolean(dto.isBanned),
    reportsLastHour: dto.reportsLastHour ?? 0,
    rejectedLast7Days: dto.rejectedLast7Days ?? 0,
    aiFlaggedCount: dto.aiFlaggedCount ?? 0,
    suspectReasons: dto.suspectReasons?.trim() || '',
  };
}

function mapPagination(
  dto: SpamSuspectsListDataDto,
  page: number,
  pageSize: number
): SpamSuspectsPagination {
  const totalItems = Math.max(0, dto.totalCount ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const safePage = Math.max(1, page);

  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

export function mapSpamSuspectsListDataDto(
  dto: SpamSuspectsListDataDto,
  page: number,
  pageSize: number
): SpamSuspectsList {
  return {
    items: (dto.items ?? []).map(mapSpamSuspectItemDto),
    pagination: mapPagination(dto, page, pageSize),
  };
}
