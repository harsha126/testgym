import { create } from 'zustand';
import {
  WorkoutPlan,
  CreateWorkoutPlanRequest,
  WorkoutPlanProgress,
  MarkExerciseCompleteRequest,
} from '../types/personalTraining';
import { workoutPlansAPI } from '../api/workoutPlans';
import { message } from 'antd';

interface WorkoutPlanState {
  workoutPlans: WorkoutPlan[];
  activeWorkoutPlan: WorkoutPlan | null;
  progress: WorkoutPlanProgress[];
  loading: boolean;
  error: string | null;

  fetchPlansByPTId: (ptId: number) => Promise<void>;
  fetchActivePlanByUserId: (userId: number) => Promise<void>;
  createPlan: (data: CreateWorkoutPlanRequest) => Promise<void>;
  updatePlan: (planId: number, data: CreateWorkoutPlanRequest) => Promise<void>;
  duplicatePlan: (planId: number, targetPtId: number) => Promise<void>;
  activatePlan: (planId: number) => Promise<void>;
  deactivatePlan: (planId: number) => Promise<void>;
  deletePlan: (planId: number) => Promise<void>;
  markExerciseComplete: (data: MarkExerciseCompleteRequest) => Promise<void>;
  fetchProgress: (workoutPlanId: number) => Promise<void>;
  fetchMyProgress: () => Promise<void>;
  clearActivePlan: () => void;
}

export const useWorkoutPlanStore = create<WorkoutPlanState>((set, get) => ({
  workoutPlans: [],
  activeWorkoutPlan: null,
  progress: [],
  loading: false,
  error: null,

  fetchPlansByPTId: async (ptId) => {
    set({ loading: true, error: null });
    try {
      const response = await workoutPlansAPI.getPlansByPersonalTrainingId(ptId);
      set({ workoutPlans: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to fetch workout plans');
    }
  },

  fetchActivePlanByUserId: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await workoutPlansAPI.getActivePlanByUserId(userId);
      set({ activeWorkoutPlan: response.data, loading: false });
    } catch (error: any) {
      set({ activeWorkoutPlan: null, loading: false });
      if (error.response?.status !== 404) {
        message.error('Failed to fetch active workout plan');
      }
    }
  },

  createPlan: async (data) => {
    set({ loading: true, error: null });
    try {
      await workoutPlansAPI.createPlan(data);
      message.success('Workout plan created successfully');
      await get().fetchPlansByPTId(data.personalTrainingId);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      const errorMsg = error.response?.data?.message || 'Failed to create workout plan';
      message.error(errorMsg);
      throw error;
    }
  },

  updatePlan: async (planId, data) => {
    set({ loading: true, error: null });
    try {
      await workoutPlansAPI.updatePlan(planId, data);
      message.success('Workout plan updated successfully');
      await get().fetchPlansByPTId(data.personalTrainingId);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      const errorMsg = error.response?.data?.message || 'Failed to update workout plan';
      message.error(errorMsg);
      throw error;
    }
  },

  duplicatePlan: async (planId, targetPtId) => {
    set({ loading: true, error: null });
    try {
      await workoutPlansAPI.duplicatePlan(planId, targetPtId);
      message.success('Workout plan duplicated successfully');
      await get().fetchPlansByPTId(targetPtId);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to duplicate workout plan');
      throw error;
    }
  },

  activatePlan: async (planId) => {
    set({ loading: true, error: null });
    try {
      await workoutPlansAPI.activatePlan(planId);
      message.success('Workout plan activated');
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to activate workout plan');
      throw error;
    }
  },

  deactivatePlan: async (planId) => {
    set({ loading: true, error: null });
    try {
      await workoutPlansAPI.deactivatePlan(planId);
      message.success('Workout plan deactivated');
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to deactivate workout plan');
      throw error;
    }
  },

  deletePlan: async (planId) => {
    set({ loading: true, error: null });
    try {
      await workoutPlansAPI.deletePlan(planId);
      message.success('Workout plan deleted');
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      message.error('Failed to delete workout plan');
      throw error;
    }
  },

  markExerciseComplete: async (data) => {
    try {
      await workoutPlansAPI.markExerciseComplete(data);
      message.success('Exercise marked as complete');
      await get().fetchProgress(data.workoutPlanId);
    } catch (error: any) {
      message.error('Failed to mark exercise as complete');
      throw error;
    }
  },

  fetchProgress: async (workoutPlanId) => {
    try {
      const response = await workoutPlansAPI.getProgress(workoutPlanId);
      set({ progress: response.data });
    } catch (error: any) {
      console.error('Failed to fetch progress:', error);
    }
  },

  fetchMyProgress: async () => {
    try {
      const response = await workoutPlansAPI.getMyProgress();
      set({ progress: response.data });
    } catch (error: any) {
      console.error('Failed to fetch my progress:', error);
    }
  },

  clearActivePlan: () => {
    set({ activeWorkoutPlan: null });
  },
}));
