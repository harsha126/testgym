import axios, { InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/authStore";

const api = axios.create({
    baseURL: "/api",
    headers: { "Content-Type": "application/json" },
    withCredentials: true, // send HttpOnly refresh-token cookie on every request
});

// ── Silent refresh state ──────────────────────────────────────────────────────

let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function flushQueue(error: unknown, token?: string) {
    pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)));
    pendingQueue = [];
}

// ── Request interceptor: attach access token ──────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Response interceptor: silent token refresh on 401 ────────────────────────

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Don't retry refresh/login endpoints — they 401 for real reasons
        const isAuthEndpoint =
            originalRequest.url === "/auth/refresh" ||
            originalRequest.url === "/auth/login";

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            if (isRefreshing) {
                // Queue the request until the in-flight refresh completes
                return new Promise<string>((resolve, reject) => {
                    pendingQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Refresh cookie is sent automatically (withCredentials: true)
                const { data } = await api.post<{ accessToken: string }>("/auth/refresh");
                const newToken = data.accessToken;

                useAuthStore.getState().setToken(newToken);
                flushQueue(null, newToken);

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                flushQueue(refreshError);
                useAuthStore.getState().logout();
                window.location.href = "/login";
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

export default api;
