import axiosInstance from './axiosInstance';
import {
  WorkoutPlan,
  CreateWorkoutPlanRequest,
  WorkoutPlanProgress,
  MarkExerciseCompleteRequest,
} from '../types/personalTraining';

export const workoutPlansAPI = {
  /**
   * Create a new workout plan
   */
  createPlan: (data: CreateWorkoutPlanRequest) =>
    axiosInstance.post<WorkoutPlan>('/workout-plans', data),

  /**
   * Update an existing workout plan
   */
  updatePlan: (planId: number, data: CreateWorkoutPlanRequest) =>
    axiosInstance.put<WorkoutPlan>(`/workout-plans/${planId}`, data),

  /**
   * Duplicate a workout plan to another user
   */
  duplicatePlan: (planId: number, targetPtId: number) =>
    axiosInstance.post<WorkoutPlan>(`/workout-plans/${planId}/duplicate`, null, {
      params: { targetPtId },
    }),

  /**
   * Activate a workout plan
   */
  activatePlan: (planId: number) =>
    axiosInstance.patch(`/workout-plans/${planId}/activate`),

  /**
   * Deactivate a workout plan
   */
  deactivatePlan: (planId: number) =>
    axiosInstance.patch(`/workout-plans/${planId}/deactivate`),

  /**
   * Delete a workout plan
   */
  deletePlan: (planId: number) =>
    axiosInstance.delete(`/workout-plans/${planId}`),

  /**
   * Get a workout plan by ID
   */
  getPlanById: (planId: number) =>
    axiosInstance.get<WorkoutPlan>(`/workout-plans/${planId}`),

  /**
   * Get all workout plans for a personal training enrollment
   */
  getPlansByPersonalTrainingId: (ptId: number) =>
    axiosInstance.get<WorkoutPlan[]>(`/workout-plans/personal-training/${ptId}`),

  /**
   * Get the active workout plan for a user
   */
  getActivePlanByUserId: (userId: number) =>
    axiosInstance.get<WorkoutPlan>(`/workout-plans/users/${userId}/active`),

  /**
   * Mark an exercise as complete
   */
  markExerciseComplete: (data: MarkExerciseCompleteRequest) =>
    axiosInstance.post<WorkoutPlanProgress>('/workout-plans/progress', data),

  /**
   * Get progress for a workout plan
   */
  getProgress: (workoutPlanId: number) =>
    axiosInstance.get<WorkoutPlanProgress[]>(`/workout-plans/${workoutPlanId}/progress`),

  /**
   * Get all progress for the current user
   */
  getMyProgress: () =>
    axiosInstance.get<WorkoutPlanProgress[]>('/workout-plans/progress/me'),
};
