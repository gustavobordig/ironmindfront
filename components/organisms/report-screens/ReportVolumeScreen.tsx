/**
 * Organism: Tela 3 - Volume Total (Hipertrofia)
 * Hierarquia: 1 métrica principal (volume) → contexto → visual auxiliar
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import StoryScreen from '@/components/organisms/StoryScreen';
import { storyColors } from '@/constants/storyColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { SimpleAnimatedNumber } from '@/components/atoms/AnimatedNumber';
import DailyVolumeChart from '@/components/molecules/DailyVolumeChart';
import { getVolumeCopy, getVolumeScenario } from '@/utils/dynamicCopy';
import { calculateDailyVolumes } from '@/utils/volumeDistribution';
import type { WeeklyReportDTO } from '@/types/weekly-report';

interface ReportVolumeScreenProps {
  report: WeeklyReportDTO;
  isVisible?: boolean;
}

export default function ReportVolumeScreen({ report, isVisible = false }: ReportVolumeScreenProps) {
  // Copy dinâmica baseada em cenário
  const scenario = getVolumeScenario(report.volume.status);
  const copy = getVolumeCopy(scenario, report.volume.comparisonPercent);

  // Calcular volumes diários usando os dias reais da API
  const dailyVolumes = useMemo(() => {
    return calculateDailyVolumes(
      report.volume.total,
      report.frequency.daysTrained,
      report.period.startDate,
      report.frequency.daysOfWeek // Usar dias reais da API
    );
  }, [report.volume.total, report.frequency.daysTrained, report.period.startDate, report.frequency.daysOfWeek]);

  const formatVolume = (value: number) => {
    return value.toLocaleString('pt-BR');
  };

  // Animação da métrica principal (600-800ms)
  const metricOpacity = useRef(new Animated.Value(0)).current;
  const metricScale = useRef(new Animated.Value(0.95)).current;
  const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

  useEffect(() => {
    // Delay para aparecer após o contexto (coreografia: fundo → métrica → complemento)
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
    <StoryScreen gradientColors={[...storyColors.volume.background]}>
      <View style={styles.content}>
        {/* Contexto curto - aparece primeiro */}
        {copy.subtitle && (
          <Text 
            style={typography.context}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {copy.subtitle}
          </Text>
        )}
        
        {/* 1. MÉTRICA PRINCIPAL - protagonismo total */}
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
            value={report.volume.total}
            formatter={formatVolume}
            style={[typography.metricMain, { color: storyColors.volume.primary }]}
            triggerAnimation={isVisible}
          />
          <Text style={typography.unit}>kg</Text>
        </Animated.View>

        {/* Visual auxiliar - menor contraste */}
        <View style={styles.auxiliaryContainer}>
          <Text style={typography.auxiliary}>{copy.title}</Text>
        </View>

        {/* Gráfico de linha - volume diário (entra após o número, delay 300-400ms) */}
        <View style={styles.chartContainer}>
          <DailyVolumeChart
            dailyVolumes={dailyVolumes}
            color={storyColors.volume.primary}
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
    gap: spacing.lg, // Espaçamento dobrado (64px)
  },
  metricContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
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

