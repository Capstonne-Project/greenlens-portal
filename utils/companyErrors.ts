type ApiValidationError = {
  field?: string;
  code?: string;
  message?: string;
};

type CompanyApiErrorBody = {
  message?: string;
  data?: {
    errors?: ApiValidationError[];
  };
};

function readFieldErrors(body: CompanyApiErrorBody | undefined): string | null {
  const errors = body?.data?.errors;
  if (!Array.isArray(errors) || errors.length === 0) return null;

  const messages = errors
    .map(e => (typeof e?.message === 'string' ? e.message.trim() : ''))
    .filter(Boolean);

  if (messages.length === 0) return null;
  return messages.join(' ');
}

export function getCompanyMutationError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: CompanyApiErrorBody; status?: number } }).response;
    const fieldMsg = readFieldErrors(res?.data);
    if (fieldMsg) return fieldMsg;

    const msg = res?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
    if (res?.status === 404) return 'Department hoặc WardCode không tồn tại.';
    if (res?.status === 422) return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
    if (res?.status === 409) return 'Số hợp đồng hoặc email quản lý đã tồn tại.';
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}
