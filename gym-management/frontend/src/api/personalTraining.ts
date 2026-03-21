import axiosInstance from './axiosInstance';
import { PersonalTraining, EnrollPersonalTrainingRequest } from '../types/personalTraining';

export const personalTrainingAPI = {
  /**
   * Enroll a user in personal training
   */
  enrollUser: (data: EnrollPersonalTrainingRequest) =>
    axiosInstance.post<PersonalTraining>('/personal-training/enroll', data),

  /**
   * Remove a user from personal training
   */
  removeUser: (userId: number) =>
    axiosInstance.delete(`/personal-training/users/${userId}`),

  /**
   * Get all active personal training users
   */
  getAllActiveUsers: () =>
    axiosInstance.get<PersonalTraining[]>('/personal-training/users'),

  /**
   * Get all personal training users (including inactive)
   */
  getAllUsers: () =>
    axiosInstance.get<PersonalTraining[]>('/personal-training/users/all'),

  /**
   * Get personal training details by user ID
   */
  getByUserId: (userId: number) =>
    axiosInstance.get<PersonalTraining>(`/personal-training/users/${userId}`),

  /**
   * Get personal training details by PT ID
   */
  getById: (ptId: number) =>
    axiosInstance.get<PersonalTraining>(`/personal-training/${ptId}`),

  /**
   * Update payment details for personal training
   */
  updatePayment: (ptId: number, amount?: number, frequency?: string, customDays?: number) =>
    axiosInstance.patch<PersonalTraining>(`/personal-training/${ptId}/payment`, null, {
      params: { amount, frequency, customDays },
    }),

  /**
   * Update notes for personal training
   */
  updateNotes: (ptId: number, notes: string) =>
    axiosInstance.patch<PersonalTraining>(`/personal-training/${ptId}/notes`, null, {
      params: { notes },
    }),
};
