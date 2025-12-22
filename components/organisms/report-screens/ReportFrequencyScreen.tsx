/**
 * Organism: Tela 2 - Frequência & Consistência
 * Hierarquia: 1 métrica principal (dias) → contexto → visual auxiliar (calendário)
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import StoryScreen from '@/components/organisms/StoryScreen';
import { storyColors } from '@/constants/storyColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import WeeklyCalendar from '@/components/molecules/WeeklyCalendar';
import { SimpleAnimatedNumber } from '@/components/atoms/AnimatedNumber';
import { getFrequencyCopy, getFrequencyScenario } from '@/utils/dynamicCopy';
import type { WeeklyReportDTO } from '@/types/weekly-report';

interface ReportFrequencyScreenProps {
  report: WeeklyReportDTO;
  isVisible?: boolean;
}

export default function ReportFrequencyScreen({ report, isVisible = false }: ReportFrequencyScreenProps) {
  const startDate = new Date(report.period.startDate);
  
  // Copy dinâmica baseada em cenário
  const scenario = getFrequencyScenario(
    report.frequency.daysTrained,
    report.frequency.status
  );
  const copy = getFrequencyCopy(scenario);
  
  // Usar dias reais da API ou calcular fallback
  const trainedDays: number[] = React.useMemo(() => {
    if (report.frequency.daysOfWeek && report.frequency.daysOfWeek.length > 0) {
      // Mapear nomes de dias para índices JavaScript
      const dayMapping: Record<string, number> = {
        'Domingo': 0,
        'Segunda': 1,
        'Terça': 2,
        'Quarta': 3,
        'Quinta': 4,
        'Sexta': 5,
        'Sábado': 6,
      };
      return report.frequency.daysOfWeek
        .map(day => dayMapping[day])
        .filter(index => index !== undefined);
    }
    
    // Fallback: priorizar dias úteis
    const preferredDays = [1, 2, 3, 4, 5, 6, 0]; // Segunda a Domingo
    const days: number[] = [];
    for (let i = 0; i < Math.min(report.frequency.daysTrained, 7); i++) {
      days.push(preferredDays[i]);
    }
    return days;
  }, [report.frequency.daysOfWeek, report.frequency.daysTrained]);

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
    <StoryScreen gradientColors={[...storyColors.frequency.background]}>
      <View style={styles.content}>
        {/* Contexto curto */}
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
        
        {/* 1. MÉTRICA PRINCIPAL - dias treinados */}
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
            value={report.frequency.daysTrained}
            style={[typography.metricMain, { color: storyColors.frequency.primary }]}
            triggerAnimation={isVisible}
          />
          <Text style={typography.auxiliary}>dias</Text>
        </Animated.View>

        {/* Visual auxiliar - calendário como apoio */}
        <View style={styles.auxiliaryContainer}>
          <WeeklyCalendar startDate={startDate} trainedDays={trainedDays} />
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
    gap: spacing.lg, // Espaçamento dobrado
  },
  metricContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  auxiliaryContainer: {
    marginTop: spacing.md,
    width: '100%',
    opacity: 0.7, // Reduzir contraste do visual auxiliar
  },
});

