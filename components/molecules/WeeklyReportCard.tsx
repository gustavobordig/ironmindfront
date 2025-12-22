/**
 * Componente Molecule: Card de Relatório Semanal
 * Card que aparece no dashboard para acessar o relatório
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { TrendingUp, Calendar } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface WeeklyReportCardProps {
  onPress: () => void;
  periodLabel?: string;
}

export default function WeeklyReportCard({ onPress, periodLabel }: WeeklyReportCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <TrendingUp size={24} color={colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Relatório Semanal</Text>
          <Text style={styles.subtitle}>
            {periodLabel || 'Veja seu progresso da semana'}
          </Text>
        </View>
        <Calendar size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

