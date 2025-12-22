/**
 * Organism: Modal de Entrada do Relatório
 * Aparece na primeira abertura do app da semana
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

interface WeeklyReportModalProps {
  visible: boolean;
  onViewNow: () => void;
  onViewLater: () => void;
}

export default function WeeklyReportModal({
  visible,
  onViewNow,
  onViewLater,
}: WeeklyReportModalProps) {
  const handleViewNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewNow();
  };

  const handleViewLater = () => {
    onViewLater();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onViewLater}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={[colors.primary + '40', colors.background]}
          style={styles.container}
        >
          <View style={styles.content}>
            <Text style={styles.emoji}>💪</Text>
            <Text style={styles.title}>Seu resumo da semana está pronto</Text>
            <Text style={styles.subtitle}>
              Veja como você evoluiu esta semana
            </Text>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleViewNow}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Ver agora</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleViewLater}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Ver depois</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.textSecondary + '40',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

