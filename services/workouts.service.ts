import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import type {
  Workout,
  CreateWorkoutData,
  CreateSetData,
  UpdateSetData,
  WorkoutFilters,
  WorkoutHistoryResponse,
} from '@/types/api';

/**
 * Inicia um novo treino
 */
export async function startWorkout(data: CreateWorkoutData): Promise<Workout> {
  return apiPost<Workout>('/workouts', data);
}

/**
 * Obtém o treino ativo do usuário
 */
export async function getActiveWorkout(): Promise<Workout | null> {
  try {
    return await apiGet<Workout>('/workouts/active');
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null; // Nenhum treino ativo
    }
    throw error;
  }
}

/**
 * Adiciona um exercício ao treino ativo
 */
export async function addExerciseToWorkout(
  exerciseId: string,
  restTime?: number
): Promise<Workout> {
  return apiPost<Workout>('/workouts/active/exercises', {
    exerciseId,
    restTime: restTime || 90,
  });
}

/**
 * Adiciona uma série a um exercício do treino ativo
 */
export async function addSet(
  exerciseId: string,
  setData: CreateSetData
): Promise<Workout> {
  return apiPost<Workout>(
    `/workouts/active/exercises/${exerciseId}/sets`,
    setData
  );
}

/**
 * Atualiza uma série do treino ativo
 */
export async function updateSet(
  exerciseId: string,
  setId: string,
  data: UpdateSetData
): Promise<Workout> {
  return apiPatch<Workout>(
    `/workouts/active/exercises/${exerciseId}/sets/${setId}`,
    data
  );
}

/**
 * Remove um exercício do treino ativo
 */
export async function removeExerciseFromWorkout(exerciseId: string): Promise<Workout> {
  return apiDelete<Workout>(`/workouts/active/exercises/${exerciseId}`);
}

/**
 * Completa o treino ativo
 */
export async function completeWorkout(notes?: string): Promise<Workout> {
  return apiPost<Workout>('/workouts/active/complete', { notes });
}

/**
 * Cancela o treino ativo
 */
export async function cancelWorkout(): Promise<void> {
  return apiDelete<void>('/workouts/active');
}

/**
 * Lista o histórico de treinos
 */
export async function getWorkoutHistory(
  filters?: WorkoutFilters
): Promise<WorkoutHistoryResponse> {
  const params = new URLSearchParams();
  
  if (filters?.period) params.append('period', filters.period);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const queryString = params.toString();
  const endpoint = `/workouts${queryString ? `?${queryString}` : ''}`;
  
  return apiGet<WorkoutHistoryResponse>(endpoint);
}

/**
 * Obtém um treino específico por ID
 */
export async function getWorkoutById(id: string): Promise<Workout> {
  return apiGet<Workout>(`/workouts/${id}`);
}

