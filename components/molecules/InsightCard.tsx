import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Lightbulb, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import type { WeeklyReportInsight, WeeklyReportChallenge } from '@/types/api';
import { colors } from '@/constants/colors';

export interface InsightCardProps {
  insight: WeeklyReportInsight;
  challenge: WeeklyReportChallenge;
}

/**
 * Componente InsightCard (Molecule)
 * Card que exibe o insight da semana e desafio
 */
export default function InsightCard({ insight, challenge }: InsightCardProps) {
  const handleCTAPress = () => {
    if (challenge.cta === 'SET_GOAL') {
      router.push('/create-goal');
    }
    // Adicionar outras ações conforme necessário
  };

  const getCTAText = (): string => {
    switch (challenge.cta) {
      case 'SET_GOAL':
        return 'Definir nova meta';
      case 'INCREASE_FREQUENCY':
        return 'Aumentar frequência';
      case 'MAINTAIN_CONSISTENCY':
        return 'Manter consistência';
      default:
        return 'Ação';
    }
  };

  return (
    <View style={styles.container}>
      {/* Card de Insight */}
      <View style={styles.insightCard}>
        <View style={styles.insightHeader}>
          <View style={styles.iconContainer}>
            <Lightbulb size={20} color={colors.primary} />
          </View>
        </View>
        
        <Text style={styles.insightText}>{insight.text}</Text>
      </View>

      {/* Card de Desafio/CTA */}
      <View style={styles.challengeCard}>
        <Text style={styles.challengeTitle}>Próximo Passo</Text>
        <Text style={styles.challengeText}>
          {challenge.reason === 'LOW_FREQUENCY' && 'Aumente sua frequência de treinos para ver mais resultados.'}
          {challenge.reason === 'FREQUENT_PRS' && 'Você está batendo muitos PRs! Continue assim!'}
          {challenge.reason === 'INCONSISTENT' && 'Mantenha a consistência nos treinos para melhores resultados.'}
          {!challenge.reason && 'Continue evoluindo!'}
        </Text>
        
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleCTAPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
        >
          <Text style={styles.ctaButtonText}>{getCTAText()}</Text>
          <ArrowRight size={18} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    zIndex: 15,
    elevation: 15,
  },
  insightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 130, 37, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 130, 37, 0.3)',
  },
  insightText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  challengeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  challengeText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 20,
    elevation: 20,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textOnPrimary,
  },
});
