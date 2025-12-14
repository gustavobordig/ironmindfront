import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, X, AlertCircle, Clock, Dumbbell } from 'lucide-react-native';
import { router, useSegments } from 'expo-router';
import { colors } from '@/constants/colors';
import { useWorkout } from '@/contexts/WorkoutContext';

export default function ActiveWorkoutBanner() {
  const { activeWorkout, cancelWorkout } = useWorkout();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Não mostrar se não houver treino ativo
  if (!activeWorkout) {
    return null;
  }

  // Não mostrar na tela de workout
  const isOnWorkoutScreen = segments.some(segment => segment === 'workout');
  if (isOnWorkoutScreen) {
    return null;
  }

  const handleContinue = () => {
    router.push('/workout');
  };

  const handleDiscard = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelWorkout();
      setShowCancelModal(false);
    } catch (error: any) {
      console.error('Erro ao cancelar treino:', error);
      // Mostrar erro se necessário
    } finally {
      setIsCancelling(false);
    }
  };

  const dismissModal = () => {
    setShowCancelModal(false);
  };

  // Altura padrão da tab bar do Expo Router é 49px
  const TAB_BAR_HEIGHT = 0;
  
  return (
    <>
      <View style={[styles.banner, { bottom: insets.bottom + TAB_BAR_HEIGHT }]}>
        <View style={styles.bannerContent}>
          <TouchableOpacity
            style={styles.bannerInfo}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <View style={styles.bannerIconContainer}>
              <Dumbbell size={20} color={colors.textOnPrimary} />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerName} numberOfLines={1}>
                {activeWorkout.name}
              </Text>
              <View style={styles.bannerMeta}>
                <Clock size={12} color={colors.textSecondary} />
                <Text style={styles.bannerLabel}>Treino em andamento</Text>
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.bannerActions}>
            <TouchableOpacity
              style={styles.bannerButton}
              onPress={handleContinue}
              activeOpacity={0.7}
            >
              <Play size={18} color={colors.textOnPrimary} fill={colors.textOnPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bannerDiscardButton}
              onPress={handleDiscard}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal de confirmação de descarte */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={dismissModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={dismissModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <AlertCircle size={32} color={colors.error} />
              </View>
              <Text style={styles.modalTitle}>Descartar Treino</Text>
              <Text style={styles.modalMessage}>
                Deseja descartar o treino "{activeWorkout.name}"?
                {'\n\n'}
                Todos os dados serão perdidos e esta ação não pode ser desfeita.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={dismissModal}
                disabled={isCancelling}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  isCancelling && styles.modalButtonDisabled,
                ]}
                onPress={confirmCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <View style={styles.modalButtonLoading}>
                    <ActivityIndicator size="small" color={colors.textOnPrimary} />
                    <Text style={styles.modalButtonConfirmText}>Descartando...</Text>
                  </View>
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Descartar</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  bannerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  bannerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bannerLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  bannerDiscardButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.error + '40',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    padding: 24,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.textSecondary + '20',
    gap: 12,
    padding: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.textSecondary + '30',
  },
  modalButtonConfirm: {
    backgroundColor: colors.error,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textOnPrimary,
  },
});

