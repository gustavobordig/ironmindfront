/**
 * Tipos TypeScript para Relatório Semanal
 */

export type ComparisonStatus = 'INCREASED' | 'MAINTAINED' | 'DECREASED';

export type MuscleGroup = 
  | 'chest' 
  | 'back' 
  | 'shoulders' 
  | 'biceps' 
  | 'triceps' 
  | 'legs' 
  | 'core' 
  | 'glutes' 
  | 'cardio' 
  | 'other';

export type InsightKey = 
  | 'INTENSITY_INCREASE'
  | 'FREQUENCY_INCREASE'
  | 'CONSISTENCY'
  | 'VOLUME_INCREASE'
  | 'VOLUME_DECREASE'
  | 'FREQUENCY_BOOST'
  | 'NO_TRAINING'
  | 'DEFAULT';

export interface WeeklyReportPeriod {
  startDate: string;        // ISO 8601: "2024-12-16T00:00:00.000Z"
  endDate: string;          // ISO 8601: "2024-12-22T23:59:59.999Z"
  label: string;            // "16/12 - 22/12/2024"
}

export interface WeeklyReportFrequency {
  daysTrained: number;      // Ex: 4 (dias treinados na semana)
  comparisonPercent: number; // Ex: 25.5 (aumento de 25.5% vs semana anterior)
  status: ComparisonStatus;
  daysOfWeek?: string[];     // Ex: ["Segunda", "Terça", "Quinta", "Sexta"]
}

export interface WeeklyReportVolume {
  total: number;            // Ex: 12500 (volume total em kg)
  comparisonPercent: number; // Ex: -10.2 (redução de 10.2% vs semana anterior)
  status: ComparisonStatus;
}

export interface WeeklyReportMuscleHighlight {
  muscleGroup: MuscleGroup;
  percentOfTotal: number;   // Ex: 35.5 (35.5% do volume total)
}

export interface WeeklyReportTopExercise {
  id: string;               // UUID do exercício
  name: string;             // Ex: "Supino Reto"
  totalVolume: number;       // Ex: 3200 (volume total deste exercício)
}

export interface PRExercise {
  name: string;              // Ex: "Puxada Alta Máquina (Pulldown)"
  newMax: number;            // Ex: 70 (novo máximo em kg)
  improvement: number;        // Ex: 5 (quanto aumentou em kg)
  previousMax: number;       // Ex: 65 (máximo anterior em kg)
}

export interface WeeklyReportPRs {
  count: number;             // Ex: 3 (quantidade de PRs conquistados)
  exercises: PRExercise[];   // Array de exercícios com detalhes dos PRs
}

export interface WeeklyReportInsight {
  key: InsightKey;
  text: string;             // Ex: "Excelente consistência! Você manteve o ritmo esta semana."
}

export interface WeeklyReportDTO {
  period: WeeklyReportPeriod;
  frequency: WeeklyReportFrequency;
  volume: WeeklyReportVolume;
  muscleHighlight: WeeklyReportMuscleHighlight;
  topExercise: WeeklyReportTopExercise;
  prs: WeeklyReportPRs;
  insight: WeeklyReportInsight;
}

