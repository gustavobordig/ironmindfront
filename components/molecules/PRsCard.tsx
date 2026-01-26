import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Dimensions } from 'react-native';
import { ChevronRight, TrendingUp } from 'lucide-react-native';
import type { WeeklyReportPRs, WeeklyReportPR } from '@/types/api';
import { colors } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = SCREEN_WIDTH - 60; // Largura do modal
const CONTAINER_PADDING = 16; // Padding interno do container
const GAP = 8; // Espaço entre cards (reduzido)
// Cálculo: MODAL_WIDTH - (container padding * 2) - (2 gaps entre 3 colunas) / 3
// O container tem marginHorizontal: -16 para compensar parte do padding do storyScrollView (24)
const CARD_WIDTH = (MODAL_WIDTH - 16 - (CONTAINER_PADDING * 2) - (GAP * 2)) / 3; // 3 colunas para mostrar mais itens

export interface PRsCardProps {
  prs: WeeklyReportPRs;
  onViewAll?: () => void;
}

/**
 * Componente PRsCard (Molecule)
 * Card que exibe os PRs batidos na semana - mostra múltiplos PRs simultaneamente
 */
export default function PRsCard({ prs, onViewAll }: PRsCardProps) {
  const formatWeight = (weight: number): string => {
    return weight.toFixed(1).replace('.', ',');
  };

  const formatImprovement = (improvement: number): string => {
    const sign = improvement >= 0 ? '+' : '';
    const formatted = improvement.toFixed(1).replace('.', ',');
    return `${sign}${formatted} kg`;
  };

  // Usar todos os PRs disponíveis (exercises), ou pelo menos o highlight
  const prsToShow = prs.exercises && prs.exercises.length > 0 
    ? prs.exercises 
    : [prs.highlight];

  return (
    <View style={styles.container}>
      {/* Grid de Cards de PRs com Scroll */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {prsToShow.map((pr, index) => (
          <View key={index} style={styles.prCard}>
            {/* Nome do exercício */}
            <Text style={styles.prCardExercise} numberOfLines={2}>
              {pr.name}
            </Text>
            
            {/* Informações principais */}
            <View style={styles.prCardContent}>
              {/* Anterior */}
              <View style={styles.prCardInfo}>
                <Text style={styles.prCardLabel}>Anterior</Text>
                <Text style={styles.prCardValue}>
                  {formatWeight(pr.previousMax)} <Text style={styles.prCardUnit}>kg</Text>
                </Text>
              </View>

              {/* Novo PR */}
              <View style={[styles.prCardInfo, styles.prCardInfoNew]}>
                <Text style={styles.prCardLabel}>Novo PR</Text>
                <View style={styles.prCardNewPRBadge}>
                  <Text style={styles.prCardNewPRText}>
                    {formatWeight(pr.newMax)} <Text style={styles.prCardNewPRUnit}>kg</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Melhoria */}
            <View style={styles.prCardImprovement}>
              <TrendingUp size={14} color={colors.success} />
              <Text style={styles.prCardImprovementText}>
                {formatImprovement(pr.improvement)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {onViewAll && prs.count > prsToShow.length && (
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={onViewAll}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>Ver todos os PRs</Text>
          <ChevronRight size={16} color={colors.textPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    marginHorizontal: -16, // Compensar padding do storyScrollView
  },
  scrollContainer: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  prCard: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 8,
    gap: 6,
  },
  prCardExercise: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    lineHeight: 15,
    marginBottom: 2,
  },
  prCardContent: {
    gap: 6,
  },
  prCardInfo: {
    gap: 2,
  },
  prCardInfoNew: {
    marginTop: 2,
  },
  prCardLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    opacity: 0.7,
  },
  prCardValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  prCardUnit: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    opacity: 0.8,
  },
  prCardNewPRBadge: {
    backgroundColor: 'rgba(255, 130, 37, 0.15)',
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    alignSelf: 'flex-start',
  },
  prCardNewPRText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  prCardNewPRUnit: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.primary,
    opacity: 0.9,
  },
  prCardImprovement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 165, 93, 0.15)',
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.success,
    marginTop: 2,
  },
  prCardImprovementText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.success,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
});
