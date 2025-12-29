import { apiGet, apiPost, apiPatch } from './api';
import type { Goal } from '@/types/api';

/**
 * Lista todas as metas do usuário
 */
export async function getGoals(): Promise<Goal[]> {
  const response = await apiGet<{ goals: Goal[] }>('/goals');
  return response.goals || [];
}

/**
 * Obtém uma meta por ID
 */
export async function getGoalById(id: string): Promise<Goal> {
  return apiGet<Goal>(`/goals/${id}`);
}

/**
 * Busca meta de um exercício específico
 */
export async function getGoalByExercise(exerciseId: string): Promise<Goal | null> {
  try {
    return await apiGet<Goal>(`/goals/by-exercise/${exerciseId}`);
  } catch (error: any) {
    // Se não encontrar meta, retorna null
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Lista apenas metas ativas
 */
export async function getActiveGoals(): Promise<Goal[]> {
  const response = await apiGet<{ goals: Goal[] }>('/goals/active');
  return response.goals || [];
}

/**
 * Cria uma nova meta
 */
export async function createGoal(data: {
  exerciseId: string;
  targetKg: number;
  stepKg?: number;
  equipment?: 'barra' | 'halteres' | 'maquina' | 'cabo' | 'peso_corporal';
  deadlineAt?: Date;
}): Promise<Goal> {
  return apiPost<Goal>('/goals', data);
}

/**
 * Atualiza uma meta
 */
export async function updateGoal(
  id: string,
  data: {
    targetKg?: number;
    stepKg?: number;
    status?: 'active' | 'paused' | 'archived';
    deadlineAt?: Date;
    equipment?: 'barra' | 'halteres' | 'maquina' | 'cabo' | 'peso_corporal';
  }
): Promise<Goal> {
  return apiPatch<Goal>(`/goals/${id}`, data);
}

