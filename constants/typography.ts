/**
 * Sistema Tipográfico para Stories
 * Hierarquia clara: métrica principal → contexto → auxiliar
 */

import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const typography = {
  // Métrica Principal - o que o olho vê primeiro
  metricMain: {
    fontSize: 72,
    fontWeight: '700' as const,
    color: colors.primary,
    textAlign: 'center' as const,
    lineHeight: 84,
  },
  
  // Métrica Secundária (números médios)
  metricSecondary: {
    fontSize: 56,
    fontWeight: '700' as const,
    color: colors.primary,
    textAlign: 'center' as const,
    lineHeight: 64,
  },
  
  // Título Principal
  titleMain: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    textAlign: 'center' as const,
    lineHeight: 40,
  },
  
  // Contexto Curto (subtítulo)
  context: {
    fontSize: 18,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 26,
  },
  
  // Texto Auxiliar (menor contraste)
  auxiliary: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary + 'CC',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  
  // Unidade (kg, %, etc)
  unit: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
} as const;

export default typography;

