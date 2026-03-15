export interface User {
    id: number;
    name: string;
    phone: string;
    role: "OWNER" | "USER";
    isActive: boolean;
    createdAt: string;
    currentPlan?: string;
    endDate?: string;
    daysLeft?: number;
    subscriptionStatus?: string;
}

export interface LoginRequest {
    phone: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    userId: number;
    name: string;
    role: string;
    phone: string;
}

export interface RegisterRequest {
    name: string;
    phone: string;
    password?: string;
}

export interface SubscriptionPlan {
    planId: number;
    planName: string;
    planPrice: number;
}

export interface Subscription {
    id: number;
    userId: number;
    userName: string;
    planId: number;
    planName: string;
    startDate: string;
    endDate: string;
    status: "ACTIVE" | "EXPIRED" | "CANCELLED";
    notes?: string;
    daysRemaining: number;
    planPrice: number;
    createdAt: string;
}

export interface CreateSubscriptionRequest {
    planId: number;
    startDate: string;
    endDate?: string;
    customDurationDays?: number;
    notes?: string;
    amount?: number;
    paymentMethod?: string;
    paymentNotes?: string;
}

export interface Payment {
    id: number;
    userId: number;
    userName: string;
    userPhone?: string;
    subscriptionId?: number;
    planName?: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
    createdAt: string;
}

export interface PaymentHistoryResponse {
    monthlyTotal: number;
    yearlyTotal: number;
    payments: Payment[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

export interface CreatePaymentRequest {
    subscriptionId?: number;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    notes?: string;
}

export interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    sentVia: string;
    createdAt: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}
