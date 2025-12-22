/**
 * Organism: Tela 5 - Exercício da Semana
 * Hierarquia: 1 métrica principal (volume) → contexto → visual auxiliar
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import StoryScreen from '@/components/organisms/StoryScreen';
import { storyColors } from '@/constants/storyColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { SimpleAnimatedNumber } from '@/components/atoms/AnimatedNumber';
import { getTopExerciseCopy } from '@/utils/dynamicCopy';
import type { WeeklyReportDTO } from '@/types/weekly-report';

interface ReportTopExerciseScreenProps {
  report: WeeklyReportDTO;
  isVisible?: boolean;
}

export default function ReportTopExerciseScreen({ report, isVisible = false }: ReportTopExerciseScreenProps) {
  // Copy dinâmica
  const copy = getTopExerciseCopy(
    report.topExercise.name,
    report.topExercise.totalVolume
  );

  const formatVolume = (value: number) => {
    return value.toLocaleString('pt-BR');
  };

  // Animação da métrica principal
  const metricOpacity = useRef(new Animated.Value(0)).current;
  const metricScale = useRef(new Animated.Value(0.95)).current;
  const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(metricOpacity, {
        toValue: 1,
        duration: 700,
        delay: 200,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(metricScale, {
        toValue: 1,
        duration: 700,
        delay: 200,
        easing: easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <StoryScreen gradientColors={[...storyColors.exercise.background]}>
      <View style={styles.content}>
        {/* Badge de destaque - Exercício Top */}
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>🏆 Melhor exercício da Semana</Text>
        </View>

        {/* Nome do exercício - destaque */}
        <Text 
          style={[typography.titleMain, styles.exerciseName]}
          numberOfLines={3}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {report.topExercise.name}
        </Text>
        
        {/* 1. MÉTRICA PRINCIPAL - volume */}
        <Animated.View
          style={[
            styles.metricContainer,
            {
              opacity: metricOpacity,
              transform: [{ scale: metricScale }],
            },
          ]}
        >
          <SimpleAnimatedNumber
            value={report.topExercise.totalVolume}
            formatter={formatVolume}
            style={[typography.metricMain, { color: storyColors.exercise.primary }]}
            triggerAnimation={isVisible}
          />
          <Text style={typography.unit}>kg</Text>
        </Animated.View>

        {/* Visual auxiliar - reduzido */}
        <View style={styles.auxiliaryContainer}>
          <Text 
            style={[typography.auxiliary, { textAlign: 'center' }]}
            numberOfLines={2}
          >
            {copy.subtitle}
          </Text>
        </View>
      </View>
    </StoryScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
    flexShrink: 1,
    gap: spacing.md,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badgeContainer: {
    backgroundColor: storyColors.exercise.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: storyColors.exercise.primary + '40',
    marginBottom: spacing.xs,
    maxWidth: '90%',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: storyColors.exercise.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  exerciseName: {
    marginBottom: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
    flexShrink: 1,
    maxWidth: '100%',
  },
  metricContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginVertical: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  auxiliaryContainer: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    maxWidth: '90%',
  },
});

