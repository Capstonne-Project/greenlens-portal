export function getDepartmentMutationError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string }; status?: number } }).response;
    const msg = res?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
    if (res?.status === 409) return 'Tỉnh/thành này đã có ủy ban (Sở).';
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}
