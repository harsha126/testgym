import { create } from "zustand";
import { getUsers } from "../api/users";
import { User, PageResponse } from "../types";

interface UserState {
    users: User[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    loading: boolean;
    searchResults: User[];
    searchLoading: boolean;
    selectedUser: User | null;
    fetchUsers: (page?: number, size?: number) => Promise<void>;
    searchUsers: (search: string) => Promise<void>;
    setSelectedUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
    users: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    loading: false,
    searchResults: [],
    searchLoading: false,
    selectedUser: null,

    fetchUsers: async (page = 0, size = 20) => {
        set({ loading: true });
        try {
            const response = await getUsers({ page, size });
            const data: PageResponse<User> = response.data;
            set({
                users: data.content,
                totalElements: data.totalElements,
                totalPages: data.totalPages,
                currentPage: data.number,
                loading: false,
            });
        } catch {
            set({ loading: false });
        }
    },

    searchUsers: async (search: string) => {
        if (!search.trim()) {
            set({ searchResults: [] });
            return;
        }
        set({ searchLoading: true });
        try {
            const response = await getUsers({ search, page: 0, size: 10 });
            set({ searchResults: response.data.content, searchLoading: false });
        } catch {
            set({ searchLoading: false });
        }
    },

    setSelectedUser: (user) => set({ selectedUser: user }),
}));
