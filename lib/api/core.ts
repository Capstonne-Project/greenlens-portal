import axios, { AxiosProgressEvent, AxiosRequestConfig, AxiosResponse } from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — attach Bearer token from authStore
axiosInstance.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    // Lazy import to avoid circular deps; authStore sets window.__authToken on login
    const token = (window as Window & { __authToken?: string }).__authToken;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — 401 → logout + redirect
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear token and redirect to login
      (window as Window & { __authToken?: string }).__authToken = undefined;
      // Trigger auth store logout via custom event so we avoid circular import
      window.dispatchEvent(new Event('auth:logout'));
      window.location.href = '/login';
    }
    return Promise.reject(error);
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
