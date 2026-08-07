/**
 * L1 — Idempotency-Key (BR-REP-010, BR-SYS-004).
 *
 * Sinh key ở L6 khi user confirm submit; truyền xuống L2 qua `idempotencyKey`.
 * Retry 409 IN_PROGRESS giữ nguyên key — không sinh key mới khi auto-retry.
 */

import { isAxiosError } from '@/lib/api/core';
import type { AxiosRequestConfig } from 'axios';

export const IDEMPOTENCY_HEADER = 'Idempotency-Key' as const;

export const IDEMPOTENCY_ERROR_CODES = {
  IN_PROGRESS: 'IDEMPOTENCY_IN_PROGRESS',
  KEY_REUSED: 'IDEMPOTENCY_KEY_REUSED',
  KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  KEY_INVALID: 'IDEMPOTENCY_KEY_INVALID',
} as const;

export type IdempotencyErrorCode =
  (typeof IDEMPOTENCY_ERROR_CODES)[keyof typeof IDEMPOTENCY_ERROR_CODES];

export type IdempotencyRequestOptions = {
  /** UUID sinh khi user bấm Submit — bắt buộc cho endpoint idempotent. */
  idempotencyKey?: string;
  /** Axios config bổ sung (timeout, signal, …). */
  config?: AxiosRequestConfig;
};

export type ExecuteIdempotentOptions = {
  maxAttempts?: number;
  backoffMs?: number;
};

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BACKOFF_MS = 2000;

/** Sinh UUID v4 — gọi một lần khi user confirm submit. */
export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  throw new Error('crypto.randomUUID is not available');
}

/**
 * Giữ key theo scope (reportId, formId, …) đến khi success / đóng dialog.
 * Tránh sinh key mới khi user retry sau timeout cùng payload.
 */
export function createIdempotencyKeyStore(): {
  get: (scope: string) => string;
  reset: () => void;
} {
  const map = new Map<string, string>();
  return {
    get(scope: string) {
      const existing = map.get(scope);
      if (existing) return existing;
      const key = createIdempotencyKey();
      map.set(scope, key);
      return key;
    },
    reset() {
      map.clear();
    },
  };
}

export function idempotencyHeaders(key: string): Record<string, string> {
  return { [IDEMPOTENCY_HEADER]: key };
}

export function mergeIdempotencyConfig(
  key: string | undefined,
  config?: AxiosRequestConfig
): AxiosRequestConfig | undefined {
  if (!key) return config;
  return {
    ...config,
    headers: {
      ...config?.headers,
      ...idempotencyHeaders(key),
    },
  };
}

export function extractApiErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) return null;
  const data = error.response?.data;
  if (data && typeof data === 'object' && 'code' in data) {
    const code = (data as { code?: unknown }).code;
    if (typeof code === 'string' && code.trim()) return code.trim();
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Thực thi request idempotent với retry:
 * - 409 IDEMPOTENCY_IN_PROGRESS → chờ, retry cùng key
 * - 422 IDEMPOTENCY_KEY_REUSED → sinh key mới, thử lại
 * - 2xx replay → coi như success (caller xử lý bình thường)
 */
export async function executeIdempotentRequest<T>(
  idempotencyKey: string,
  request: (key: string) => Promise<T>,
  options?: ExecuteIdempotentOptions
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const backoffMs = options?.backoffMs ?? DEFAULT_BACKOFF_MS;
  let currentKey = idempotencyKey;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await request(currentKey);
    } catch (error) {
      const code = extractApiErrorCode(error);

      if (code === IDEMPOTENCY_ERROR_CODES.IN_PROGRESS && attempt < maxAttempts - 1) {
        await sleep(backoffMs);
        continue;
      }

      if (code === IDEMPOTENCY_ERROR_CODES.KEY_REUSED && attempt < maxAttempts - 1) {
        currentKey = createIdempotencyKey();
        continue;
      }

      throw error;
    }
  }

  throw new Error('Idempotency retry exhausted');
}

/** Optional wrapper — chỉ gắn header + retry khi có key. */
export async function withOptionalIdempotency<T>(
  idempotencyKey: string | undefined,
  request: (key: string | undefined) => Promise<T>
): Promise<T> {
  if (!idempotencyKey) return request(undefined);
  return executeIdempotentRequest(idempotencyKey, key => request(key));
}
