import {
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  setAuthCookies,
} from '@/lib/storage/authCookies';
import axios, { AxiosProgressEvent, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getApiBaseUrl } from './getApiBaseUrl';
import { postRefreshToken } from './refreshSession';
import type { LoginSuccessData } from './types/auth';

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — resolve base URL per request + Bearer token
axiosInstance.interceptors.request.use(config => {
  config.baseURL = getApiBaseUrl();
  if (typeof window !== 'undefined') {
    const windowToken = (window as Window & { __authToken?: string }).__authToken;
    const token = windowToken ?? getAccessTokenFromCookie();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

type RetriableConfig = { _retry?: boolean; url?: string };

let refreshInFlight: Promise<boolean> | null = null;

function forceLogout(): void {
  if (typeof window === 'undefined') return;
  (window as Window & { __authToken?: string }).__authToken = undefined;
  window.dispatchEvent(new Event('auth:logout'));
  window.location.href = '/login';
}

function shouldSkipRefreshRetry(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes('/v1/auth/login') || url.includes('/v1/auth/refresh-token');
}

async function refreshSessionOnce(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const refreshToken = getRefreshTokenFromCookie();
      if (!refreshToken) return false;

      const envelope = await postRefreshToken(refreshToken);
      const { accessToken, refreshToken: newRefresh, user } = envelope.data;
      setAuthCookies(accessToken, newRefresh);
      (window as Window & { __authToken?: string }).__authToken = accessToken;

      const sessionDetail: LoginSuccessData = {
        accessToken,
        refreshToken: newRefresh,
        user,
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
