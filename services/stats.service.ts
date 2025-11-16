import { apiGet } from './api';
import type {
  OverviewStats,
  MuscleGroupStats,
  StatsFilters,
  PersonalRecord,
  ExerciseHistoryEntry,
  ExerciseHistoryResponse,
} from '@/types/api';

/**
 * Obtém estatísticas gerais
 */
export async function getOverview(
  filters?: StatsFilters
): Promise<OverviewStats> {
  const params = new URLSearchParams();
  
  if (filters?.muscleGroup) params.append('muscleGroup', filters.muscleGroup);
  if (filters?.period) params.append('period', filters.period);

  const queryString = params.toString();
  const endpoint = `/stats/overview${queryString ? `?${queryString}` : ''}`;
  
  return apiGet<OverviewStats>(endpoint);
}

/**
 * Obtém estatísticas por grupo muscular
 */
export async function getMuscleGroupStats(
  period?: '7' | '30' | '90' | 'all'
): Promise<MuscleGroupStats[]> {
  const params = new URLSearchParams();
  if (period) params.append('period', period);

  const queryString = params.toString();
  const endpoint = `/stats/muscle-groups${queryString ? `?${queryString}` : ''}`;
  
  return apiGet<MuscleGroupStats[]>(endpoint);
}

/**
 * Obtém histórico de um exercício específico
 */
export async function getExerciseHistory(
  exerciseId: string
): Promise<ExerciseHistoryEntry[]> {
  const response = await apiGet<ExerciseHistoryResponse>(
    `/stats/exercises/${exerciseId}/history`
  );
  return response.history || [];
}

/**
 * Obtém o recorde pessoal de um exercício
 */
export async function getPersonalRecord(
  exerciseId: string
): Promise<PersonalRecord | null> {
  try {
    return await apiGet<PersonalRecord>(
      `/stats/exercises/${exerciseId}/personal-record`
    );
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null; // Sem recorde pessoal
    }
    throw error;
  }
}

