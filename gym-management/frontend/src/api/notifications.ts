import api from "./axiosInstance";
import { Notification, PageResponse } from "../types";

export const getNotifications = (params: { page?: number; size?: number }) =>
    api.get<PageResponse<Notification>>("/notifications", { params });

export const getUnreadCount = () =>
    api.get<{ count: number }>("/notifications/unread-count");

export const markAsRead = (id: number) => api.put(`/notifications/${id}/read`);
