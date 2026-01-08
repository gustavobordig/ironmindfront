import { useWorkout } from '@/contexts/WorkoutContext';
import { router } from 'expo-router';
import { Plus, Play, Calendar, Edit, Trash2, MoreVertical } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { colors } from '@/constants/colors';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from '@/components/atoms/Toast';
import ActiveWorkoutBanner from '@/components/organisms/ActiveWorkoutBanner';
import AppBackground from '@/components/organisms/AppBackground';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function RoutinesScreen() {
  const { routines, startWorkout, deleteRoutine, activeWorkout } = useWorkout();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<{ id: string; name: string } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);

  // Log para debug - verificar quando routines muda
  useEffect(() => {
    console.log('Rotinas atualizadas na tela:', routines.length, routines.map(r => r.id));
  }, [routines]);

  const handleUseRoutine = async (routineId: string) => {
    // Prevenir múltiplas chamadas
    if (isStartingWorkout) {
      return;
    }

    // Se já existe um treino ativo, apenas redirecionar
    if (activeWorkout) {
      router.push('/workout');
      return;
    }

    const routine = routines.find((r) => r.id === routineId);
    if (routine) {
      setIsStartingWorkout(true);
      try {
        await startWorkout(routine.name, routine);
        router.push('/workout');
      } catch (error: any) {
        console.error('Error starting workout:', error);
        // Se o erro for 409 (treino ativo), redirecionar para a tela de treino
        if (error?.statusCode === 409 || error?.message?.includes('treino ativo')) {
          router.push('/workout');
        }
      } finally {
        setIsStartingWorkout(false);
      }
    }
  };

  const handleStartFreeWorkout = async () => {
    // Prevenir múltiplas chamadas
    if (isStartingWorkout) {
      return;
    }

    // Se já existe um treino ativo, apenas redirecionar
    if (activeWorkout) {
      router.push('/workout');
      return;
    }

    setIsStartingWorkout(true);
    try {
      await startWorkout('Treino Livre');
      router.push('/workout');
    } catch (error: any) {
      console.error('Error starting workout:', error);
      // Se o erro for 409 (treino ativo), redirecionar para a tela de treino
      if (error?.statusCode === 409 || error?.message?.includes('treino ativo')) {
        router.push('/workout');
      }
    } finally {
      setIsStartingWorkout(false);
    }
  };

  const handleEditRoutine = (routineId: string) => {
    setMenuVisible(null);
    router.push(`/create-routine?id=${routineId}`);
  };

  const handleDeleteRoutine = (routineId: string) => {
    setMenuVisible(null);
    const routine = routines.find((r) => r.id === routineId);
    
    if (!routine) {
      Alert.alert('Erro', 'Rotina não encontrada');
      return;
    }
    
    setRoutineToDelete({ id: routineId, name: routine.name });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!routineToDelete) return;

    console.log('Iniciando exclusão da rotina:', routineToDelete.id);
    setIsDeleting(true);
    try {
      console.log('Chamando deleteRoutine do contexto...');
      await deleteRoutine(routineToDelete.id);
      console.log('deleteRoutine concluído com sucesso');
      setToastMessage('Rotina excluída com sucesso!');
      setToastVisible(true);
      setDeleteModalVisible(false);
      setRoutineToDelete(null);
      // Forçar atualização visual
      console.log('Rotinas após exclusão (na tela):', routines.length);
    } catch (error: any) {
      console.error('Erro ao excluir rotina:', error);
      Alert.alert(
        'Erro',
        error?.message || 'Não foi possível excluir a rotina. Tente novamente.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setRoutineToDelete(null);
  };

  const handleViewDetails = (routineId: string) => {
    setMenuVisible(null);
    router.push(`/routine-details?id=${routineId}`);
  };

  return (
    <AppBackground>
      <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Treino</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.freeWorkoutButton} onPress={handleStartFreeWorkout} activeOpacity={0.8}>
            <Play size={20} color="rgba(255, 255, 255, 0.92)" fill="rgba(255, 255, 255, 0.92)" />
            <Text style={styles.freeWorkoutButtonText}>Treino Livre</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createRoutineButton}
            onPress={() => router.push('/create-routine')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.10)',
                'rgba(255, 255, 255, 0.06)',
                'rgba(0, 0, 0, 0.20)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.createRoutineButtonGradient}
            >
              <Plus size={20} color="#FF8A3D" />
              <Text style={styles.createRoutineButtonText}>Criar Rotina</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minhas Rotinas</Text>

          {routines.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateCard}>
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.10)',
                    'rgba(255, 255, 255, 0.06)',
                    'rgba(0, 0, 0, 0.20)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.emptyStateGradient}
                >
                  <Calendar size={48} color="rgba(255, 255, 255, 0.70)" />
                  <Text style={styles.emptyStateTitle}>Nenhuma rotina criada</Text>
                  <Text style={styles.emptyStateText}>
                    Crie rotinas para organizar seus treinos semanais
                  </Text>
                </LinearGradient>
              </View>
            </View>
          )}

          {routines.map((routine) => (
            <View key={routine.id} style={styles.routineCard}>
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.10)',
                  'rgba(255, 255, 255, 0.06)',
                  'rgba(0, 0, 0, 0.20)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.routineCardGradient}
              >
                <View style={styles.routineHeader}>
                  <TouchableOpacity
                    style={styles.routineInfo}
                    onPress={() => handleViewDetails(routine.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.routineName}>{routine.name}</Text>
                    {routine.description && (
                      <Text style={styles.routineDescription}>{routine.description}</Text>
                    )}
                  </TouchableOpacity>
                  <View style={styles.routineActions}>
                    <TouchableOpacity
                      style={styles.useButton}
                      onPress={() => handleUseRoutine(routine.id)}
                      activeOpacity={0.8}
                    >
                      <Play size={20} color="rgba(255, 255, 255, 0.92)" fill="rgba(255, 255, 255, 0.92)" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.menuButton}
                      onPress={() => setMenuVisible(routine.id)}
                    >
                      <MoreVertical size={20} color="rgba(255, 255, 255, 0.70)" />
                    </TouchableOpacity>
                  </View>
                </View>

                {routine.daysOfWeek && routine.daysOfWeek.length > 0 && (
                  <View style={styles.daysRow}>
                    {routine.daysOfWeek.map((day) => (
                      <View key={day} style={styles.dayChip}>
                        <Text style={styles.dayChipText}>{DAY_NAMES[day]}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.exercisesList}>
                  <Text style={styles.exercisesTitle}>
                    {routine.exercises.length} exercícios
                  </Text>
                  {routine.exercises.slice(0, 4).map((ex) => (
                    <Text key={ex.id} style={styles.exerciseItem}>
                      • {ex.exercise.name} - {ex.targetSets} x {ex.targetReps}
                    </Text>
                  ))}
                  {routine.exercises.length > 4 && (
                    <Text style={styles.exerciseItem}>
                      + {routine.exercises.length - 4} mais
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Menu de opções */}
      {menuVisible && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMenuVisible(null)}
        >
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(null)}
          >
            <View style={styles.menuContent}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleViewDetails(menuVisible)}
              >
                <Text style={styles.menuItemText}>Ver Detalhes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleEditRoutine(menuVisible)}
              >
                <Edit size={18} color="#FF8A3D" />
                <Text style={[styles.menuItemText, { color: '#FF8A3D' }]}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemDanger]}
                onPress={() => handleDeleteRoutine(menuVisible)}
              >
                <Trash2 size={18} color="#EB5757" />
                <Text style={[styles.menuItemText, { color: '#EB5757' }]}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Modal de confirmação de exclusão */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <TouchableOpacity
          style={styles.deleteModalOverlay}
          activeOpacity={1}
          onPress={cancelDelete}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.deleteModalContent}
          >
            <View style={styles.deleteModalHeader}>
              <View style={styles.deleteModalIconContainer}>
                <Trash2 size={32} color={colors.error} />
              </View>
              <Text style={styles.deleteModalTitle}>Excluir Rotina</Text>
              <Text style={styles.deleteModalMessage}>
                Tem certeza que deseja excluir a rotina{' '}
                <Text style={styles.deleteModalRoutineName}>"{routineToDelete?.name}"</Text>?
                {'\n\n'}
                Esta ação não pode ser desfeita.
              </Text>
            </View>

            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteModalButtonCancel]}
                onPress={cancelDelete}
                disabled={isDeleting}
              >
                <Text style={styles.deleteModalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteModalButton,
                  styles.deleteModalButtonConfirm,
                  isDeleting && styles.deleteModalButtonDisabled,
                ]}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <View style={styles.deleteModalButtonLoading}>
                    <ActivityIndicator size="small" color={colors.textOnPrimary} />
                    <Text style={styles.deleteModalButtonConfirmText}>Excluindo...</Text>
                  </View>
                ) : (
                  <Text style={styles.deleteModalButtonConfirmText}>Excluir</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Toast
        message={toastMessage}
        type={toastMessage.includes('sucesso') ? 'success' : 'error'}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
      <ActiveWorkoutBanner />
    </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 8,
    gap: 12,
  },
  freeWorkoutButton: {
    flex: 1,
    backgroundColor: '#FF8A3D',
    borderRadius: 13,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  freeWorkoutButtonText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  createRoutineButton: {
    flex: 1,
    borderRadius: 13,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  createRoutineButtonGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 61, 0.40)',
  },
  createRoutineButtonText: {
    color: '#FF8A3D',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  section: {
    padding: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 16,
  },
  emptyStateContainer: {
    marginTop: 8,
  },
  emptyStateCard: {
    borderRadius: 13,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyStateGradient: {
    padding: 48,
    paddingTop: 32,
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.70)',
    textAlign: 'center',
  },
  routineCard: {
    borderRadius: 13,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  routineCardGradient: {
    padding: 20,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routineInfo: {
    flex: 1,
    marginRight: 12,
  },
  routineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    backgroundColor: 'rgba(30, 31, 34, 0.95)',
    borderRadius: 16,
    padding: 8,
    minWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
    marginTop: 4,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  routineName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 4,
  },
  routineDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.70)',
    lineHeight: 20,
  },
  useButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF8A3D',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.10)',
  },
  dayChip: {
    backgroundColor: 'rgba(255, 138, 61, 0.20)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 61, 0.40)',
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FF8A3D',
  },
  exercisesList: {
    paddingTop: 16,
  },
  exercisesTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.70)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseItem: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 6,
    lineHeight: 20,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContent: {
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
  deleteModalHeader: {
    padding: 24,
    alignItems: 'center',
  },
  deleteModalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  deleteModalRoutineName: {
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  deleteModalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.textSecondary + '20',
    gap: 12,
    padding: 16,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalButtonCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.textSecondary + '30',
  },
  deleteModalButtonConfirm: {
    backgroundColor: colors.error,
  },
  deleteModalButtonDisabled: {
    opacity: 0.6,
  },
  deleteModalButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteModalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  deleteModalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textOnPrimary,
  },
});
