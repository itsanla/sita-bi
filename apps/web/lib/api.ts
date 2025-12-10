// apps/web/lib/api.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { toast } from 'sonner';
import { ApiResponse } from '../types';

const apiClient: AxiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let lastToastMessage = '';
let lastToastTime = 0;
const processedErrors = new WeakMap();

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        if (/^\d+$/.test(token) || token.split('.').length !== 3) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        } else {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    
    if (config.url?.includes('/similarity') || config.url?.includes('/check-similarity')) {
      config.timeout = 60000;
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request] Error:', error);
    return Promise.reject(error);
  },
);

// Response interceptor dengan comprehensive error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // Prevent duplicate toast for same error object
    if (processedErrors.has(error)) {
      return Promise.reject(error);
    }
    processedErrors.set(error, true);
    // Network error
    if (!error.response) {
      console.error('[API Response] Network error:', error);

      if (error.code === 'ECONNABORTED') {
        toast.error('Permintaan timeout. Silakan coba lagi.');
      } else if (error.message === 'Network Error') {
        toast.error(
          'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        );
      } else {
        toast.error('Terjadi kesalahan jaringan.');
      }

      return Promise.reject(new Error('Network error'));
    }

    // HTTP errors
    const status = error.response.status;
    const message =
      (error.response.data as ApiResponse)?.message || error.message;

    // Only log unexpected errors (not validation/conflict errors)
    if (![400, 409, 422].includes(status)) {
      console.error(`[API Response] HTTP ${status}:`, message);
    }

    switch (status) {
      case 400:
        // Show validation error from backend
        if (message && typeof message === 'string') {
          const now = Date.now();
          if (message !== lastToastMessage || now - lastToastTime > 1000) {
            toast.error(message);
            lastToastMessage = message;
            lastToastTime = now;
          }
        }
        break;

      case 401:
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.includes('/login')
        ) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(new Error('Unauthorized'));
        }
        break;

      case 403:
        // Jangan tampilkan notifikasi jika error karena periode ditutup
        if (!message.toLowerCase().includes('periode')) {
          toast.error('Anda tidak memiliki izin untuk melakukan aksi ini.');
        }
        break;

      case 404:
        // Handle user not found (database reset)
        if (message.toLowerCase().includes('user tidak ditemukan')) {
          if (
            typeof window !== 'undefined' &&
            !window.location.pathname.includes('/login')
          ) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            toast.error('Sesi Anda tidak valid. Silakan login kembali.');
            window.location.href = '/login';
          }
        } else {
          toast.error('Data tidak ditemukan.');
        }
        break;

      case 409:
        // Show conflict error from backend (prevent duplicate)
        if (message && typeof message === 'string') {
          const now = Date.now();
          if (message !== lastToastMessage || now - lastToastTime > 1000) {
            toast.error(message);
            lastToastMessage = message;
            lastToastTime = now;
          }
        }
        break;

      case 422:
        // Don't show toast here, let the component handle it
        break;

      case 429:
        toast.error('Terlalu banyak permintaan. Silakan tunggu sebentar.');
        break;

      case 500:
        // Show error message from backend for validation errors
        if (message && typeof message === 'string') {
          toast.error(message);
        }
        break;

      case 502:
      case 503:
      case 504:
        toast.error('Server sedang sibuk. Silakan coba lagi nanti.');
        break;

      default:
        toast.error('Terjadi kesalahan. Silakan coba lagi.');
    }

    return Promise.reject(error);
  },
);

// Generic function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const errorData = error.response?.data as ApiResponse;
    return errorData?.message || 'Terjadi kesalahan pada server.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Gagal menghubungi server. Silakan coba lagi.';
};

// Safe API wrapper methods
export const api = {
  get: async <T>(
    url: string,
    config?: Parameters<typeof apiClient.get>[1],
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.get<ApiResponse<T>>(url, config);
  },

  post: async <T>(
    url: string,
    data?: unknown,
    config?: Parameters<typeof apiClient.post>[2],
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.post<ApiResponse<T>>(url, data, config);
  },

  put: async <T>(
    url: string,
    data?: unknown,
    config?: Parameters<typeof apiClient.put>[2],
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.put<ApiResponse<T>>(url, data, config);
  },

  delete: async <T>(
    url: string,
    config?: Parameters<typeof apiClient.delete>[1],
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.delete<ApiResponse<T>>(url, config);
  },

  patch: async <T>(
    url: string,
    data?: unknown,
    config?: Parameters<typeof apiClient.patch>[2],
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.patch<ApiResponse<T>>(url, data, config);
  },
};

export default apiClient;
