export function getCompanyMutationError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string }; status?: number } }).response;
    const msg = res?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
    if (res?.status === 404) return 'Department hoặc WardCode không tồn tại.';
    if (res?.status === 422) return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
    if (res?.status === 409) return 'Số hợp đồng hoặc email quản lý đã tồn tại.';
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}
