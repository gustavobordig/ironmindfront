import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import type {
  Exercise,
  ExerciseFilters,
  ExercisePagination,
  CreateExerciseData,
} from '@/types/api';

/**
 * Lista exercícios com filtros opcionais
 */
export async function getExercises(
  filters?: ExerciseFilters
): Promise<ExercisePagination> {
  const params = new URLSearchParams();
  
  if (filters?.search) params.append('search', filters.search);
  if (filters?.muscleGroup) params.append('muscleGroup', filters.muscleGroup);
  if (filters?.equipment) params.append('equipment', filters.equipment);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const queryString = params.toString();
  const endpoint = `/exercises${queryString ? `?${queryString}` : ''}`;
  
  return apiGet<ExercisePagination>(endpoint);
}

/**
 * Obtém um exercício por ID
 */
export async function getExerciseById(id: string): Promise<Exercise> {
  return apiGet<Exercise>(`/exercises/${id}`);
}

/**
 * Cria um exercício customizado
 */
export async function createExercise(
  data: CreateExerciseData
): Promise<Exercise> {
  return apiPost<Exercise>('/exercises', data);
}

/**
 * Atualiza um exercício
 */
export async function updateExercise(
  id: string,
  data: Partial<CreateExerciseData>
): Promise<Exercise> {
  return apiPatch<Exercise>(`/exercises/${id}`, data);
}

/**
 * Deleta um exercício
 */
export async function deleteExercise(id: string): Promise<void> {
  return apiDelete<void>(`/exercises/${id}`);
}

