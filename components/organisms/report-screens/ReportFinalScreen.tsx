/**
 * Organism: Tela 8 - Encerramento + CTA
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Download, Share2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

interface ReportFinalScreenProps {
  onPlanWorkouts?: () => void;
  onDownloadStats?: () => void;
  onShare?: () => void;
}

export default function ReportFinalScreen({
  onPlanWorkouts,
  onDownloadStats,
  onShare,
}: ReportFinalScreenProps) {
  // Animações (450-600ms)
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(20)).current;
  const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

  useEffect(() => {
    // Haptic: Light impact (conforme guidelines)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 500,
        easing: easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={[colors.secondaryDark + '40', colors.background]}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
        <Text 
          style={styles.mainText}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          Pronto para a próxima semana?
        </Text>
        
        <View style={styles.actionsContainer}>
          {onPlanWorkouts && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onPlanWorkouts}
              activeOpacity={0.8}
            >
              <Plus size={24} color={colors.textPrimary} />
              <Text 
                style={styles.actionText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Planejar próximos treinos
              </Text>
            </TouchableOpacity>
          )}

          {onDownloadStats && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onDownloadStats}
              activeOpacity={0.8}
            >
              <Download size={24} color={colors.textPrimary} />
              <Text 
                style={styles.actionText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Baixar estatísticas
              </Text>
            </TouchableOpacity>
          )}

          {/* {onShare && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onShare}
              activeOpacity={0.8}
            >
              <Share2 size={24} color={colors.textPrimary} />
              <Text 
                style={styles.actionText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Compartilhar relatório
              </Text>
            </TouchableOpacity>
          )} */}
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
    paddingHorizontal: spacing.sm,
  },
  mainText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  actionsContainer: {
    gap: spacing.md,
    width: '100%',
    maxWidth: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary + '40',
    flexShrink: 1,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  proBadge: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
  },
  proText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
  },
});

