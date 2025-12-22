/**
 * Organism: Tela 4 - Grupo Muscular em Destaque
 * Hierarquia: 1 métrica principal (percentual) → contexto → visual auxiliar
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import StoryScreen from '@/components/organisms/StoryScreen';
import { storyColors } from '@/constants/storyColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import DailyVolumeBarChart from '@/components/molecules/DailyVolumeBarChart';
import { AnimatedDecimalNumber } from '@/components/atoms/AnimatedNumber';
import { getMuscleHighlightCopy } from '@/utils/dynamicCopy';
import { calculateMuscleGroupDailyVolumes } from '@/utils/volumeDistribution';
import type { WeeklyReportDTO } from '@/types/weekly-report';

interface ReportMuscleHighlightScreenProps {
  report: WeeklyReportDTO;
  isVisible?: boolean;
}

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

export default function ReportMuscleHighlightScreen({ report, isVisible = false }: ReportMuscleHighlightScreenProps) {
  const muscleLabel = MUSCLE_GROUP_LABELS[report.muscleHighlight.muscleGroup] || report.muscleHighlight.muscleGroup;
  
  // Copy dinâmica
  const copy = getMuscleHighlightCopy(muscleLabel, report.muscleHighlight.percentOfTotal);

  // Calcular volumes diários do grupo muscular
  const dailyVolumes = useMemo(() => {
    return calculateMuscleGroupDailyVolumes(
      report.volume.total,
      report.muscleHighlight.percentOfTotal,
      report.frequency.daysTrained,
      report.period.startDate,
      report.frequency.daysOfWeek
    );
  }, [
    report.volume.total,
    report.muscleHighlight.percentOfTotal,
    report.frequency.daysTrained,
    report.period.startDate,
    report.frequency.daysOfWeek,
  ]);

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
    <StoryScreen gradientColors={[...storyColors.muscle.background]}>
      <View style={styles.content}>
        {/* Contexto curto */}
        <Text 
          style={typography.context}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {copy.title}
        </Text>
        
        {/* 1. MÉTRICA PRINCIPAL - percentual animado */}
        <Animated.View
          style={[
            styles.metricContainer,
            {
              opacity: metricOpacity,
              transform: [{ scale: metricScale }],
            },
          ]}
        >
          <AnimatedDecimalNumber
            value={report.muscleHighlight.percentOfTotal}
            duration={700}
            decimals={1}
            suffix="%"
            style={[typography.metricMain, { color: storyColors.muscle.primary }]}
            triggerAnimation={isVisible}
          />
        </Animated.View>

        {/* Visual auxiliar - reduzido */}
        <View style={styles.auxiliaryContainer}>
          <Text style={typography.auxiliary}>{copy.subtitle}</Text>
        </View>

        {/* Gráfico de barras - volume diário do grupo muscular */}
        <View style={styles.chartContainer}>
          <DailyVolumeBarChart
            dailyVolumes={dailyVolumes}
            color={storyColors.muscle.primary}
            startDate={report.period.startDate}
            delay={1000} // 200ms (contexto) + 700ms (número) + 100ms = 1000ms total
          />
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
    gap: spacing.lg,
  },
  metricContainer: {
    marginVertical: spacing.md,
  },
  auxiliaryContainer: {
    marginTop: spacing.md,
  },
  chartContainer: {
    width: '100%',
    maxWidth: '100%',
    marginTop: spacing.lg,
    alignItems: 'center',
    flexShrink: 1,
  },
});

