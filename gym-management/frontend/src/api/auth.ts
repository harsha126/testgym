import api from "./axiosInstance";
import { LoginRequest, LoginResponse, RegisterRequest, User } from "../types";

export const login = (data: LoginRequest) =>
    api.post<LoginResponse>("/auth/login", data, { withCredentials: true });

export const logout = () =>
    api.post("/auth/logout", {}, { withCredentials: true });

export const refreshAccessToken = () =>
    api.post<{ accessToken: string }>("/auth/refresh", {}, { withCredentials: true });

export const register = (data: RegisterRequest) =>
    api.post<User>("/auth/register", data);
