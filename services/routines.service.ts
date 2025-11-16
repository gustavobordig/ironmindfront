import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import type { Routine, CreateRoutineData } from '@/types/api';

/**
 * Lista todas as rotinas do usuário
 */
export async function getRoutines(): Promise<Routine[]> {
  const response = await apiGet<{ routines: Routine[] }>('/routines');
  return response.routines || [];
}

/**
 * Obtém uma rotina por ID
 */
export async function getRoutineById(id: string): Promise<Routine> {
  return apiGet<Routine>(`/routines/${id}`);
}

/**
 * Cria uma nova rotina
 */
export async function createRoutine(data: CreateRoutineData): Promise<Routine> {
  return apiPost<Routine>('/routines', data);
}

/**
 * Atualiza uma rotina
 */
export async function updateRoutine(
  id: string,
  data: Partial<CreateRoutineData>
): Promise<Routine> {
  return apiPatch<Routine>(`/routines/${id}`, data);
}

/**
 * Deleta uma rotina
 */
export async function deleteRoutine(id: string): Promise<void> {
  return apiDelete<void>(`/routines/${id}`);
}

/**
 * Duplica uma rotina
 */
export async function duplicateRoutine(id: string): Promise<Routine> {
  return apiPost<Routine>(`/routines/${id}/duplicate`);
}

