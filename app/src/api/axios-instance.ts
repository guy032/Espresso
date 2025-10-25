import axios, { type AxiosRequestConfig, type AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token if available (for future use)
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<{ error?: string; message?: string; details?: any[] }>) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 400:
          // Validation error
          if (data?.details && Array.isArray(data.details)) {
            const messages = data.details.map((d: any) => `${d.field}: ${d.message}`).join('\n');
            toast.error(messages || 'Validation failed');
          } else {
            toast.error(data?.message || 'Bad request');
          }
          break;
        case 401:
          // Unauthorized
          toast.error('Please log in to continue');
          // Redirect to login if needed
          break;
        case 403:
          // Forbidden
          toast.error('You do not have permission to perform this action');
          break;
        case 404:
          // Not found
          toast.error(data?.message || 'Resource not found');
          break;
        case 500:
          // Server error
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(data?.message || 'An error occurred');
      }
    } else if (error.request) {
      // Request made but no response
      toast.error('Network error. Please check your connection.');
    } else {
      // Something else happened
      toast.error('An unexpected error occurred');
    }

    return Promise.reject(error);
  }
);

// Custom axios instance for Orval
export const customAxiosInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  return axiosInstance(config).then(({ data }) => data);
};

// Export the instance for manual use if needed
export default axiosInstance;
