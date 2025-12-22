/**
 * Hook customizado para gerenciar relatórios semanais
 */

import { useState, useEffect, useCallback } from 'react';
import { getWeeklyReport, generateWeeklyReport } from '@/services/weekly-report.service';
import type { WeeklyReportDTO } from '@/types/weekly-report';

interface UseWeeklyReportReturn {
  report: WeeklyReportDTO | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWeeklyReport(): UseWeeklyReportReturn {
  const [report, setReport] = useState<WeeklyReportDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWeeklyReport();
      setReport(data);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar relatório');
      console.error('Erro ao buscar relatório:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await generateWeeklyReport();
      setReport(data);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar relatório');
      console.error('Erro ao gerar relatório:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { report, loading, error, refresh };
}

