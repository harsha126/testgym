import { create } from "zustand";
import { login as loginApi, logout as logoutApi } from "../api/auth";
import { LoginRequest } from "../types";

interface AuthState {
    token: string | null;
    userId: number | null;
    name: string | null;
    role: string | null;
    phone: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    login: (data: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
    setToken: (token: string) => void;
}

// Initialize synchronously from localStorage so ProtectedRoute works on first render
function loadFromStorage() {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
        try {
            const user = JSON.parse(userStr);
            return { token, userId: user.userId, name: user.name, role: user.role, phone: user.phone, isAuthenticated: true };
        } catch {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }
    }
    return { token: null, userId: null, name: null, role: null, phone: null, isAuthenticated: false };
}

export const useAuthStore = create<AuthState>((set) => ({
    ...loadFromStorage(),
    loading: false,
    error: null,

    login: async (data: LoginRequest) => {
        set({ loading: true, error: null });
        try {
            const response = await loginApi(data);
            const { token, userId, name, role, phone } = response.data;
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify({ userId, name, role, phone }));
            set({ token, userId, name, role, phone, isAuthenticated: true, loading: false });
        } catch (err: any) {
            set({ loading: false, error: err.response?.data?.error || "Login failed" });
            throw err;
        }
    },

    logout: async () => {
        try {
            await logoutApi();
        } catch {
            // Best-effort: clear local state regardless
        }
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ token: null, userId: null, name: null, role: null, phone: null, isAuthenticated: false });
    },

    setToken: (token: string) => {
        localStorage.setItem("token", token);
        set({ token });
    },
}));
