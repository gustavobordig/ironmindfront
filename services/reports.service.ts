import { apiGet } from './api';
import type { WeeklyReport } from '@/types/api';

/**
 * Busca o relatório semanal do usuário (lazy generation)
 */
export async function generateWeeklyReport(): Promise<WeeklyReport> {
  return apiGet<WeeklyReport>('/reports/weekly');
}
