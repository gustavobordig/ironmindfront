/**
 * Story Color Map
 * 1 cor dominante por tela para evitar competição visual
 */

import { colors } from './colors';

export const storyColors = {
  opening: {
    primary: colors.primary,
    background: [colors.primary + '25', colors.background],
  },
  frequency: {
    primary: colors.success,
    background: [colors.success + '15', colors.background],
  },
  volume: {
    primary: colors.warning,
    background: [colors.warning + '15', colors.background],
  },
  muscle: {
    primary: colors.error,
    background: [colors.error + '15', colors.background],
  },
  exercise: {
    primary: colors.primaryLight,
    background: [colors.primaryLight + '15', colors.background],
  },
  prs: {
    primary: colors.warning,
    background: [colors.warning + '20', colors.background],
  },
  insight: {
    primary: colors.primaryDark,
    background: [colors.primaryDark + '20', colors.background],
  },
  final: {
    primary: colors.secondaryDark,
    background: [colors.secondaryDark + '40', colors.background],
  },
} as const;

export default storyColors;

