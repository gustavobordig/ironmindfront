import { useWorkout } from '@/contexts/WorkoutContext';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  ChevronDown,
  ChevronUp,
  Play,
  Edit,
  Copy,
  TrendingUp,
  Clock,
  Target,
  Dumbbell,
  Trash2,
} from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import Toast from '@/components/atoms/Toast';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function RoutineDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { routines, workouts, startWorkout, getExerciseHistory, getPersonalRecord, deleteRoutine, activeWorkout } =
    useWorkout();
  const insets = useSafeAreaInsets();

  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const routine = useMemo(() => {
    return routines.find((r) => r.id === id);
  }, [routines, id]);

  const routineWorkouts = useMemo(() => {
    if (!routine) return [];
    return workouts
      .filter((w) => w.name === routine.name)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [workouts, routine]);

  const lastWorkout = routineWorkouts[0];

  const averageStats = useMemo(() => {
    if (routineWorkouts.length === 0)
      return { volume: 0, duration: 0, exercises: 0, sets: 0 };

    let totalVolume = 0;
    let totalDuration = 0;
    let totalSets = 0;

    routineWorkouts.forEach((workout) => {
      workout.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          if (set.completed && set.type !== 'warmup') {
            totalVolume += set.weight * set.reps;
          }
          if (set.completed) totalSets++;
        });
      });
      totalDuration += workout.duration || 0;
    });

    return {
      volume: Math.round(totalVolume / routineWorkouts.length),
      duration: Math.round(totalDuration / routineWorkouts.length),
      exercises: routine?.exercises.length || 0,
      sets: Math.round(totalSets / routineWorkouts.length),
    };
  }, [routineWorkouts, routine]);

  const toggleExercise = (exerciseId: string) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(exerciseId)) {
      newExpanded.delete(exerciseId);
    } else {
      newExpanded.add(exerciseId);
    }
    setExpandedExercises(newExpanded);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  };

  const handleStartWorkout = async () => {
    if (!routine) return;

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
  };

  const handleEditRoutine = () => {
    if (routine) {
      router.push(`/create-routine?id=${routine.id}`);
    }
  };

  const handleDeleteRoutine = async () => {
    if (!routine) return;

    Alert.alert(
      'Excluir Rotina',
      `Tem certeza que deseja excluir a rotina "${routine.name}"? Esta ação não pode ser desfeita.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteRoutine(routine.id);
              setToastMessage('Rotina excluída com sucesso!');
              setToastVisible(true);
              // Aguardar um pouco para mostrar o toast antes de redirecionar
              setTimeout(() => {
                router.replace('/(tabs)/routines');
              }, 500);
            } catch (error: any) {
              console.error('Erro ao excluir rotina:', error);
              Alert.alert(
                'Erro',
                error?.message || 'Não foi possível excluir a rotina. Tente novamente.'
              );
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleDuplicateRoutine = () => {
    if (!routine) return;
    // Navegar para criar rotina com os dados duplicados
    router.push(`/create-routine?duplicate=${routine.id}`);
  };

  if (!routine) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Rotina não encontrada' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Rotina não encontrada</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: routine.name,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#111827',
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.routineName}>{routine.name}</Text>
          {routine.description && (
            <Text style={styles.routineDescription}>{routine.description}</Text>
          )}

          {routine.daysOfWeek && routine.daysOfWeek.length > 0 && (
            <View style={styles.daysRow}>
              {routine.daysOfWeek.map((day) => (
                <View key={day} style={styles.dayChip}>
                  <Text style={styles.dayChipText}>{DAY_NAMES[day]}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Dumbbell size={20} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>{averageStats.exercises}</Text>
            <Text style={styles.statLabel}>Exercícios</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Target size={20} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{averageStats.sets}</Text>
            <Text style={styles.statLabel}>Séries média</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Clock size={20} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>
              {averageStats.duration > 0 ? formatDuration(averageStats.duration) : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Tempo médio</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={20} color="#8b5cf6" />
            </View>
            <Text style={styles.statValue}>
              {averageStats.volume > 0 ? `${(averageStats.volume / 1000).toFixed(1)}K` : '0'}
            </Text>
            <Text style={styles.statLabel}>Volume médio</Text>
          </View>
        </View>

        {lastWorkout && (
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Último Treino</Text>
            <Text style={styles.infoCardText}>{formatDate(lastWorkout.date)}</Text>
          </View>
        )}

        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>Exercícios da Rotina</Text>

          {routine.exercises.map((routineEx) => {
            const isExpanded = expandedExercises.has(routineEx.id);
            const history = getExerciseHistory(routineEx.exerciseId);
            const pr = getPersonalRecord(routineEx.exerciseId);
            const lastPerformance = history[0];

            return (
              <View key={routineEx.id} style={styles.exerciseCard}>
                <TouchableOpacity
                  style={styles.exerciseHeader}
                  onPress={() => toggleExercise(routineEx.id)}
                >
                  <View style={styles.exerciseHeaderLeft}>
                    <Text style={styles.exerciseName}>{routineEx.exercise.name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {routineEx.targetSets} × {routineEx.targetReps} reps •{' '}
                      {routineEx.restTime}s descanso
                    </Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={20} color="#9ca3af" />
                  ) : (
                    <ChevronDown size={20} color="#9ca3af" />
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.exerciseDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Séries alvo:</Text>
                      <Text style={styles.detailValue}>{routineEx.targetSets} séries</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Repetições alvo:</Text>
                      <Text style={styles.detailValue}>{routineEx.targetReps} reps</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Descanso:</Text>
                      <Text style={styles.detailValue}>{routineEx.restTime}s</Text>
                    </View>

                    {routineEx.targetWeight && routineEx.targetWeight > 0 && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Peso sugerido:</Text>
                        <Text style={styles.detailValue}>{routineEx.targetWeight} kg</Text>
                      </View>
                    )}

                    {lastPerformance && (
                      <View style={styles.historySection}>
                        <Text style={styles.historySectionTitle}>Último Treino</Text>
                        <Text style={styles.historyText}>
                          Realizado em {formatDate(lastPerformance.workout.date)}
                        </Text>
                        <View style={styles.lastSetsContainer}>
                          {lastPerformance.exercise.sets
                            .filter((s) => s.completed)
                            .slice(0, 3)
                            .map((set, index) => (
                              <View key={set.id} style={styles.lastSetChip}>
                                <Text style={styles.lastSetText}>
                                  {set.weight}kg × {set.reps}
                                </Text>
                              </View>
                            ))}
                        </View>
                      </View>
                    )}

                    {pr && pr.weight > 0 && (
                      <View style={styles.prSection}>
                        <Text style={styles.prSectionTitle}>Recorde Pessoal</Text>
                        <View style={styles.prCard}>
                          <View style={styles.prRow}>
                            <Text style={styles.prLabel}>Melhor carga:</Text>
                            <Text style={styles.prValue}>
                              {pr.weight} kg × {pr.reps} reps
                            </Text>
                          </View>
                          <View style={styles.prRow}>
                            <Text style={styles.prLabel}>1RM estimado:</Text>
                            <Text style={styles.prValue}>{pr.estimatedOneRepMax.toFixed(1)} kg</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {routineEx.notes && (
                      <View style={styles.notesSection}>
                        <Text style={styles.notesSectionTitle}>Observações</Text>
                        <Text style={styles.notesText}>{routineEx.notes}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleEditRoutine}>
          <Edit size={20} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleDuplicateRoutine}>
          <Copy size={20} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Duplicar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.secondaryButton, styles.deleteButton]} 
          onPress={handleDeleteRoutine}
        >
          <Trash2 size={20} color={colors.error} />
          <Text style={[styles.secondaryButtonText, { color: colors.error }]}>Excluir</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={handleStartWorkout}>
          <Play size={20} color={colors.textOnPrimary} fill={colors.textOnPrimary} />
          <Text style={styles.primaryButtonText}>Iniciar</Text>
        </TouchableOpacity>
      </View>

      <Toast
        message={toastMessage}
        type={toastMessage.includes('sucesso') ? 'success' : 'error'}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  headerSection: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  routineName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
  },
  routineDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    backgroundColor: '#3b82f615',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#3b82f630',
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#3b82f6',
  },
  statsSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  exercisesSection: {
    padding: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  exerciseHeaderLeft: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  exerciseMeta: {
    fontSize: 14,
    color: '#6b7280',
  },
  exerciseDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
  },
  historySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  historySectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  historyText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  lastSetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lastSetChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  lastSetText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#374151',
  },
  prSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  prSectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  prCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  prLabel: {
    fontSize: 14,
    color: '#92400e',
  },
  prValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#78350f',
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  notesSectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.textSecondary + '20',
    padding: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  deleteButton: {
    borderColor: colors.error,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700' as const,
  },
});
