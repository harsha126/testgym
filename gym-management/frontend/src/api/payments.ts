import api from "./axiosInstance";
import { Payment, CreatePaymentRequest } from "../types";

export const getPayments = (userId: number) =>
    api.get<Payment[]>(`/users/${userId}/payments`);

export const createPayment = (userId: number, data: CreatePaymentRequest) =>
    api.post<Payment>(`/users/${userId}/payments`, data);
