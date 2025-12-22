/**
 * Componente Atom: Badge de Comparação
 * Mostra se aumentou, manteve ou diminuiu em relação à semana anterior
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import type { ComparisonStatus } from '@/types/weekly-report';

interface ComparisonBadgeProps {
  percent: number;
  status: ComparisonStatus;
}

export default function ComparisonBadge({ percent, status }: ComparisonBadgeProps) {
  const sign = percent > 0 ? '+' : '';
  const formattedPercent = `${sign}${percent.toFixed(1)}%`;

  const getStatusColor = () => {
    switch (status) {
      case 'INCREASED':
        return colors.success;
      case 'MAINTAINED':
        return colors.textSecondary;
      case 'DECREASED':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getStatusColor() + '20' }]}>
      <Text style={[styles.text, { color: getStatusColor() }]}>
        {formattedPercent} vs semana anterior
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});

