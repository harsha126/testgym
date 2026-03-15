import api from "./axiosInstance";
import { Payment, CreatePaymentRequest, PaymentHistoryResponse } from "../types";

export const getPayments = (userId: number) =>
    api.get<Payment[]>(`/users/${userId}/payments`);

export const createPayment = (userId: number, data: CreatePaymentRequest) =>
    api.post<Payment>(`/users/${userId}/payments`, data);

export const getPaymentHistory = (params: {
    year: number;
    month: number;
    search?: string;
    page?: number;
    size?: number;
}) => api.get<PaymentHistoryResponse>(`/payments/history`, { params });
