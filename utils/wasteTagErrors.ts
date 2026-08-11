import {
  getCatalogInUseMutationError,
  getWasteTagDeactivateBlockedMessage,
} from '@/utils/adminCatalogGuards';

export function getWasteTagMutationError(err: unknown, fallback: string, reportCount = 0): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { status?: number; data?: { message?: string } } }).response;
    if (res?.status === 409) {
      const msg = res?.data?.message?.toLowerCase() ?? '';
      if (msg.includes('mã') || msg.includes('code') || msg.includes('exist')) {
        return 'Mã thẻ đã tồn tại. Vui lòng chọn mã khác.';
      }
    }
    const blockedMessage =
      reportCount > 0
        ? getWasteTagDeactivateBlockedMessage(reportCount)
        : getWasteTagDeactivateBlockedMessage(0).replace('0 báo cáo', 'báo cáo');
    return getCatalogInUseMutationError(err, fallback, blockedMessage);
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}
