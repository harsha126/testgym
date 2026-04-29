import api from "./axiosInstance";
import {
    Subscription,
    SubscriptionPlan,
    CreateSubscriptionRequest,
} from "../types";

export const getSubscriptionPlans = () =>
    api.get<SubscriptionPlan[]>("/subscription-plans");

export const getSubscriptions = (userId: number) =>
    api.get<Subscription[]>(`/users/${userId}/subscriptions`);

export const getCurrentSubscription = (userId: number) =>
    api.get<Subscription>(`/users/${userId}/subscriptions/current`);

export const createSubscription = (
    userId: number,
    data: CreateSubscriptionRequest,
) => api.post<Subscription>(`/users/${userId}/subscriptions`, data);

export const deleteSubscription = (userId: number, subscriptionId: number) =>
    api.delete(`/users/${userId}/subscriptions/${subscriptionId}`);
