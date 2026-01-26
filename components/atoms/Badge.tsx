import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '@/constants/colors';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error';
}

/**
 * Componente Badge (Atom)
 * Exibe um distintivo com texto
 * 
 * @param label - Texto do badge
 * @param variant - Variante de cor (primary, success, warning, error)
 */
export default function Badge({ label, variant = 'primary' }: BadgeProps) {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.textOnPrimary,
  },
});
