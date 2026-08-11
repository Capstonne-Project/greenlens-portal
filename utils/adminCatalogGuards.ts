/** Guard UI khi danh mục / thẻ rác đang được báo cáo sử dụng. */

export function isAdminCatalogInUse(reportCount: number): boolean {
  return reportCount > 0;
}

export function getPollutionCategoryArchiveBlockedMessage(reportCount: number): string {
  return `Không thể ngưng danh mục vì đang có ${reportCount.toLocaleString('vi-VN')} báo cáo sử dụng.`;
}

export function getWasteTagDeactivateBlockedMessage(reportCount: number): string {
  return `Không thể vô hiệu hóa thẻ vì đang có ${reportCount.toLocaleString('vi-VN')} báo cáo sử dụng.`;
}

function extractApiMessage(err: unknown): string | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return null;
}

/** Map lỗi BE khi xóa/ngưng item đang được báo cáo dùng. */
export function getCatalogInUseMutationError(
  err: unknown,
  fallback: string,
  blockedMessage: string
): string {
  const apiMessage = extractApiMessage(err);
  if (apiMessage) {
    const lower = apiMessage.toLowerCase();
    if (
      lower.includes('in use') ||
      lower.includes('being used') ||
      lower.includes('report') ||
      lower.includes('báo cáo') ||
      lower.includes('đang sử dụng') ||
      lower.includes('đang được')
    ) {
      return blockedMessage;
    }
    return apiMessage;
  }
  return fallback;
}
