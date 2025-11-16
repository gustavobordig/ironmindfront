/**
 * Tipos TypeScript baseados na documentação da API
 */

// User
export interface User {
  id: string;
  email: string;
  name: string;
}

// Exercise
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'core'
  | 'glutes'
  | 'cardio'
  | 'other';

export type EquipmentType =
  | 'barra'
  | 'halteres'
  | 'maquina'
  | 'cabo'
  | 'peso-corporal';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  isCustom: boolean;
  equipment?: EquipmentType;
  instructions?: string;
  imageUrl?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExerciseFilters {
  search?: string;
  muscleGroup?: MuscleGroup;
  equipment?: EquipmentType;
  page?: number;
  limit?: number;
}

export interface CreateExerciseData {
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: EquipmentType;
  instructions?: string;
  imageUrl?: string;
}

export interface ExercisePagination {
  exercises: Exercise[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Routine
export interface RoutineExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
  restTime: number;
  notes?: string;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  daysOfWeek: number[]; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  createdAt: string;
  isCustom: boolean;
}

export interface CreateRoutineExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
  restTime?: number;
  notes?: string;
}

export interface CreateRoutineData {
  name: string;
  description?: string;
  daysOfWeek: number[];
  exercises: CreateRoutineExercise[];
}

// Workout
export type SetType = 'working' | 'warmup' | 'dropset' | 'failure' | 'superset';

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  type: SetType;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  restTime: number;
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: WorkoutExercise[];
  duration?: number;
  notes?: string;
  isActive: boolean;
  startedAt?: string;
  completedAt?: string;
}

export interface CreateWorkoutData {
  name: string;
  routineId?: string;
}

export interface CreateSetData {
  reps: number;
  weight: number;
  type?: SetType;
}

export interface UpdateSetData {
  reps?: number;
  weight?: number;
  type?: SetType;
  completed?: boolean;
}

export interface WorkoutFilters {
  period?: '7' | '30' | '90' | 'all';
  page?: number;
  limit?: number;
}

export interface WorkoutHistoryResponse {
  workouts: Workout[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Stats
export interface OverviewStats {
  totalWorkouts: number;
  totalSets: number;
  totalExercises: number;
  totalVolume: number;
  averageDuration: number;
  period: string;
}

export interface MuscleGroupStats {
  muscleGroup: string;
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  averageWeight: number;
}

export interface StatsFilters {
  muscleGroup?: string;
  period?: '7' | '30' | '90' | 'all';
}

export interface PersonalRecord {
  exerciseId: string;
  weight: number;
  reps: number;
  date: string;
  estimatedOneRepMax?: number;
}

export interface ExerciseHistoryEntry {
  workout: Workout;
  exercise: WorkoutExercise;
}

export interface ExerciseHistoryResponse {
  exercise: Exercise;
  history: ExerciseHistoryEntry[];
}

// Auth
export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

