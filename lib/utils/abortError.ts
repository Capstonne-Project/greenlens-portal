/**
 * Request/tile/hub bị hủy có chủ đích — không phải lỗi nghiệp vụ.
 * Next.js overlay coi `console.error(AbortError)` là runtime error.
 */
export function isAbortError(error: unknown): boolean {
  if (error == null) return false;

  if (typeof error === 'string') {
    return isAbortMessage(error);
  }

  if (typeof error === 'object') {
    const name = 'name' in error ? String(error.name) : '';
    const code = 'code' in error ? String(error.code) : '';
    if (name === 'AbortError' || name === 'CanceledError') return true;
    if (code === 'ERR_CANCELED') return true;
    const message = 'message' in error ? String(error.message) : '';
    if (isAbortMessage(message)) return true;
  }

  return false;
}

function isAbortMessage(message: string): boolean {
  return /the operation was aborted|signal is aborted|invocation canceled|invocation cancelled|stopped during negotiation/i.test(
    message
  );
}
