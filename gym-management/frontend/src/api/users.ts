import api from "./axiosInstance";
import { User, PageResponse } from "../types";

export const getUsers = (params: {
    search?: string;
    page?: number;
    size?: number;
}) => api.get<PageResponse<User>>("/users", { params });

export const getUserById = (id: number) => api.get<User>(`/users/${id}`);

export const updateUser = (
    id: number,
    data: { name?: string; phone?: string; password?: string },
) => api.put<User>(`/users/${id}`, data);

export const deleteUser = (id: number) => api.delete(`/users/${id}`);
