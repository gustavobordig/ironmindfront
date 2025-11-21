import { useWorkout } from '@/contexts/WorkoutContext';
import { router } from 'expo-router';
import {
  Plus,
  X,
  Check,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import { updateWorkoutNotification, cancelAllNotifications } from '@/services/notifications';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Animated,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { WorkoutSet, SetType, Exercise } from '@/types/workout';
import { colors } from '@/constants/colors';

export default function WorkoutScreen() {
  const {
    activeWorkout,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    addSetToExercise,
    updateSet,
    deleteSet,
    completeWorkout,
    cancelWorkout,
    allExercises,
    updateExerciseRestTime,
  } = useWorkout();

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [currentRestExerciseId, setCurrentRestExerciseId] = useState<string | null>(null);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [restTimerConfig, setRestTimerConfig] = useState<{
    exerciseId: string;
    visible: boolean;
  } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showEmptyWorkoutModal, setShowEmptyWorkoutModal] = useState(false);
  const [showRemoveExerciseModal, setShowRemoveExerciseModal] = useState(false);
  const [exerciseToRemove, setExerciseToRemove] = useState<{ id: string; name: string } | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const hasWorkoutRef = useRef(false);
  const activeWorkoutRef = useRef(activeWorkout);
  const minimizeAnimation = useRef(new Animated.Value(1)).current;

  // Manter ref atualizada
  useEffect(() => {
    activeWorkoutRef.current = activeWorkout;
  }, [activeWorkout]);

  useEffect(() => {
    console.log('useEffect activeWorkout mudou:', {
      hasWorkout: !!activeWorkout,
      hasWorkoutRef: hasWorkoutRef.current,
      exercises: activeWorkout?.exercises,
      exercisesLength: activeWorkout?.exercises?.length,
    });

    // Se não houver treino ativo, verificar se devemos redirecionar
    if (!activeWorkout) {
      if (hasWorkoutRef.current) {
        // Se já tivemos um treino, dar um delay maior antes de redirecionar
        // para evitar redirecionamentos durante atualizações
        console.log('Treino desapareceu, aguardando 2 segundos antes de redirecionar...');
        const timeout = setTimeout(() => {
          // Verificar novamente usando a ref atualizada
          console.log('Verificando novamente após timeout:', {
            hasWorkout: !!activeWorkoutRef.current,
          });
          if (!activeWorkoutRef.current) {
            console.log('Redirecionando para /(tabs)');
            router.replace('/(tabs)');
            hasWorkoutRef.current = false;
          } else {
            console.log('Treino voltou, cancelando redirecionamento');
          }
        }, 2000); // Aumentado para 2 segundos
        return () => {
          console.log('Limpando timeout de redirecionamento');
          clearTimeout(timeout);
        };
      } else {
        // Se nunca tivemos um treino, redirecionar imediatamente
        console.log('Nunca tivemos treino, redirecionando imediatamente');
        router.replace('/(tabs)');
        return;
      }
    }

    // Marcar que já tivemos um treino ativo
    hasWorkoutRef.current = true;

    // Garantir que exercises existe e é válido antes de fazer map
    if (activeWorkout.exercises && Array.isArray(activeWorkout.exercises)) {
      if (activeWorkout.exercises.length > 0) {
        // Preservar exercícios que já estavam expandidos e ainda existem
        setExpandedExercises((prev) => {
          const currentExerciseIds = new Set(activeWorkout.exercises.map(ex => ex.id));
          const preserved = new Set<string>();
          
          // Manter apenas os exercícios que ainda existem no workout
          prev.forEach(exerciseId => {
            if (currentExerciseIds.has(exerciseId)) {
              preserved.add(exerciseId);
            }
          });
          
          // Se nenhum exercício estava expandido, expandir apenas o primeiro
          if (preserved.size === 0) {
            const firstExerciseId = activeWorkout.exercises[0]?.id;
            if (firstExerciseId) {
              preserved.add(firstExerciseId);
            }
          }
          
          return preserved;
        });
      } else {
        // Se exercises existe mas está vazio, apenas limpar expandedExercises
        console.log('Exercises está vazio, limpando expandedExercises');
        setExpandedExercises(new Set());
      }
    } else {
      console.warn('Exercises não é um array válido:', activeWorkout.exercises);
    }
  }, [activeWorkout]);

  useEffect(() => {
    if (!activeWorkout?.startedAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(activeWorkout.startedAt!).getTime();
      const elapsed = Math.floor((now - start) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout]);

  // Atualizar notificação quando o treino muda
  useEffect(() => {
    if (activeWorkout && activeWorkout.isActive) {
      updateWorkoutNotification(activeWorkout, restTimeRemaining > 0 ? restTimeRemaining : undefined);
    } else {
      cancelAllNotifications();
    }
  }, [activeWorkout, restTimeRemaining]);

  // Atualizar notificação durante o descanso
  useEffect(() => {
    if (!showRestTimer || restTimeRemaining <= 0) return;

    const interval = setInterval(async () => {
      if (activeWorkout) {
        await updateWorkoutNotification(activeWorkout, restTimeRemaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showRestTimer, restTimeRemaining, activeWorkout]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (showRestTimer && restTimeRemaining > 0) {
      interval = setInterval(() => {
        setRestTimeRemaining((prev) => {
          if (prev <= 1) {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            setShowRestTimer(false);
            setCurrentRestExerciseId(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showRestTimer, restTimeRemaining]);

  // Não renderizar nada se não houver treino ativo, mas não redirecionar imediatamente
  // O useEffect acima já cuida do redirecionamento com um delay
  if (!activeWorkout) {
    return null;
  }

  // Garantir que exercises existe e é um array válido antes de renderizar
  // Mas permitir renderizar mesmo se estiver vazio (para mostrar a mensagem de adicionar exercício)
  if (!activeWorkout.exercises || !Array.isArray(activeWorkout.exercises)) {
    return null;
  }

  const handleAddExercise = (exercise: Exercise) => {
    addExerciseToWorkout(exercise);
    setShowExerciseModal(false);
    setSearchQuery('');

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddSet = (workoutExerciseId: string, previousSet?: WorkoutSet) => {
    const newSet: Omit<WorkoutSet, 'id'> = {
      reps: previousSet?.reps || 10,
      weight: previousSet?.weight || 0,
      type: 'working',
      completed: false,
    };

    addSetToExercise(workoutExerciseId, newSet);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleCompleteSet = async (workoutExerciseId: string, setId: string, inputValues?: { reps: number; weight: number }) => {
    const exercise = activeWorkout.exercises.find(ex => ex.id === workoutExerciseId);
    const set = exercise?.sets.find(s => s.id === setId);
    
    if (set) {
      const newCompletedState = !set.completed;
      
      // Usar valores dos inputs se fornecidos, senão usar valores do set
      const finalReps = inputValues?.reps !== undefined ? inputValues.reps : set.reps;
      const finalWeight = inputValues?.weight !== undefined ? inputValues.weight : set.weight;
      
      // Fazer PATCH apenas quando marcar/desmarcar o check
      // Incluir os valores atuais de reps e weight dos inputs
      updateSet(workoutExerciseId, setId, { 
        completed: newCompletedState,
        reps: finalReps,
        weight: finalWeight,
        type: set.type,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          newCompletedState 
            ? Haptics.NotificationFeedbackType.Success 
            : Haptics.NotificationFeedbackType.Warning
        );
      }

      if (newCompletedState && exercise) {
        setRestTimeRemaining(exercise.restTime);
        setShowRestTimer(true);
        setCurrentRestExerciseId(workoutExerciseId);
        
        // Atualizar notificação com tempo de descanso
        if (activeWorkout) {
          await updateWorkoutNotification(activeWorkout, exercise.restTime);
        }
      } else {
        // Atualizar notificação sem tempo de descanso
        if (activeWorkout) {
          await updateWorkoutNotification(activeWorkout);
        }
      }
    }
  };

  const handleDeleteSet = (workoutExerciseId: string, setId: string) => {
    deleteSet(workoutExerciseId, setId);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleCompleteWorkout = () => {
    const totalSets = activeWorkout.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
      0
    );

    if (totalSets === 0) {
      setShowEmptyWorkoutModal(true);
      return;
    }

    setShowCompleteModal(true);
  };

  const confirmCompleteWorkout = async () => {
    setIsCompleting(true);
    try {
      await cancelAllNotifications();
      await completeWorkout();
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Erro ao finalizar treino:', error);
      setErrorMessage(error?.message || 'Não foi possível finalizar o treino. Tente novamente.');
      setShowErrorModal(true);
    } finally {
      setIsCompleting(false);
      setShowCompleteModal(false);
    }
  };

  const dismissCompleteModal = () => {
    setShowCompleteModal(false);
  };

  const handleMinimizeWorkout = () => {
    // Animar a tela diminuindo de cima para baixo
    Animated.timing(minimizeAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Após a animação, navegar para a tela inicial
      router.push('/(tabs)');
      // Resetar a animação para próxima vez
      minimizeAnimation.setValue(1);
    });

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleCancelWorkout = () => {
    setShowCancelModal(true);
  };

  const confirmCancelWorkout = async () => {
    setIsCancelling(true);
    try {
      await cancelAllNotifications();
      await cancelWorkout();
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Erro ao cancelar treino:', error);
      setErrorMessage(error?.message || 'Não foi possível cancelar o treino. Tente novamente.');
      setShowErrorModal(true);
    } finally {
      setIsCancelling(false);
      setShowCancelModal(false);
    }
  };

  const dismissCancelModal = () => {
    setShowCancelModal(false);
  };

  const toggleExercise = (exerciseId: string) => {
    setExpandedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const handleUpdateRestTime = (exerciseId: string, newTime: number) => {
    updateExerciseRestTime(exerciseId, newTime);
    setRestTimerConfig(null);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const filteredExercises = allExercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View
      style={[
        styles.animatedContainer,
        {
          transform: [{ scaleY: minimizeAnimation }],
          opacity: minimizeAnimation,
        },
      ]}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleCancelWorkout} style={styles.headerButton}>
            <X size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{activeWorkout.name}</Text>
          <View style={styles.timerContainer}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.timerText}>{formatElapsedTime(elapsedTime)}</Text>
          </View>
          <TouchableOpacity onPress={handleMinimizeWorkout} style={styles.minimizeButton}>
            <ChevronDown size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleCompleteWorkout} style={styles.headerButton}>
          <Check size={24} color={colors.success} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeWorkout.exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>Nenhum exercício adicionado</Text>
            <Text style={styles.emptyStateText}>
              Comece adicionando exercícios ao seu treino
            </Text>
          </View>
        ) : (
          activeWorkout.exercises.map((workoutEx) => {
            const isExpanded = expandedExercises.has(workoutEx.id);
            const completedSets = workoutEx.sets.filter((s) => s.completed).length;
            const allCompleted = workoutEx.sets.length > 0 && completedSets === workoutEx.sets.length;

            return (
              <View key={workoutEx.id} style={[
                styles.exerciseCard,
                allCompleted && styles.exerciseCardCompleted
              ]}>
                <View style={styles.exerciseHeader}>
                  <TouchableOpacity
                    style={styles.exerciseHeaderContent}
                    onPress={() => toggleExercise(workoutEx.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{workoutEx.exercise.name}</Text>
                      <Text style={styles.exerciseMuscle}>{workoutEx.exercise.muscleGroup}</Text>
                    </View>
                    <View style={styles.exerciseActions}>
                      <Text style={styles.exerciseStats}>
                        {completedSets}/{workoutEx.sets.length}
                      </Text>
                      {isExpanded ? (
                        <ChevronUp size={20} color={colors.textSecondary} />
                      ) : (
                        <ChevronDown size={20} color={colors.textSecondary} />
                      )}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeExerciseButton}
                    onPress={() => {
                      setExerciseToRemove({ id: workoutEx.id, name: workoutEx.exercise.name });
                      setShowRemoveExerciseModal(true);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>

                {isExpanded && (
                  <>
                    <View style={styles.restTimeSection}>
                      <Text style={styles.restTimeLabel}>Descanso entre séries:</Text>
                      <TouchableOpacity
                        style={styles.restTimeButton}
                        onPress={() => setRestTimerConfig({ exerciseId: workoutEx.id, visible: true })}
                      >
                        <Clock size={16} color={colors.primary} />
                        <Text style={styles.restTimeValue}>{workoutEx.restTime}s</Text>
                        <ChevronDown size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.setsContainer}>
                      {workoutEx.sets.length === 0 ? (
                        <View style={styles.noSetsContainer}>
                          <Text style={styles.noSetsText}>Nenhuma série adicionada</Text>
                        </View>
                      ) : (
                        workoutEx.sets.map((set, index) => (
                          <SetRow
                            key={set.id}
                            set={set}
                            index={index}
                            workoutExerciseId={workoutEx.id}
                            onUpdate={updateSet}
                            onDelete={handleDeleteSet}
                            onComplete={handleCompleteSet}
                            isExerciseCompleted={allCompleted}
                          />
                        ))
                      )}

                      <TouchableOpacity
                        style={styles.addSetButton}
                        onPress={() =>
                          handleAddSet(
                            workoutEx.id,
                            workoutEx.sets[workoutEx.sets.length - 1]
                          )
                        }
                      >
                        <Plus size={20} color={colors.primary} />
                        <Text style={styles.addSetText}>Adicionar Série</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            );
          })
        )}

        <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={() => setShowExerciseModal(true)}
        >
          <Plus size={24} color={colors.textOnPrimary} />
          <Text style={styles.addExerciseText}>Adicionar Exercício</Text>
        </TouchableOpacity>
      </ScrollView>

      {showRestTimer && (
        <SafeAreaView style={styles.restTimerBar} edges={['bottom']}>
          <View style={styles.restTimerContent}>
            <Text style={styles.restTimerLabel}>Descanso</Text>
            <Text style={styles.restTimerValue}>{formatTime(restTimeRemaining)}</Text>
          </View>
          <View style={styles.restTimerActions}>
            <TouchableOpacity
              style={styles.restTimerButton}
              onPress={() => setRestTimeRemaining(prev => prev + 30)}
            >
              <Text style={styles.restTimerButtonText}>+30s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.restTimerButton, styles.restTimerButtonSkip]}
              onPress={() => {
                setShowRestTimer(false);
                setCurrentRestExerciseId(null);
              }}
            >
              <Text style={styles.restTimerButtonText}>Pular</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      <Modal
        visible={showExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Exercício</Text>
            <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar exercícios..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <ScrollView style={styles.exercisesList}>
            {filteredExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={styles.exerciseOption}
                onPress={() => handleAddExercise(exercise)}
              >
                <Text style={styles.exerciseOptionName}>{exercise.name}</Text>
                <Text style={styles.exerciseOptionGroup}>{exercise.muscleGroup}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={restTimerConfig !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setRestTimerConfig(null)}
      >
        <TouchableOpacity 
          style={styles.restConfigOverlay}
          activeOpacity={1}
          onPress={() => setRestTimerConfig(null)}
        >
          <View style={styles.restConfigCard}>
            <Text style={styles.restConfigTitle}>Tempo de Descanso</Text>
            <View style={styles.restConfigOptions}>
              {[30, 60, 90, 120, 180].map((seconds) => (
                <TouchableOpacity
                  key={seconds}
                  style={styles.restConfigOption}
                  onPress={() => {
                    if (restTimerConfig) {
                      handleUpdateRestTime(restTimerConfig.exerciseId, seconds);
                    }
                  }}
                >
                  <Text style={styles.restConfigOptionText}>{seconds}s</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de confirmação de cancelamento */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={dismissCancelModal}
      >
        <TouchableOpacity
          style={styles.cancelModalOverlay}
          activeOpacity={1}
          onPress={dismissCancelModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.cancelModalContent}
          >
            <View style={styles.cancelModalHeader}>
              <View style={styles.cancelModalIconContainer}>
                <AlertCircle size={32} color={colors.error} />
              </View>
              <Text style={styles.cancelModalTitle}>Cancelar Treino</Text>
              <Text style={styles.cancelModalMessage}>
                Tem certeza que deseja cancelar este treino?
                {'\n\n'}
                Todos os dados serão perdidos e esta ação não pode ser desfeita.
              </Text>
            </View>

            <View style={styles.cancelModalActions}>
              <TouchableOpacity
                style={[styles.cancelModalButton, styles.cancelModalButtonCancel]}
                onPress={dismissCancelModal}
                disabled={isCancelling}
              >
                <Text style={styles.cancelModalButtonCancelText}>Não, Continuar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.cancelModalButton,
                  styles.cancelModalButtonConfirm,
                  isCancelling && styles.cancelModalButtonDisabled,
                ]}
                onPress={confirmCancelWorkout}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <View style={styles.cancelModalButtonLoading}>
                    <ActivityIndicator size="small" color={colors.textOnPrimary} />
                    <Text style={styles.cancelModalButtonConfirmText}>Cancelando...</Text>
                  </View>
                ) : (
                  <Text style={styles.cancelModalButtonConfirmText}>Sim, Descartar</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal de confirmação de finalização */}
      <Modal
        visible={showCompleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={dismissCompleteModal}
      >
        <TouchableOpacity
          style={styles.cancelModalOverlay}
          activeOpacity={1}
          onPress={dismissCompleteModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.cancelModalContent}
          >
            <View style={styles.cancelModalHeader}>
              <View style={[styles.cancelModalIconContainer, { backgroundColor: colors.success + '20' }]}>
                <Check size={32} color={colors.success} />
              </View>
              <Text style={styles.cancelModalTitle}>Finalizar Treino</Text>
              <Text style={styles.cancelModalMessage}>
                Deseja finalizar este treino?
                {'\n\n'}
                O treino será salvo no seu histórico.
              </Text>
            </View>

            <View style={styles.cancelModalActions}>
              <TouchableOpacity
                style={[styles.cancelModalButton, styles.cancelModalButtonCancel]}
                onPress={dismissCompleteModal}
                disabled={isCompleting}
              >
                <Text style={styles.cancelModalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.cancelModalButton,
                  { backgroundColor: colors.success },
                  isCompleting && styles.cancelModalButtonDisabled,
                ]}
                onPress={confirmCompleteWorkout}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <View style={styles.cancelModalButtonLoading}>
                    <ActivityIndicator size="small" color={colors.textOnPrimary} />
                    <Text style={styles.cancelModalButtonConfirmText}>Finalizando...</Text>
                  </View>
                ) : (
                  <Text style={styles.cancelModalButtonConfirmText}>Finalizar</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal de treino vazio */}
      <Modal
        visible={showEmptyWorkoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmptyWorkoutModal(false)}
      >
        <TouchableOpacity
          style={styles.cancelModalOverlay}
          activeOpacity={1}
          onPress={() => setShowEmptyWorkoutModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.cancelModalContent}
          >
            <View style={styles.cancelModalHeader}>
              <View style={[styles.cancelModalIconContainer, { backgroundColor: colors.warning + '20' }]}>
                <AlertCircle size={32} color={colors.warning} />
              </View>
              <Text style={styles.cancelModalTitle}>Treino Vazio</Text>
              <Text style={styles.cancelModalMessage}>
                Complete pelo menos uma série antes de finalizar o treino.
              </Text>
            </View>

            <View style={styles.cancelModalActions}>
              <TouchableOpacity
                style={[styles.cancelModalButton, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={() => setShowEmptyWorkoutModal(false)}
              >
                <Text style={styles.cancelModalButtonConfirmText}>OK</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal de confirmação de remover exercício */}
      <Modal
        visible={showRemoveExerciseModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRemoveExerciseModal(false)}
      >
        <TouchableOpacity
          style={styles.cancelModalOverlay}
          activeOpacity={1}
          onPress={() => setShowRemoveExerciseModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.cancelModalContent}
          >
            <View style={styles.cancelModalHeader}>
              <View style={styles.cancelModalIconContainer}>
                <Trash2 size={32} color={colors.error} />
              </View>
              <Text style={styles.cancelModalTitle}>Remover Exercício</Text>
              <Text style={styles.cancelModalMessage}>
                Deseja remover o exercício{' '}
                <Text style={styles.cancelModalRoutineName}>"{exerciseToRemove?.name}"</Text> do treino?
                {'\n\n'}
                Esta ação não pode ser desfeita.
              </Text>
            </View>

            <View style={styles.cancelModalActions}>
              <TouchableOpacity
                style={[styles.cancelModalButton, styles.cancelModalButtonCancel]}
                onPress={() => {
                  setShowRemoveExerciseModal(false);
                  setExerciseToRemove(null);
                }}
              >
                <Text style={styles.cancelModalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelModalButton, styles.cancelModalButtonConfirm]}
                onPress={() => {
                  if (exerciseToRemove) {
                    removeExerciseFromWorkout(exerciseToRemove.id);
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                  }
                  setShowRemoveExerciseModal(false);
                  setExerciseToRemove(null);
                }}
              >
                <Text style={styles.cancelModalButtonConfirmText}>Remover</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal de erro */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <TouchableOpacity
          style={styles.cancelModalOverlay}
          activeOpacity={1}
          onPress={() => setShowErrorModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.cancelModalContent}
          >
            <View style={styles.cancelModalHeader}>
              <View style={styles.cancelModalIconContainer}>
                <AlertCircle size={32} color={colors.error} />
              </View>
              <Text style={styles.cancelModalTitle}>Erro</Text>
              <Text style={styles.cancelModalMessage}>
                {errorMessage}
              </Text>
            </View>

            <View style={styles.cancelModalActions}>
              <TouchableOpacity
                style={[styles.cancelModalButton, { backgroundColor: colors.error, flex: 1 }]}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={styles.cancelModalButtonConfirmText}>OK</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      </SafeAreaView>
    </Animated.View>
  );
}

function SetRow({
  set,
  index,
  workoutExerciseId,
  onUpdate,
  onDelete,
  onComplete,
  isExerciseCompleted,
}: {
  set: WorkoutSet;
  index: number;
  workoutExerciseId: string;
  onUpdate: (workoutExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  onDelete: (workoutExerciseId: string, setId: string) => void;
  onComplete: (workoutExerciseId: string, setId: string, inputValues?: { reps: number; weight: number }) => void;
  isExerciseCompleted: boolean;
}) {
  const [reps, setReps] = useState(set.reps === 0 ? '' : set.reps.toString());
  const [weight, setWeight] = useState(set.weight === 0 ? '' : set.weight.toString());
  const [setType, setSetType] = useState<SetType>(set.type);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const [showDeleteIcon, setShowDeleteIcon] = useState(false);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Só ativa se o movimento horizontal for maior que o vertical
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        translateX.setOffset((translateX as any)._value);
      },
      onPanResponderMove: (_, gestureState) => {
        // Só permite arrastar para a esquerda (valores negativos)
        const newValue = Math.min(0, gestureState.dx);
        translateX.setValue(newValue);
        // Mostra a lixeira quando arrastar mais de 20px
        setShowDeleteIcon(Math.abs(newValue) > 20);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateX.flattenOffset();
        
        // Se arrastou mais de 80px para a esquerda, deleta
        if (gestureState.dx < -80) {
          Animated.timing(translateX, {
            toValue: -200,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDelete(workoutExerciseId, set.id);
          });
          
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        } else {
          // Volta para a posição original
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start(() => {
            setShowDeleteIcon(false);
          });
        }
      },
    })
  ).current;

  // Sincronizar estado local com o set quando ele mudar
  useEffect(() => {
    setReps(set.reps === 0 ? '' : set.reps.toString());
    setWeight(set.weight === 0 ? '' : set.weight.toString());
    setSetType(set.type);
  }, [set.reps, set.weight, set.type, set.id]);

  const handleTypeChange = (type: SetType) => {
    setSetType(type);
    // Não fazer PATCH ao mudar tipo, apenas atualizar localmente
    // O PATCH será feito apenas quando marcar o check
    setShowTypeModal(false);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getSetTypeLabel = (type: SetType): string => {
    switch (type) {
      case 'warmup': return 'A';
      case 'failure': return 'F';
      default: return 'N';
    }
  };

  const getSetTypeColor = (type: SetType): string => {
    switch (type) {
      case 'warmup': return colors.primary;
      case 'failure': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const handleToggleComplete = () => {
    // Passar os valores atuais dos inputs para o handleCompleteSet
    onComplete(workoutExerciseId, set.id, {
      reps: parseInt(reps) || 0,
      weight: parseFloat(weight) || 0,
    });
  };

  return (
    <View style={styles.setRowWrapper}>
      <Animated.View
        style={[
          styles.setRow,
          set.completed && styles.setRowCompleted,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.setRowTouchable}
          onPress={handleToggleComplete}
          activeOpacity={0.7}
        >
          <Text style={styles.setNumber}>{index + 1}</Text>

          <TouchableOpacity
            style={[
              styles.setTypeButton,
              set.completed && styles.setTypeButtonDisabled,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              if (!set.completed) {
                setShowTypeModal(true);
              }
            }}
            disabled={set.completed}
          >
            <Text style={[
              styles.setTypeButtonText,
              { color: getSetTypeColor(setType) },
            ]}>
              {getSetTypeLabel(setType)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.setInputContainer}
          >
            <Text style={styles.setInputLabel}>kg</Text>
            <TextInput
              style={[
                styles.setInput,
                isExerciseCompleted && styles.setInputCompleted
              ]}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder=""
              editable={!set.completed}
              placeholderTextColor="#9ca3af"
              onPressIn={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
            />
          </TouchableOpacity>

          <Text style={styles.setX}>×</Text>

          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.setInputContainer}
          >
            <Text style={styles.setInputLabel}>reps</Text>
            <TextInput
              style={[
                styles.setInput,
                isExerciseCompleted && styles.setInputCompleted
              ]}
              value={reps}
              onChangeText={setReps}
              keyboardType="numeric"
              placeholder=""
              editable={!set.completed}
              placeholderTextColor="#9ca3af"
              onPressIn={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
            />
          </TouchableOpacity>

          <View style={styles.setActionButton}>
            <Check size={18} color={set.completed ? colors.success : colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </Animated.View>
      
      {showDeleteIcon && (
        <TouchableOpacity
          style={styles.deleteBackground}
          onPress={() => {
            Animated.timing(translateX, {
              toValue: -200,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              onDelete(workoutExerciseId, set.id);
            });
            
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }}
          activeOpacity={0.8}
        >
          <Trash2 size={20} color={colors.textOnPrimary} />
        </TouchableOpacity>
      )}

      <Modal
        visible={showTypeModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.typeModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowTypeModal(false)}
          />
          <View style={styles.typeModalCard}>
            <Text style={styles.typeModalTitle}>Tipo de Série</Text>
            <Text style={styles.typeModalSubtitle}>Série {index + 1}</Text>
            
            <View style={styles.typeModalOptions}>
              <TouchableOpacity
                style={[
                  styles.typeModalOption,
                  setType === 'warmup' && styles.typeModalOptionSelected,
                ]}
                onPress={() => handleTypeChange('warmup')}
              >
                <View style={[
                  styles.typeModalOptionIcon,
                  { backgroundColor: colors.primaryLight + '40' },
                ]}>
                  <Text style={[styles.typeModalOptionIconText, { color: colors.primary }]}>
                    A
                  </Text>
                </View>
                <View style={styles.typeModalOptionContent}>
                  <Text style={[
                    styles.typeModalOptionLabel,
                    setType === 'warmup' && styles.typeModalOptionLabelSelected,
                  ]}>
                    Aquecimento
                  </Text>
                  <Text style={styles.typeModalOptionDescription}>
                    Preparação antes do trabalho
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeModalOption,
                  setType === 'working' && styles.typeModalOptionSelected,
                ]}
                onPress={() => handleTypeChange('working')}
              >
                <View style={[
                  styles.typeModalOptionIcon,
                  { backgroundColor: colors.background },
                ]}>
                  <Text style={[styles.typeModalOptionIconText, { color: colors.textSecondary }]}>
                    N
                  </Text>
                </View>
                <View style={styles.typeModalOptionContent}>
                  <Text style={[
                    styles.typeModalOptionLabel,
                    setType === 'working' && styles.typeModalOptionLabelSelected,
                  ]}>
                    Normal
                  </Text>
                  <Text style={styles.typeModalOptionDescription}>
                    Série de trabalho principal
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeModalOption,
                  setType === 'failure' && styles.typeModalOptionSelected,
                ]}
                onPress={() => handleTypeChange('failure')}
              >
                <View style={[
                  styles.typeModalOptionIcon,
                  { backgroundColor: colors.error + '40' },
                ]}>
                  <Text style={[styles.typeModalOptionIconText, { color: colors.error }]}>
                    F
                  </Text>
                </View>
                <View style={styles.typeModalOptionContent}>
                  <Text style={[
                    styles.typeModalOptionLabel,
                    setType === 'failure' && styles.typeModalOptionLabelSelected,
                  ]}>
                    Falha
                  </Text>
                  <Text style={styles.typeModalOptionDescription}>
                    Até a falha muscular
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  minimizeButton: {
    marginTop: 4,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 180,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  exerciseCardCompleted: {
    backgroundColor: colors.success + '60',
    borderColor: colors.success + '80',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  exerciseHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  removeExerciseButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  exerciseMuscle: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseStats: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  restTimeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  restTimeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  restTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.primaryLight + '30',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryLight + '60',
  },
  restTimeValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  setsContainer: {
    padding: 16,
    paddingTop: 12,
    gap: 8,
  },
  noSetsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noSetsText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  setRowWrapper: {
    position: 'relative',
    marginBottom: 8,
    overflow: 'hidden',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    zIndex: 1,
  },
  setRowTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  setRowCompleted: {
    backgroundColor: colors.success + '15',
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    width: 24,
    textAlign: 'center',
    marginTop: 27,
    lineHeight: 48,
  },
  setTypeSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  setTypeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.textSecondary + '40',
    backgroundColor: colors.surface,
    marginTop: 27,
  },
  setTypeButtonActive: {
    borderWidth: 2,
  },
  setTypeButtonDisabled: {
    opacity: 0.5,
  },
  setTypeButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  typeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  typeModalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  typeModalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  typeModalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  typeModalOptions: {
    gap: 12,
  },
  typeModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textSecondary + '20',
    backgroundColor: colors.background,
  },
  typeModalOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20',
  },
  typeModalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  typeModalOptionIconText: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  typeModalOptionContent: {
    flex: 1,
  },
  typeModalOptionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  typeModalOptionLabelSelected: {
    color: colors.primary,
  },
  typeModalOptionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  setInputContainer: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  setInputLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  setInput: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    minHeight: 48,
  },
  setInputCompleted: {
    backgroundColor: colors.success + '30',
    borderColor: colors.success + '60',
  },
  setX: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginTop: 27,
    textAlign: 'center',
    lineHeight: 48,
  },
  setActionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginTop: 27,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addSetText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  addExerciseText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textOnPrimary,
  },
  restTimerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  restTimerContent: {
    flex: 1,
  },
  restTimerLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textOnPrimary + 'CC',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  restTimerValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.textOnPrimary,
  },
  restTimerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  restTimerButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  restTimerButtonSkip: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  restTimerButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.textOnPrimary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  exercisesList: {
    flex: 1,
  },
  exerciseOption: {
    backgroundColor: colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  exerciseOptionName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  exerciseOptionGroup: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  restConfigOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  restConfigCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    minWidth: 280,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  restConfigTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  restConfigOptions: {
    gap: 12,
  },
  restConfigOption: {
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textSecondary + '20',
  },
  restConfigOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  cancelModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cancelModalContent: {
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
  cancelModalHeader: {
    padding: 24,
    alignItems: 'center',
  },
  cancelModalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cancelModalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  cancelModalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  cancelModalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.textSecondary + '20',
    gap: 12,
    padding: 16,
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalButtonCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.textSecondary + '30',
  },
  cancelModalButtonConfirm: {
    backgroundColor: colors.error,
  },
  cancelModalButtonDisabled: {
    opacity: 0.6,
  },
  cancelModalButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelModalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  cancelModalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textOnPrimary,
  },
  cancelModalRoutineName: {
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
});
