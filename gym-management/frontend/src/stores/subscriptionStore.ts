import { create } from "zustand";
import {
    getSubscriptions,
    getCurrentSubscription,
    getSubscriptionPlans,
    deleteSubscription as deleteSubscriptionApi,
} from "../api/subscriptions";
import { getPayments } from "../api/payments";
import { Subscription, SubscriptionPlan, Payment } from "../types";

interface SubscriptionState {
    subscriptions: Subscription[];
    currentSubscription: Subscription | null;
    plans: SubscriptionPlan[];
    payments: Payment[];
    loading: boolean;
    fetchSubscriptions: (userId: number) => Promise<void>;
    fetchCurrentSubscription: (userId: number) => Promise<void>;
    fetchPlans: () => Promise<void>;
    fetchPayments: (userId: number) => Promise<void>;
    deleteSubscription: (userId: number, subscriptionId: number) => Promise<void>;
    clear: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
    subscriptions: [],
    currentSubscription: null,
    plans: [],
    payments: [],
    loading: false,

    fetchSubscriptions: async (userId: number) => {
        set({ loading: true });
        try {
            const response = await getSubscriptions(userId);
            set({ subscriptions: response.data, loading: false });
        } catch {
            set({ loading: false });
        }
    },

    fetchCurrentSubscription: async (userId: number) => {
        try {
            const response = await getCurrentSubscription(userId);
            set({ currentSubscription: response.data });
        } catch {
            set({ currentSubscription: null });
        }
    },

    fetchPlans: async () => {
        try {
            const response = await getSubscriptionPlans();
            set({ plans: response.data });
        } catch {}
    },

    fetchPayments: async (userId: number) => {
        try {
            const response = await getPayments(userId);
            set({ payments: response.data });
        } catch {}
    },

    deleteSubscription: async (userId: number, subscriptionId: number) => {
        await deleteSubscriptionApi(userId, subscriptionId);
        set((state) => ({
            subscriptions: state.subscriptions.filter((s) => s.id !== subscriptionId),
            currentSubscription:
                state.currentSubscription?.id === subscriptionId
                    ? null
                    : state.currentSubscription,
        }));
    },

    clear: () =>
        set({ subscriptions: [], currentSubscription: null, payments: [] }),
}));
