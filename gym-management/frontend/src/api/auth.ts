import api from "./axiosInstance";
import { LoginRequest, LoginResponse, RegisterRequest, User } from "../types";

export const login = (data: LoginRequest) =>
    api.post<LoginResponse>("/auth/login", data);

export const register = (data: RegisterRequest) =>
    api.post<User>("/auth/register", data);
