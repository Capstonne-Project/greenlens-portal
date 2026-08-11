import axios from 'axios';

export function getNotificationTemplateMutationError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message.trim();
    }
    if (err.response?.status === 409) {
      return 'Template key đã tồn tại.';
    }
    if (err.message?.trim()) return err.message.trim();
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return fallback;
}

export function formatNotificationTemplateDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PREVIEW_PLACEHOLDER_SAMPLES: Record<string, string> = {
  BadgeName: 'Người bảo vệ môi trường',
  ReportId: 'RP-1024',
  ReportTitle: 'Rác thải nhựa bên sông',
  UserName: 'Nguyễn Văn A',
  TeamName: 'Đội dọn số 3',
  OfficeName: 'UBND Phường Bến Nghé',
  Status: 'Đã xử lý',
  Level: '5',
  company_name: 'Công ty Môi trường Xanh',
  team_names: 'Đội thanh tra 1, Đội dọn 2',
  CompanyName: 'Công ty Môi trường Xanh',
  TeamNames: 'Đội thanh tra 1, Đội dọn 2',
};

/** Thay {{Var}} hoặc {var} bằng ví dụ để xem trước mẫu. */
export function renderNotificationTemplatePreviewText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed
    .replace(/\{\{(\w+)\}\}/g, (_, key: string) => PREVIEW_PLACEHOLDER_SAMPLES[key] ?? `[${key}]`)
    .replace(/\{(\w+)\}/g, (_, key: string) => {
      const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
      const pascalKey = camelKey.charAt(0).toUpperCase() + camelKey.slice(1);
      return (
        PREVIEW_PLACEHOLDER_SAMPLES[key] ??
        PREVIEW_PLACEHOLDER_SAMPLES[camelKey] ??
        PREVIEW_PLACEHOLDER_SAMPLES[pascalKey] ??
        `[${key}]`
      );
    });
}
