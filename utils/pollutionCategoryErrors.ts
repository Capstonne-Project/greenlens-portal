import {
  getCatalogInUseMutationError,
  getPollutionCategoryArchiveBlockedMessage,
} from '@/utils/adminCatalogGuards';

export function getPollutionCategoryMutationError(
  err: unknown,
  fallback: string,
  reportCount = 0
): string {
  const blockedMessage =
    reportCount > 0
      ? getPollutionCategoryArchiveBlockedMessage(reportCount)
      : 'Không thể ngưng danh mục vì đang có báo cáo sử dụng.';
  return getCatalogInUseMutationError(err, fallback, blockedMessage);
}
