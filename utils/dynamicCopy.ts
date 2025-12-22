/**
 * Sistema de Copy Dinâmica para Relatório Semanal
 * Seleciona textos variados baseados em cenários para evitar repetição
 */

// Tipos de cenários
export type FrequencyScenario = 'FREQUENCY_HIGH' | 'FREQUENCY_LOW' | 'FREQUENCY_DEFAULT';
export type VolumeScenario = 'VOLUME_UP' | 'VOLUME_DOWN' | 'VOLUME_MAINTAINED';
export type PRScenario = 'HAS_PR' | 'NO_PR';

// Pool de copies por cenário
const OPENING_TITLES = [
  'Essa foi a sua semana na musculação',
  'Hora de ver sua evolução da semana',
  'Vamos falar sobre sua semana de treino',
];

const OPENING_SUBTITLES = [
  'Pequenas ações constroem grandes resultados',
  'Consistência sempre vence',
  'Vamos ver como você evoluiu 💥',
];

const FREQUENCY_HIGH_TITLES = [
  'Você manteve uma ótima consistência',
  'Sua frequência foi acima da média',
  'Excelente regularidade essa semana',
];

const FREQUENCY_HIGH_SUBTITLES = [
  'Treinar com regularidade faz toda a diferença',
  'Seu corpo agradece a constância',
  'Consistência é o caminho para resultados',
];

const FREQUENCY_LOW_TITLES = [
  'Mesmo com poucos dias, você apareceu',
  'Treinar menos também faz parte do processo',
  'Cada treino conta, não importa a quantidade',
];

const FREQUENCY_LOW_SUBTITLES = [
  'O importante é continuar',
  'Toda semana conta',
  'Pequenos passos também levam longe',
];

const VOLUME_UP_TITLES = [
  'Você aumentou seu volume total',
  'Mais carga movimentada essa semana',
  'Volume em alta essa semana',
];

const VOLUME_DOWN_TITLES = [
  'Seu volume foi menor essa semana',
  'Uma semana mais leve também constrói resultado',
  'Recuperação faz parte do processo',
];

const VOLUME_DOWN_SUBTITLES = [
  'Recuperação também é progresso',
  'Menos volume, mais qualidade',
  'O corpo precisa descansar para crescer',
];

const MUSCLE_FOCUS_TITLES = [
  '{{muscle}} foi o foco da sua semana',
  'Você deu atenção especial para {{muscle}}',
  '{{muscle}} receberam destaque essa semana',
];

const TOP_EXERCISE_TITLES = [
  '{{exercise}} foi seu exercício nº1',
  'Você mais se dedicou ao {{exercise}}',
  '{{exercise}} dominou sua semana',
];

const HAS_PR_TITLES = [
  'Você bateu {{count}} recordes pessoais 🎉',
  'Novos limites quebrados essa semana',
  '{{count}} PRs conquistados! Parabéns!',
];

const HAS_PR_SUBTITLES = [
  'Evolução real acontece assim',
  'Cada recorde é uma vitória',
  'Continue assim!',
];

const NO_PR_TITLES = [
  'Você manteve sua performance',
  'Constância também é progresso',
  'Consistência é a chave',
];

const NO_PR_SUBTITLES = [
  'O resultado vem com o tempo',
  'Nem toda semana precisa ter PR',
  'Construir base é fundamental',
];

/**
 * Seleciona um item aleatório de um array
 */
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Substitui placeholders em strings
 */
function replacePlaceholders(
  text: string,
  replacements: Record<string, string | number>
): string {
  let result = text;
  Object.entries(replacements).forEach(([key, value]) => {
    result = result.replace(`{{${key}}}`, String(value));
  });
  return result;
}

/**
 * Determina o cenário de frequência baseado nos dados
 */
export function getFrequencyScenario(
  daysTrained: number,
  status: string
): FrequencyScenario {
  if (daysTrained >= 5) return 'FREQUENCY_HIGH';
  if (daysTrained <= 2) return 'FREQUENCY_LOW';
  return 'FREQUENCY_DEFAULT';
}

/**
 * Determina o cenário de volume baseado nos dados
 */
export function getVolumeScenario(status: string): VolumeScenario {
  if (status === 'INCREASED') return 'VOLUME_UP';
  if (status === 'DECREASED') return 'VOLUME_DOWN';
  return 'VOLUME_MAINTAINED';
}

/**
 * Obtém copy para tela de abertura
 */
export function getOpeningCopy() {
  return {
    title: getRandomItem(OPENING_TITLES),
    subtitle: getRandomItem(OPENING_SUBTITLES),
  };
}

/**
 * Obtém copy para tela de frequência
 */
export function getFrequencyCopy(scenario: FrequencyScenario) {
  if (scenario === 'FREQUENCY_HIGH') {
    return {
      title: getRandomItem(FREQUENCY_HIGH_TITLES),
      subtitle: getRandomItem(FREQUENCY_HIGH_SUBTITLES),
    };
  }
  
  if (scenario === 'FREQUENCY_LOW') {
    return {
      title: getRandomItem(FREQUENCY_LOW_TITLES),
      subtitle: getRandomItem(FREQUENCY_LOW_SUBTITLES),
    };
  }

  // Default
  return {
    title: `Você treinou X dias essa semana`,
    subtitle: 'Cada treino importa',
  };
}

/**
 * Obtém copy para tela de volume
 */
export function getVolumeCopy(scenario: VolumeScenario, percent?: number) {
  if (scenario === 'VOLUME_UP') {
    return {
      title: getRandomItem(VOLUME_UP_TITLES),
      subtitle: percent ? `+${percent.toFixed(1)}% em relação à semana passada` : undefined,
    };
  }
  
  if (scenario === 'VOLUME_DOWN') {
    return {
      title: getRandomItem(VOLUME_DOWN_TITLES),
      subtitle: getRandomItem(VOLUME_DOWN_SUBTITLES),
    };
  }

  // Maintained
  return {
    title: 'Você moveu',
    subtitle: 'Volume consistente essa semana',
  };
}

/**
 * Obtém copy para tela de grupo muscular
 */
export function getMuscleHighlightCopy(muscle: string, percent: number) {
  const title = getRandomItem(MUSCLE_FOCUS_TITLES);
  return {
    title: replacePlaceholders(title, { muscle }),
    subtitle: `${percent.toFixed(1)}% do volume total`,
  };
}

/**
 * Obtém copy para tela de exercício top
 */
export function getTopExerciseCopy(exercise: string, volume: number) {
  const title = getRandomItem(TOP_EXERCISE_TITLES);
  return {
    title: replacePlaceholders(title, { exercise }),
    subtitle: `${volume.toLocaleString('pt-BR')} kg movimentados`,
  };
}

/**
 * Obtém copy para tela de PRs
 */
export function getPRsCopy(scenario: PRScenario, count?: number) {
  if (scenario === 'HAS_PR' && count !== undefined) {
    return {
      title: replacePlaceholders(getRandomItem(HAS_PR_TITLES), { count }),
      subtitle: getRandomItem(HAS_PR_SUBTITLES),
    };
  }

  return {
    title: getRandomItem(NO_PR_TITLES),
    subtitle: getRandomItem(NO_PR_SUBTITLES),
  };
}

