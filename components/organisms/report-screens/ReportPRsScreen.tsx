/**
 * Organism: Tela 6 - Progressão & PRs
 * Hierarquia: 1 métrica principal (count) → contexto → visual auxiliar
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import StoryScreen from '@/components/organisms/StoryScreen';
import { storyColors } from '@/constants/storyColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { colors } from '@/constants/colors';
import { SimpleAnimatedNumber } from '@/components/atoms/AnimatedNumber';
import * as Haptics from 'expo-haptics';
import { getPRsCopy } from '@/utils/dynamicCopy';
import type { WeeklyReportDTO } from '@/types/weekly-report';

interface ReportPRsScreenProps {
  report: WeeklyReportDTO;
  isVisible?: boolean;
}

export default function ReportPRsScreen({ report, isVisible = false }: ReportPRsScreenProps) {
  const hasPRs = report.prs.count > 0;
  const scenario = hasPRs ? 'HAS_PR' : 'NO_PR';
  
  // Copy dinâmica
  const copy = getPRsCopy(scenario, report.prs.count);

  // Animação da métrica principal
  const metricOpacity = useRef(new Animated.Value(0)).current;
  const metricScale = useRef(new Animated.Value(0.95)).current;
  const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

  useEffect(() => {
    if (hasPRs) {
      // Haptic: Success notification (conforme guidelines)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

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
  }, [hasPRs]);

  return (
    <StoryScreen 
      gradientColors={hasPRs ? [...storyColors.prs.background] : [storyColors.prs.background[0] + '10', storyColors.prs.background[1]]}
    >
      <View style={styles.content}>
        {/* Contexto curto */}
        {copy.subtitle && (
          <Text 
            style={[typography.context, styles.subtitle]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {copy.subtitle}
          </Text>
        )}
        
        {/* 1. MÉTRICA PRINCIPAL - quantidade de PRs */}
        {hasPRs ? (
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
              value={report.prs.count}
              style={[typography.metricMain, { color: storyColors.prs.primary }]}
              triggerAnimation={isVisible}
            />
            <Text style={typography.auxiliary}>PRs</Text>
          </Animated.View>
        ) : (
          <Text 
            style={typography.titleMain}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {copy.title}
          </Text>
        )}

        {/* Lista de exercícios com PRs - destacada com scroll */}
        {hasPRs && report.prs.exercises.length > 0 && (
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.exercisesContainer}>
              {report.prs.exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseCard}>
                  <Text style={styles.exerciseName} numberOfLines={2}>
                    {exercise.name}
                  </Text>
                  <View style={styles.weightContainer}>
                    <View style={styles.weightInfo}>
                      <Text style={styles.weightLabel}>Anterior</Text>
                      <Text style={styles.previousWeight}>
                        {exercise.previousMax.toLocaleString('pt-BR')} kg
                      </Text>
                    </View>
                    <View style={styles.arrowContainer}>
                      <Text style={styles.arrow}>→</Text>
                      <Text style={styles.improvement}>
                        +{exercise.improvement.toLocaleString('pt-BR')} kg
                      </Text>
                    </View>
                    <View style={styles.weightInfo}>
                      <Text style={styles.weightLabel}>Novo PR</Text>
                      <Text style={styles.newWeight}>
                        {exercise.newMax.toLocaleString('pt-BR')} kg
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
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
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  metricContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
    minHeight: 350,
    maxHeight: '70%',
  },
  scrollContent: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.xs,
  },
  exercisesContainer: {
    width: '100%',
    maxWidth: '100%',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  exerciseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: storyColors.prs.primary + '40',
    shadowColor: storyColors.prs.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  weightInfo: {
    alignItems: 'center',
    flex: 1,
    minWidth: 80,
  },
  weightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    opacity: 0.8,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previousWeight: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textSecondary,
    opacity: 0.9,
  },
  newWeight: {
    fontSize: 24,
    fontWeight: '800',
    color: storyColors.prs.primary,
    textShadowColor: storyColors.prs.primary + '40',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  arrowContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    minWidth: 60,
  },
  arrow: {
    fontSize: 24,
    color: storyColors.prs.primary,
    opacity: 0.7,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  improvement: {
    fontSize: 16,
    fontWeight: '800',
    color: storyColors.prs.primary,
    textShadowColor: storyColors.prs.primary + '30',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

