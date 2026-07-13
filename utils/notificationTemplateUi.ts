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
