/**
 * Organism: Tela 1 - Abertura (Hook)
 * Estilo Stories: animações sequenciais e hierarquia temporal
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import StoryScreen from '@/components/organisms/StoryScreen';
import * as Haptics from 'expo-haptics';
import { storyColors } from '@/constants/storyColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { getOpeningCopy } from '@/utils/dynamicCopy';
import type { WeeklyReportDTO } from '@/types/weekly-report';

interface ReportOpeningScreenProps {
  report: WeeklyReportDTO;
  userName?: string;
}

export default function ReportOpeningScreen({ report, userName }: ReportOpeningScreenProps) {
  // Copy dinâmica
  const copy = getOpeningCopy();
  
  // Animações para entrada sequencial (450-600ms conforme guidelines)
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  
  const userNameOpacity = useRef(new Animated.Value(0)).current;
  const userNameScale = useRef(new Animated.Value(0.9)).current;
  
  const periodOpacity = useRef(new Animated.Value(0)).current;
  const periodScale = useRef(new Animated.Value(0.95)).current;

  // Easing: ease-out para entradas (conforme guidelines)
  const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

  useEffect(() => {
    // Haptic na abertura (Light impact)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Sequência de animações: título → subtítulo → nome → período
    Animated.sequence([
      // Título: slide-up + fade (0-500ms, ease-out)
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          easing: easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ]),
      // Subtítulo: fade-in (500-750ms)
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 250,
          easing: easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: 250,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ]),
      // Nome: destaque de cor (750-950ms)
      userName ? Animated.parallel([
        Animated.timing(userNameOpacity, {
          toValue: 1,
          duration: 200,
          easing: easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(userNameScale, {
          toValue: 1,
          duration: 200,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ]) : Animated.delay(0),
      // Período: scale leve (950-1150ms)
      Animated.parallel([
        Animated.timing(periodOpacity, {
          toValue: 1,
          duration: 200,
          easing: easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(periodScale, {
          toValue: 1,
          duration: 200,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <StoryScreen gradientColors={[...storyColors.opening.background]}>
      <View style={styles.content}>
        {/* Título - mais alto, entrada primeiro */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text 
            style={typography.titleMain}
            numberOfLines={3}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {copy.title}
          </Text>
        </Animated.View>

        {/* Subtítulo - próximo ao título */}
        <Animated.View
          style={[
            styles.subtitleContainer,
            {
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleTranslateY }],
            },
          ]}
        >
          <Text 
            style={typography.context}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {copy.subtitle}
          </Text>
        </Animated.View>

        {/* Nome do usuário - reforço de personalização */}
        {userName && (
          <Animated.View
            style={[
              styles.userNameContainer,
              {
                opacity: userNameOpacity,
                transform: [{ scale: userNameScale }],
              },
            ]}
          >
            <Text 
              style={styles.userName}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {userName}
            </Text>
          </Animated.View>
        )}

        {/* Período - rodapé, aparece por último */}
        <Animated.View
          style={[
            styles.periodContainer,
            {
              opacity: periodOpacity,
              transform: [{ scale: periodScale }],
            },
          ]}
        >
          <Text 
            style={styles.periodText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {report.period.label}
          </Text>
        </Animated.View>
      </View>
    </StoryScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  titleContainer: {
    width: '100%',
    maxWidth: '100%',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  subtitleContainer: {
    width: '100%',
    maxWidth: '100%',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  userNameContainer: {
    marginTop: 'auto',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    maxWidth: '100%',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: storyColors.opening.primary,
    textAlign: 'center',
  },
  periodContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(30, 31, 34, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: storyColors.opening.primary + '30',
    maxWidth: '90%',
  },
  periodText: {
    ...typography.auxiliary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

