export function getPollutionCategoryMutationError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    const msg = res?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}
