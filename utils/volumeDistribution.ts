/**
 * Utilitário para distribuir volume total entre os dias da semana
 * Calcula volume diário baseado em padrões de treino típicos
 */

import { mapDayNamesToIndices } from './dayMapping';

/**
 * Distribui o volume total entre os dias treinados da semana
 * Usa os dias reais retornados pela API quando disponível
 */
export function calculateDailyVolumes(
  totalVolume: number,
  daysTrained: number,
  startDate: string,
  daysOfWeek?: string[] // Ex: ["Segunda", "Terça", "Quinta", "Sexta"]
): number[] {
  const dailyVolumes: number[] = [0, 0, 0, 0, 0, 0, 0]; // Dom, Seg, Ter, Qua, Qui, Sex, Sáb (índices JS)
  
  if (daysTrained === 0) {
    return dailyVolumes;
  }

  // Padrões de distribuição realista
  // Dias úteis tendem a ter mais volume (mais tempo disponível)
  const dayWeights = [0.6, 1.2, 1.1, 1.0, 1.1, 1.2, 0.8]; // Dom, Seg, Ter, Qua, Qui, Sex, Sáb
  
  // Se temos os dias reais da API, usar eles
  let trainedDays: number[];
  if (daysOfWeek && daysOfWeek.length > 0) {
    trainedDays = mapDayNamesToIndices(daysOfWeek);
  } else {
    // Fallback: priorizar dias úteis
    const preferredDays = [1, 2, 3, 4, 5, 6, 0]; // Segunda a Domingo
    trainedDays = [];
    for (let i = 0; i < Math.min(daysTrained, 7); i++) {
      trainedDays.push(preferredDays[i]);
    }
  }

  // Calcular pesos totais
  const totalWeight = trainedDays.reduce((sum, day) => sum + dayWeights[day], 0);

  // Distribuir volume proporcionalmente
  trainedDays.forEach((day) => {
    const weight = dayWeights[day];
    dailyVolumes[day] = Math.round((totalVolume * weight) / totalWeight);
  });

  // Ajustar para garantir que a soma seja exata
  const currentSum = dailyVolumes.reduce((sum, vol) => sum + vol, 0);
  const difference = totalVolume - currentSum;
  
  if (difference !== 0 && trainedDays.length > 0) {
    // Ajustar o último dia treinado
    const lastDay = trainedDays[trainedDays.length - 1];
    dailyVolumes[lastDay] += difference;
  }

  return dailyVolumes;
}

/**
 * Distribui o volume de um grupo muscular entre os dias da semana
 * Usa a mesma lógica de distribuição, mas proporcional ao percentual do grupo
 */
export function calculateMuscleGroupDailyVolumes(
  totalVolume: number,
  musclePercent: number,
  daysTrained: number,
  startDate: string,
  daysOfWeek?: string[]
): number[] {
  // Volume total desse grupo muscular
  const muscleVolume = (totalVolume * musclePercent) / 100;
  
  // Distribuir esse volume entre os dias
  return calculateDailyVolumes(muscleVolume, daysTrained, startDate, daysOfWeek);
}

/**
 * Distribui o volume de um exercício específico entre os dias da semana
 */
export function calculateExerciseDailyVolumes(
  exerciseVolume: number,
  daysTrained: number,
  startDate: string,
  daysOfWeek?: string[]
): number[] {
  // Distribuir o volume do exercício entre os dias treinados
  return calculateDailyVolumes(exerciseVolume, daysTrained, startDate, daysOfWeek);
}

