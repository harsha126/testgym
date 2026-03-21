// Personal Training related type definitions

export interface PersonalTraining {
  id: number;
  userId: number;
  userName: string;
  userPhone: string;
  enrollmentDate: string;
  extraPaymentAmount: number;
  paymentFrequency: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY' | 'CUSTOM';
  customFrequencyDays?: number;
  isActive: boolean;
  notes?: string;
  activeWorkoutPlansCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollPersonalTrainingRequest {
  userId: number;
  enrollmentDate?: string;
  extraPaymentAmount: number;
  paymentFrequency: string;
  customFrequencyDays?: number;
  notes?: string;
}

export interface WorkoutPlan {
  id: number;
  personalTrainingId: number;
  userId: number;
  userName: string;
  planName: string;
  planData: WorkoutPlanData;
  isActive: boolean;
  createdById: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutPlanData {
  planName: string;
  description?: string;
  totalWeeks: number;
  daysPerWeek: number;
  selectedDays: string[];
  startDate?: string;
  endDate?: string;
  days: WorkoutDay[];
  generalNotes?: string;
  metadata?: {
    difficulty?: string;
    equipment?: string[];
    tags?: string[];
  };
}

export interface WorkoutDay {
  dayNumber: number;
  dayName: string;
  focusArea: string;
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: string;
  restTime: string;
  notes?: string;
  order: number;
  videoUrl?: string;
}

export interface CreateWorkoutPlanRequest {
  personalTrainingId: number;
  planName: string;
  planData: WorkoutPlanData;
  isActive?: boolean;
}

export interface WorkoutPlanProgress {
  id: number;
  workoutPlanId: number;
  userId: number;
  dayNumber: number;
  exerciseId: string;
  completedAt: string;
  notes?: string;
}

export interface MarkExerciseCompleteRequest {
  workoutPlanId: number;
  dayNumber: number;
  exerciseId: string;
  notes?: string;
}

// Helper types for UI
export const PAYMENT_FREQUENCIES = [
  { value: 'MONTHLY', label: 'Monthly (30 days)' },
  { value: 'QUARTERLY', label: 'Quarterly (90 days)' },
  { value: 'HALF_YEARLY', label: 'Half-Yearly (180 days)' },
  { value: 'YEARLY', label: 'Yearly (365 days)' },
  { value: 'CUSTOM', label: 'Custom' },
] as const;

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export const EQUIPMENT_LIST = [
  'Barbell',
  'Dumbbells',
  'Machines',
  'Cables',
  'Bodyweight',
  'Resistance Bands',
  'Kettlebells',
  'TRX',
  'Medicine Ball',
  'Bosu Ball',
] as const;
