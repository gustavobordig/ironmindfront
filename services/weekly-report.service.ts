/**
 * Serviço para Relatórios Semanais
 */

import { apiGet, apiPost } from './api';
import type { WeeklyReportDTO } from '@/types/weekly-report';

/**
 * Busca o relatório semanal do usuário autenticado
 * Se não existir, gera automaticamente (lazy generation)
 */
export async function getWeeklyReport(): Promise<WeeklyReportDTO> {
  return apiGet<WeeklyReportDTO>('/reports/weekly');
}

/**
 * Força a geração de um novo relatório semanal
 * Útil para atualizar dados
 */
export async function generateWeeklyReport(): Promise<WeeklyReportDTO> {
  return apiPost<WeeklyReportDTO>('/reports/weekly/generate');
}

