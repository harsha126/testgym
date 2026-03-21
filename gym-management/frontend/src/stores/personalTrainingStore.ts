import { create } from 'zustand';
import { PersonalTraining, EnrollPersonalTrainingRequest } from '../types/personalTraining';
import { personalTrainingAPI } from '../api/personalTraining';
import { message } from 'antd';

interface PersonalTrainingState {
  ptUsers: PersonalTraining[];
  selectedPT: PersonalTraining | null;
  loading: boolean;
  error: string | null;

  fetchAllActiveUsers: () => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  enrollUser: (data: EnrollPersonalTrainingRequest) => Promise<void>;
  removeUser: (userId: number) => Promise<void>;
  selectPT: (pt: PersonalTraining | null) => void;
  updatePayment: (ptId: number, amount?: number, frequency?: string, customDays?: number) => Promise<void>;
  updateNotes: (ptId: number, notes: string) => Promise<void>;
  getByUserId: (userId: number) => Promise<PersonalTraining | null>;
}

export const usePersonalTrainingStore = create<PersonalTrainingState>((set, get) => ({
  ptUsers: [],
  selectedPT: null,
  loading: false,
  error: null,

  fetchAllActiveUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await personalTrainingAPI.getAllActiveUsers();
      set({ ptUsers: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to fetch personal training users');
    }
  },

  fetchAllUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await personalTrainingAPI.getAllUsers();
      set({ ptUsers: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to fetch personal training users');
    }
  },

  enrollUser: async (data) => {
    set({ loading: true, error: null });
    try {
      await personalTrainingAPI.enrollUser(data);
      message.success('User enrolled in personal training successfully');
      await get().fetchAllActiveUsers();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      const errorMsg = error.response?.data?.message || 'Failed to enroll user in personal training';
      message.error(errorMsg);
      throw error;
    }
  },

  removeUser: async (userId) => {
    set({ loading: true, error: null });
    try {
      await personalTrainingAPI.removeUser(userId);
      message.success('User removed from personal training');
      await get().fetchAllActiveUsers();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to remove user from personal training');
    }
  },

  selectPT: (pt) => {
    set({ selectedPT: pt });
  },

  updatePayment: async (ptId, amount, frequency, customDays) => {
    set({ loading: true, error: null });
    try {
      await personalTrainingAPI.updatePayment(ptId, amount, frequency, customDays);
      message.success('Payment details updated');
      await get().fetchAllActiveUsers();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to update payment details');
      throw error;
    }
  },

  updateNotes: async (ptId, notes) => {
    set({ loading: true, error: null });
    try {
      await personalTrainingAPI.updateNotes(ptId, notes);
      message.success('Notes updated');
      await get().fetchAllActiveUsers();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to update notes');
      throw error;
    }
  },

  getByUserId: async (userId) => {
    try {
      const response = await personalTrainingAPI.getByUserId(userId);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
}));
