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
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers['x-user-id'] = token;
      }
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
        toast.error(`Data tidak valid: ${message}`);
        break;

      case 401:
        // Don't redirect on login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        break;

      case 403:
        toast.error('Anda tidak memiliki izin untuk melakukan aksi ini.');
        break;

      case 404:
        toast.error('Data tidak ditemukan.');
        break;

      case 409:
        // Don't show toast here, let the component handle it
        break;

      case 422:
        toast.error(`Validasi gagal: ${message}`);
        break;

      case 429:
        toast.error('Terlalu banyak permintaan. Silakan tunggu sebentar.');
        break;

      case 500:
        // Don't show toast here, let the component handle it
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
