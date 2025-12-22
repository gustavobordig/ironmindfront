/**
 * Utilitário para gerar PDF com estatísticas do relatório semanal
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import type { WeeklyReportDTO } from '@/types/weekly-report';

const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: 'Peito',
  back: 'Costas',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  legs: 'Pernas',
  core: 'Core',
  glutes: 'Glúteos',
  cardio: 'Cardio',
  other: 'Outros',
};

/**
 * Gera HTML para o PDF
 */
function generatePDFHTML(report: WeeklyReportDTO, userName?: string): string {
  const formatNumber = (num: number) => num.toLocaleString('pt-BR');
  const formatPercent = (num: number) => num.toFixed(1).replace('.', ',');
  
  const muscleLabel = MUSCLE_GROUP_LABELS[report.muscleHighlight.muscleGroup] || report.muscleHighlight.muscleGroup;
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'INCREASED': return 'Aumentou';
      case 'DECREASED': return 'Diminuiu';
      case 'MAINTAINED': return 'Manteve';
      default: return status;
    }
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          background: #1a1a1a;
          color: #ffffff;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #ff6b35;
        }
        .header h1 {
          font-size: 32px;
          color: #ff6b35;
          margin-bottom: 10px;
        }
        .header .period {
          font-size: 18px;
          color: #9ca3af;
        }
        .user-name {
          font-size: 16px;
          color: #d1d5db;
          margin-top: 10px;
        }
        .section {
          margin-bottom: 30px;
          background: #2a2a2a;
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid #ff6b35;
        }
        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #ff6b35;
          margin-bottom: 15px;
        }
        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .metric-label {
          font-size: 16px;
          color: #d1d5db;
        }
        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
        }
        .pr-exercise {
          background: #1a1a1a;
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 8px;
          border: 1px solid #ff6b35;
        }
        .pr-exercise-name {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 10px;
        }
        .pr-weights {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .pr-weight {
          text-align: center;
        }
        .pr-weight-label {
          font-size: 12px;
          color: #9ca3af;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .pr-weight-value {
          font-size: 20px;
          font-weight: 700;
        }
        .pr-previous {
          color: #9ca3af;
        }
        .pr-new {
          color: #ff6b35;
        }
        .pr-improvement {
          text-align: center;
          color: #ff6b35;
          font-weight: 700;
        }
        .insight {
          background: #1a1a1a;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #4ade80;
          margin-top: 20px;
        }
        .insight-text {
          font-size: 16px;
          color: #d1d5db;
          font-style: italic;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório Semanal</h1>
        <div class="period">${report.period.label}</div>
        ${userName ? `<div class="user-name">${userName}</div>` : ''}
      </div>

      <div class="section">
        <div class="section-title">Frequência</div>
        <div class="metric">
          <span class="metric-label">Dias treinados</span>
          <span class="metric-value">${report.frequency.daysTrained} dias</span>
        </div>
        ${report.frequency.daysOfWeek && report.frequency.daysOfWeek.length > 0 ? `
          <div style="margin-top: 10px; color: #9ca3af; font-size: 14px;">
            Dias: ${report.frequency.daysOfWeek.join(', ')}
          </div>
        ` : ''}
        <div style="margin-top: 10px; color: #9ca3af; font-size: 14px;">
          Status: ${getStatusLabel(report.frequency.status)}
          ${report.frequency.comparisonPercent !== 0 ? ` (${report.frequency.comparisonPercent > 0 ? '+' : ''}${formatPercent(report.frequency.comparisonPercent)}%)` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Volume Total</div>
        <div class="metric">
          <span class="metric-label">Volume movimentado</span>
          <span class="metric-value">${formatNumber(report.volume.total)} kg</span>
        </div>
        <div style="margin-top: 10px; color: #9ca3af; font-size: 14px;">
          Status: ${getStatusLabel(report.volume.status)}
          ${report.volume.comparisonPercent !== 0 ? ` (${report.volume.comparisonPercent > 0 ? '+' : ''}${formatPercent(report.volume.comparisonPercent)}%)` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Grupo Muscular em Destaque</div>
        <div class="metric">
          <span class="metric-label">${muscleLabel}</span>
          <span class="metric-value">${formatPercent(report.muscleHighlight.percentOfTotal)}%</span>
        </div>
        <div style="margin-top: 10px; color: #9ca3af; font-size: 14px;">
          ${formatPercent(report.muscleHighlight.percentOfTotal)}% do volume total
        </div>
      </div>

      <div class="section">
        <div class="section-title">Exercício Top da Semana</div>
        <div class="metric">
          <span class="metric-label">${report.topExercise.name}</span>
          <span class="metric-value">${formatNumber(report.topExercise.totalVolume)} kg</span>
        </div>
      </div>

      ${report.prs.count > 0 ? `
        <div class="section">
          <div class="section-title">Personal Records (${report.prs.count})</div>
          ${report.prs.exercises.map(exercise => `
            <div class="pr-exercise">
              <div class="pr-exercise-name">${exercise.name}</div>
              <div class="pr-weights">
                <div class="pr-weight">
                  <div class="pr-weight-label">Anterior</div>
                  <div class="pr-weight-value pr-previous">${formatNumber(exercise.previousMax)} kg</div>
                </div>
                <div class="pr-improvement">
                  → +${formatNumber(exercise.improvement)} kg
                </div>
                <div class="pr-weight">
                  <div class="pr-weight-label">Novo PR</div>
                  <div class="pr-weight-value pr-new">${formatNumber(exercise.newMax)} kg</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="insight">
        <div class="section-title" style="color: #4ade80; margin-bottom: 10px;">Insight da Semana</div>
        <div class="insight-text">${report.insight.text}</div>
      </div>

      <div class="footer">
        Gerado em ${new Date().toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}<br>
        GymTracker App
      </div>
    </body>
    </html>
  `;
}

/**
 * Gera e baixa PDF com as estatísticas do relatório
 */
export async function generateWeeklyReportPDF(
  report: WeeklyReportDTO,
  userName?: string
): Promise<void> {
  try {
    const html = generatePDFHTML(report, userName);
    
    // Gerar PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Verificar se o compartilhamento está disponível
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (isAvailable) {
      // Compartilhar/salvar PDF usando o diálogo nativo
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Salvar Relatório Semanal',
        UTI: 'com.adobe.pdf',
      });
    } else {
      // Fallback: usar print dialog
      await Print.printAsync({
        html,
      });
    }
  } catch (error: any) {
    console.error('Erro ao gerar PDF:', error);
    
    // Se o usuário cancelar, não mostrar erro
    if (error?.code === 'ERR_CANCELLED' || error?.message?.includes('cancel')) {
      return;
    }
    
    Alert.alert(
      'Erro',
      'Não foi possível gerar o PDF. Tente novamente.',
      [{ text: 'OK' }]
    );
  }
}

