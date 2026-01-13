import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL as string || 'http://localhost:8000';

export const api = axios.create({
    baseURL,
    headers: {
        'Accept': 'application/json',
    },
});

// Add auth token from localStorage if present
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('proctor_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors by redirecting to login
api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        const axiosError = error as { response?: { status: number } };
        if (axiosError.response?.status === 401) {
            localStorage.removeItem('proctor_token');
            window.location.href = '/proctor/login';
        }
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
);

export default api;
