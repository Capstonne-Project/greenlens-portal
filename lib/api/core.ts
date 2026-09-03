import { clearAuthSessionViaApi, refreshAuthSessionViaApi } from '@/lib/api/authSessionClient';
import {
  isSessionRestoreComplete,
  waitForSessionRestore,
} from '@/lib/auth/sessionRestoreGate';
import axios, { AxiosProgressEvent, AxiosRequestConfig, AxiosResponse } from 'axios';

/** Re-export of axios.isAxiosError so layers L2–L6 can type-guard errors
 *  without importing axios directly. */
export const isAxiosError = axios.isAxiosError;
import { getApiBaseUrl } from './getApiBaseUrl';
import type { LoginUserDto } from './types/auth';

/** Payload broadcast after silent refresh — never includes refreshToken. */
export type AuthSessionEventDetail = {
  accessToken: string;
  user: LoginUserDto;
};

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

function shouldSkipSessionWait(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.includes('/v1/auth/login') ||
    url.includes('/v1/auth/register') ||
    url.includes('/v1/auth/refresh-token') ||
    url.includes('/api/auth/refresh') ||
    url.includes('/api/auth/session') ||
    url.includes('/api/auth/logout') ||
    url.includes('/v1/public/')
  );
}

// Request interceptor — wait for AuthProvider bootstrap on hard reload, then Bearer.
// Without this, RQ fires while token is still null → 401 → interceptor refresh → 200.
axiosInstance.interceptors.request.use(async config => {
  config.baseURL = getApiBaseUrl();
  if (typeof window === 'undefined') return config;

  const url = typeof config.url === 'string' ? config.url : undefined;
  if (!shouldSkipSessionWait(url) && !isSessionRestoreComplete()) {
    const existing = (window as Window & { __authToken?: string }).__authToken;
    if (!existing) {
      await waitForSessionRestore();
    }
  }

  const token = (window as Window & { __authToken?: string }).__authToken;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

type RetriableConfig = { _retry?: boolean; url?: string };

let refreshInFlight: Promise<boolean> | null = null;

function forceLogout(): void {
  if (typeof window === 'undefined') return;
  (window as Window & { __authToken?: string }).__authToken = undefined;
  window.dispatchEvent(new Event('auth:logout'));
  void clearAuthSessionViaApi().finally(() => {
    window.location.href = '/';
  });
}

function shouldSkipRefreshRetry(url: string | undefined): boolean {
  return shouldSkipSessionWait(url);
}

/** Silent refresh via `/api/auth/refresh` (HttpOnly refresh cookie on server). */
export async function refreshSessionOnce(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const data = await refreshAuthSessionViaApi();
      if (!data?.accessToken) return false;

      (window as Window & { __authToken?: string }).__authToken = data.accessToken;

      const sessionDetail: AuthSessionEventDetail = {
        accessToken: data.accessToken,
        user: data.user,
      };
      window.dispatchEvent(new CustomEvent('auth:session', { detail: sessionDetail }));
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

// Response interceptor — 401 → refresh once, then retry; else logout
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const status = error.response?.status;
    const originalRequest = error.config as RetriableConfig | undefined;
    const url = originalRequest?.url;

    if (typeof window === 'undefined' || status !== 401) {
      return Promise.reject(error);
    }

    if (shouldSkipRefreshRetry(url)) {
      return Promise.reject(error);
    }

    if (originalRequest?._retry) {
      forceLogout();
      return Promise.reject(error);
    }

    const ok = await refreshSessionOnce();
    if (!ok) {
      forceLogout();
      return Promise.reject(error);
    }

    if (!originalRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    return axiosInstance(originalRequest);
  }
);

const apiService = {
  get<T>(
    url: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return axiosInstance.get<T>(url, { params, ...config });
  },

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return axiosInstance.post<T>(url, data, config);
  },

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return axiosInstance.put<T>(url, data, config);
  },

  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return axiosInstance.patch<T>(url, data, config);
  },

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return axiosInstance.delete<T>(url, config);
  },

  upload<T>(
    url: string,
    formData: FormData,
    onProgress?: (event: AxiosProgressEvent) => void
  ): Promise<AxiosResponse<T>> {
    return axiosInstance.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    });
  },
};

export default apiService;

export {
  createIdempotencyKey,
  createIdempotencyKeyStore,
  executeIdempotentRequest,
  extractApiErrorCode,
  IDEMPOTENCY_ERROR_CODES,
  IDEMPOTENCY_HEADER,
  mergeIdempotencyConfig,
  withOptionalIdempotency,
} from './idempotency';
export type { IdempotencyRequestOptions } from './idempotency';
