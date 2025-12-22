/**
 * Utilitário para mapear nomes de dias da semana para índices JavaScript
 */

const DAY_NAME_TO_INDEX: Record<string, number> = {
  'Domingo': 0,
  'Segunda': 1,
  'Terça': 2,
  'Quarta': 3,
  'Quinta': 4,
  'Sexta': 5,
  'Sábado': 6,
};

/**
 * Converte array de nomes de dias (ex: ["Segunda", "Terça"]) para índices JavaScript (ex: [1, 2])
 */
export function mapDayNamesToIndices(dayNames: string[]): number[] {
  return dayNames
    .map(name => DAY_NAME_TO_INDEX[name])
    .filter(index => index !== undefined);
}

/**
 * Converte nome do dia para índice JavaScript
 */
export function dayNameToIndex(dayName: string): number {
  return DAY_NAME_TO_INDEX[dayName] ?? -1;
}

