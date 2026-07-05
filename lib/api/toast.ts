/**
 * L2 helper — toast trung tâm cho mutation API (POST/PUT/DELETE).
 *
 * Mục tiêu:
 *   - Tận dụng envelope `{ code, message, status, data }` từ BE để hiển thị
 *     đúng thông điệp khi thao tác thành công / thất bại.
 *   - Không sửa hook layer (dùng chung admin + officer), wire ở component (L6).
 *   - Tách logic parse ra hàm thuần (testable) — UI chỉ gọi `toastApi*`.
 *
 * Dùng từ component:
 *   try {
 *     await mutation.mutateAsync(...);
 *     toastApiSuccess(null, 'Đã phân công 3 báo cáo.');
 *   } catch (err) {
 *     toastApiError(err, 'Không thể phân công.');
 *   }
 */
import { isAxiosError } from '@/lib/api/core';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { toast } from 'sonner';

const DEFAULT_SUCCESS = 'Thao tác thành công.';
const DEFAULT_ERROR = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
const NETWORK_ERROR = 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.';
const TIMEOUT_ERROR = 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.';

/** Đọc `message` từ envelope nếu tồn tại và có nội dung. */
function readEnvelopeMessage(payload: unknown): string | null {
  if (payload && typeof payload === 'object') {
    const env = payload as Partial<ApiEnvelope<unknown>>;
    if (typeof env.message === 'string' && env.message.trim().length > 0) {
      return env.message.trim();
    }
  }
  return null;
}

/** Lấy message thành công — ưu tiên `envelope.message`, fallback custom. */
export function extractApiSuccessMessage(payload: unknown, fallback?: string): string {
  return readEnvelopeMessage(payload) ?? fallback ?? DEFAULT_SUCCESS;
}

/**
 * Lấy message lỗi từ axios error:
 *   1. envelope.message từ `error.response.data`
 *   2. timeout (`ECONNABORTED`) → message tiếng Việt riêng
 *   3. mất mạng (`!error.response`) → message tiếng Việt riêng
 *   4. fallback do component cung cấp
 */
export function extractApiErrorMessage(error: unknown, fallback?: string): string {
  if (isAxiosError(error)) {
    const fromEnvelope = readEnvelopeMessage(error.response?.data);
    if (fromEnvelope) return fromEnvelope;
    if (error.code === 'ECONNABORTED') return TIMEOUT_ERROR;
    if (!error.response) return NETWORK_ERROR;
    return fallback ?? DEFAULT_ERROR;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback ?? DEFAULT_ERROR;
}

/** Toast thành công cho mutation (POST/PUT/DELETE). */
export function toastApiSuccess(payload: unknown, fallback?: string): void {
  toast.success(extractApiSuccessMessage(payload, fallback));
}

/** Toast lỗi cho mutation (POST/PUT/DELETE) hoặc try/catch. */
export function toastApiError(error: unknown, fallback?: string): void {
  toast.error(extractApiErrorMessage(error, fallback));
}
