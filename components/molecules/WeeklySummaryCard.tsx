import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react-native';
import type { WeeklyReportFrequency, WeeklyReportVolume, WeeklyReportPeriod } from '@/types/api';
import { colors } from '@/constants/colors';

export interface WeeklySummaryCardProps {
  period: WeeklyReportPeriod;
  frequency: WeeklyReportFrequency;
  volume: WeeklyReportVolume;
}

/**
 * Componente WeeklySummaryCard (Molecule)
 * Card que exibe o resumo da semana (frequência e volume)
 */
export default function WeeklySummaryCard({ 
  period, 
  frequency, 
  volume 
}: WeeklySummaryCardProps) {
  const formatVolume = (total: number): string => {
    const formatted = total.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatted;
  };

  const formatComparison = (percent: number): string => {
    const sign = percent >= 0 ? '+' : '';
    const formatted = percent.toFixed(1).replace('.', ',');
    return `${sign}${formatted}%`;
  };

  const getComparisonColor = (percent: number): string => {
    if (percent > 0) return colors.success;
    if (percent < 0) return colors.error;
    return colors.textSecondary;
  };

  const DAY_ABBREVIATIONS: { [key: string]: string } = {
    'Segunda': 'Seg',
    'Terça': 'Ter',
    'Quarta': 'Qua',
    'Quinta': 'Qui',
    'Sexta': 'Sex',
    'Sábado': 'Sáb',
    'Domingo': 'Dom',
  };

  const allDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const trainedDaysSet = new Set(frequency.daysOfWeek);

  return (
    <View style={styles.container}>
      {/* Período */}
      <View style={styles.periodSection}>
        <Calendar size={16} color={colors.primary} />
        <Text style={styles.periodText}>{period.label}</Text>
      </View>

      {/* Frequência */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Frequência</Text>
          <View style={styles.frequencyBadge}>
            <Text style={styles.frequencyBadgeText}>
              {frequency.daysTrained} {frequency.daysTrained === 1 ? 'dia' : 'dias'}
            </Text>
          </View>
        </View>
        
        <View style={styles.daysContainer}>
          {allDays.map((day) => {
            const isTrained = trainedDaysSet.has(day);
            return (
              <View key={day} style={styles.dayItem}>
                <View style={[
                  styles.dayCircle,
                  isTrained && styles.dayCircleActive
                ]}>
                  {isTrained && <View style={styles.dayDot} />}
                </View>
                <Text style={[
                  styles.dayLabel,
                  isTrained && styles.dayLabelActive
                ]}>
                  {DAY_ABBREVIATIONS[day] || day.substring(0, 3)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Volume */}
      <View style={[styles.section, styles.volumeSection]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Volume Total</Text>
        </View>
        
        <View style={styles.volumeContent}>
          <View style={styles.volumeContainer}>
            <Text style={styles.volumeValue}>{formatVolume(volume.total)}</Text>
            <Text style={styles.volumeUnit}>kg</Text>
          </View>

          <View style={styles.comparisonContainer}>
            {volume.comparisonPercent !== 0 && (
              volume.comparisonPercent > 0 ? (
                <TrendingUp size={14} color={colors.success} />
              ) : (
                <TrendingDown size={14} color={colors.error} />
              )
            )}
            <Text style={[
              styles.comparisonText,
              { color: getComparisonColor(volume.comparisonPercent) }
            ]}>
              {formatComparison(volume.comparisonPercent)} vs semana passada
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  volumeSection: {
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  frequencyBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  frequencyBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.textOnPrimary,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayItem: {
    alignItems: 'center',
    gap: 8,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleActive: {
    backgroundColor: 'rgba(59, 165, 93, 0.15)',
    borderColor: colors.success,
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  dayLabelActive: {
    color: colors.textPrimary,
    fontWeight: '600' as const,
  },
  volumeContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 20,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    justifyContent: 'center',
  },
  volumeValue: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: colors.primary,
    letterSpacing: -1.5,
  },
  volumeUnit: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  comparisonText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
});
