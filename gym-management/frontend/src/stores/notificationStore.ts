import { create } from "zustand";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
} from "../api/notifications";
import { Notification } from "../types";

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: (page?: number) => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markNotificationAsRead: (id: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,

    fetchNotifications: async (page = 0) => {
        set({ loading: true });
        try {
            const response = await getNotifications({ page, size: 20 });
            set({ notifications: response.data.content, loading: false });
        } catch {
            set({ loading: false });
        }
    },

    fetchUnreadCount: async () => {
        try {
            const response = await getUnreadCount();
            set({ unreadCount: response.data.count });
        } catch {}
    },

    markNotificationAsRead: async (id: number) => {
        try {
            await markAsRead(id);
            const updated = get().notifications.map((n) =>
                n.id === id ? { ...n, isRead: true } : n,
            );
            set({
                notifications: updated,
                unreadCount: Math.max(0, get().unreadCount - 1),
            });
        } catch {}
    },
}));
