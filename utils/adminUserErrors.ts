import axios from 'axios';

export function getAdminUserMutationError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { message?: string } | undefined;
    if (body?.message?.trim()) return body.message;
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export function isAdminUserNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
