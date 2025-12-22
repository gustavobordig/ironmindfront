/**
 * Organism: Tela 7 - Insight Inteligente
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import type { WeeklyReportDTO } from '@/types/weekly-report';

interface ReportInsightScreenProps {
  report: WeeklyReportDTO;
}

export default function ReportInsightScreen({ report }: ReportInsightScreenProps) {
  const [displayedText, setDisplayedText] = useState('');
  const words = report.insight.text.split(' ');

  // Animações (450-600ms)
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const containerTranslateY = useRef(new Animated.Value(20)).current;
  const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

  useEffect(() => {
    // Haptic: Soft tick (conforme guidelines)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animação de entrada
    Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 500,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(containerTranslateY, {
        toValue: 0,
        duration: 500,
        easing: easeOut,
        useNativeDriver: true,
      }),
    ]).start();

    // Animação de texto digitando
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setDisplayedText(words.slice(0, currentIndex + 1).join(' '));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <LinearGradient
      colors={[colors.primaryDark + '20', colors.background]}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: containerOpacity,
            transform: [{ translateY: containerTranslateY }],
          },
        ]}
      >
        <Text 
          style={styles.mainText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          Insight da Semana
        </Text>
        
        <View style={styles.insightContainer}>
          <Text 
            style={styles.insightText}
            numberOfLines={10}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {displayedText}
            {displayedText.length < report.insight.text.length && (
              <Text style={styles.cursor}>|</Text>
            )}
          </Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  content: {
    alignItems: 'center',
    gap: spacing.lg,
    width: '100%',
    maxWidth: '100%',
    flex: 1,
    justifyContent: 'center',
  },
  mainText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  insightContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
  },
  insightText: {
    fontSize: 18,
    lineHeight: 28,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  cursor: {
    color: colors.primary,
    fontWeight: '700',
  },
});

