import axios from 'axios';

export function getAdminReportMutationError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message.trim();
    }
    if (err.message?.trim()) return err.message.trim();
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return fallback;
}

export function isAdminReportNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
