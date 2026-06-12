export function getWasteTagMutationError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { status?: number; data?: { message?: string } } }).response;
    if (res?.status === 409) return 'Mã thẻ đã tồn tại. Vui lòng chọn mã khác.';
    const msg = res?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}
