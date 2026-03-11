import { create } from "zustand";
import { login as loginApi } from "../api/auth";
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
    logout: () => void;
    initFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    userId: null,
    name: null,
    role: null,
    phone: null,
    isAuthenticated: false,
    loading: false,
    error: null,

    login: async (data: LoginRequest) => {
        set({ loading: true, error: null });
        try {
            const response = await loginApi(data);
            const { token, userId, name, role, phone } = response.data;
            localStorage.setItem("token", token);
            localStorage.setItem(
                "user",
                JSON.stringify({ userId, name, role, phone }),
            );
            set({
                token,
                userId,
                name,
                role,
                phone,
                isAuthenticated: true,
                loading: false,
            });
        } catch (err: any) {
            set({
                loading: false,
                error: err.response?.data?.error || "Login failed",
            });
            throw err;
        }
    },

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({
            token: null,
            userId: null,
            name: null,
            role: null,
            phone: null,
            isAuthenticated: false,
        });
    },

    initFromStorage: () => {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (token && userStr) {
            const user = JSON.parse(userStr);
            set({
                token,
                userId: user.userId,
                name: user.name,
                role: user.role,
                phone: user.phone,
                isAuthenticated: true,
            });
        }
    },
}));
