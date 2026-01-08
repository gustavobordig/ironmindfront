import { useWorkout } from '@/contexts/WorkoutContext';
import { useLocalSearchParams, router } from 'expo-router';
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
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import Toast from '@/components/atoms/Toast';
import HeaderGlass from '@/components/molecules/HeaderGlass';
import AppBackground from '@/components/organisms/AppBackground';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function RoutineDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { routines, workouts, startWorkout, getExerciseHistory, getPersonalRecord, deleteRoutine, activeWorkout } =
    useWorkout();

  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exerciseHistories, setExerciseHistories] = useState<Record<string, any[]>>({});
  const [exercisePRs, setExercisePRs] = useState<Record<string, any | null>>({});

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

  // Carregar históricos e PRs dos exercícios
  useEffect(() => {
    if (!routine) return;

    const loadExerciseData = async () => {
      const histories: Record<string, any[]> = {};
      const prs: Record<string, any | null> = {};

      await Promise.all(
        routine.exercises.map(async (routineEx) => {
          try {
            const [history, pr] = await Promise.all([
              getExerciseHistory(routineEx.exerciseId).catch(() => []),
              getPersonalRecord(routineEx.exerciseId).catch(() => null),
            ]);
            histories[routineEx.exerciseId] = history || [];
            prs[routineEx.exerciseId] = pr;
          } catch (error) {
            console.error('Error loading exercise data:', error);
            histories[routineEx.exerciseId] = [];
            prs[routineEx.exerciseId] = null;
          }
        })
      );

      setExerciseHistories(histories);
      setExercisePRs(prs);
    };

    loadExerciseData();
  }, [routine, getExerciseHistory, getPersonalRecord]);

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
      <AppBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <HeaderGlass title="Rotina" onBack={() => router.back()} />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Rotina não encontrada</Text>
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <HeaderGlass title={routine.name} onBack={() => router.back()} />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.headerCardBody}>
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.10)',
                  'rgba(255, 255, 255, 0.06)',
                  'rgba(0, 0, 0, 0.20)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.headerCardGradient}
              >
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
              </LinearGradient>
            </View>
            
            {/* Frame - overlay cinza transparente */}
            <View style={styles.headerCardFrame} pointerEvents="none">
              <View style={styles.headerCardFrameBorderTop} />
              <View style={styles.headerCardFrameBorderBottom} />
              <View style={styles.headerCardFrameBorderLeft} />
              <View style={styles.headerCardFrameBorderRight} />
              <View style={styles.headerCardFrameStroke} />
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <View style={styles.statCardBody}>
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.10)',
                    'rgba(255, 255, 255, 0.06)',
                    'rgba(0, 0, 0, 0.20)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.statCardGradient}
                >
                  <View style={styles.statIconContainer}>
                    <Dumbbell size={24} color="#FF8A3D" />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statValue} numberOfLines={1}>{averageStats.exercises}</Text>
                    <Text style={styles.statLabel} numberOfLines={1}>Exercícios</Text>
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.statCardFrame} pointerEvents="none">
                <View style={styles.statCardFrameBorderTop} />
                <View style={styles.statCardFrameBorderBottom} />
                <View style={styles.statCardFrameBorderLeft} />
                <View style={styles.statCardFrameBorderRight} />
                <View style={styles.statCardFrameStroke} />
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statCardBody}>
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.10)',
                    'rgba(255, 255, 255, 0.06)',
                    'rgba(0, 0, 0, 0.20)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.statCardGradient}
                >
                  <View style={styles.statIconContainer}>
                    <Target size={24} color="#FF8A3D" />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statValue} numberOfLines={1}>{averageStats.sets}</Text>
                    <Text style={styles.statLabel} numberOfLines={1}>Séries média</Text>
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.statCardFrame} pointerEvents="none">
                <View style={styles.statCardFrameBorderTop} />
                <View style={styles.statCardFrameBorderBottom} />
                <View style={styles.statCardFrameBorderLeft} />
                <View style={styles.statCardFrameBorderRight} />
                <View style={styles.statCardFrameStroke} />
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statCardBody}>
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.10)',
                    'rgba(255, 255, 255, 0.06)',
                    'rgba(0, 0, 0, 0.20)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.statCardGradient}
                >
                  <View style={styles.statIconContainer}>
                    <Clock size={24} color="#FF8A3D" />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statValue} numberOfLines={1}>
                      {averageStats.duration > 0 ? formatDuration(averageStats.duration) : 'N/A'}
                    </Text>
                    <Text style={styles.statLabel} numberOfLines={1}>Tempo médio</Text>
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.statCardFrame} pointerEvents="none">
                <View style={styles.statCardFrameBorderTop} />
                <View style={styles.statCardFrameBorderBottom} />
                <View style={styles.statCardFrameBorderLeft} />
                <View style={styles.statCardFrameBorderRight} />
                <View style={styles.statCardFrameStroke} />
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statCardBody}>
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.10)',
                    'rgba(255, 255, 255, 0.06)',
                    'rgba(0, 0, 0, 0.20)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.statCardGradient}
                >
                  <View style={styles.statIconContainer}>
                    <TrendingUp size={24} color="#FF8A3D" />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statValue} numberOfLines={1}>
                      {averageStats.volume > 0 ? `${(averageStats.volume / 1000).toFixed(1)}K` : '0'}
                    </Text>
                    <Text style={styles.statLabel} numberOfLines={1}>Volume médio</Text>
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.statCardFrame} pointerEvents="none">
                <View style={styles.statCardFrameBorderTop} />
                <View style={styles.statCardFrameBorderBottom} />
                <View style={styles.statCardFrameBorderLeft} />
                <View style={styles.statCardFrameBorderRight} />
                <View style={styles.statCardFrameStroke} />
              </View>
            </View>
          </View>

          {lastWorkout && (
            <View style={styles.infoCard}>
              <View style={styles.infoCardBody}>
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.10)',
                    'rgba(255, 255, 255, 0.06)',
                    'rgba(0, 0, 0, 0.20)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.infoCardGradient}
                >
                  <Text style={styles.infoCardTitle}>Último Treino</Text>
                  <Text style={styles.infoCardText}>{formatDate(lastWorkout.date)}</Text>
                </LinearGradient>
              </View>
              
              {/* Frame - overlay cinza transparente */}
              <View style={styles.infoCardFrame} pointerEvents="none">
                <View style={styles.infoCardFrameBorderTop} />
                <View style={styles.infoCardFrameBorderBottom} />
                <View style={styles.infoCardFrameBorderLeft} />
                <View style={styles.infoCardFrameBorderRight} />
                <View style={styles.infoCardFrameStroke} />
              </View>
            </View>
          )}

          <View style={styles.exercisesSection}>
            <Text style={styles.sectionTitle}>Exercícios da Rotina</Text>

            {routine.exercises.map((routineEx) => {
              const isExpanded = expandedExercises.has(routineEx.id);
              const history = exerciseHistories[routineEx.exerciseId] || [];
              const pr = exercisePRs[routineEx.exerciseId] || null;
              const lastPerformance = history[0];

              return (
                <View key={routineEx.id} style={styles.exerciseCard}>
                  <View style={styles.exerciseCardBody}>
                    <LinearGradient
                      colors={[
                        'rgba(255, 255, 255, 0.10)',
                        'rgba(255, 255, 255, 0.06)',
                        'rgba(0, 0, 0, 0.20)',
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.exerciseCardGradient}
                    >
                      <TouchableOpacity
                        style={styles.exerciseHeader}
                        onPress={() => toggleExercise(routineEx.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.exerciseHeaderLeft}>
                          <TouchableOpacity
                            onPress={() => router.push(`/exercise-details?exerciseId=${routineEx.exerciseId}`)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.exerciseName}>{routineEx.exercise.name}</Text>
                          </TouchableOpacity>
                          <Text style={styles.exerciseMeta}>
                            {routineEx.targetSets} × {routineEx.targetReps} reps •{' '}
                            {routineEx.restTime}s descanso
                          </Text>
                        </View>
                        {isExpanded ? (
                          <ChevronUp size={20} color="rgba(255, 255, 255, 0.55)" />
                        ) : (
                          <ChevronDown size={20} color="rgba(255, 255, 255, 0.55)" />
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
                            .filter((s: any) => s.completed)
                            .slice(0, 3)
                            .map((set: any, index: number) => (
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
                    </LinearGradient>
                  </View>
                  
                  {/* Frame - overlay cinza transparente */}
                  <View style={styles.exerciseCardFrame} pointerEvents="none">
                    <View style={styles.exerciseCardFrameBorderTop} />
                    <View style={styles.exerciseCardFrameBorderBottom} />
                    <View style={styles.exerciseCardFrameBorderLeft} />
                    <View style={styles.exerciseCardFrameBorderRight} />
                    <View style={styles.exerciseCardFrameStroke} />
                  </View>
                </View>
              );
            })}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
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
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.70)',
  },
  headerCard: {
    position: 'relative',
    borderRadius: 20,
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
  headerCardBody: {
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 12,
    marginLeft: 12,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  headerCardGradient: {
    padding: 16,
    borderRadius: 13,
  },
  routineDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.70)',
    lineHeight: 24,
    marginBottom: 16,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    backgroundColor: 'rgba(255, 138, 61, 0.20)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 61, 0.30)',
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FF8A3D',
  },
  // Frame - overlay cinza transparente
  headerCardFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    zIndex: 1,
    overflow: 'hidden',
  },
  headerCardFrameStroke: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerCardFrameBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerCardFrameBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerCardFrameBorderLeft: {
    position: 'absolute',
    top: 12,
    left: 0,
    bottom: 12,
    width: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
  },
  headerCardFrameBorderRight: {
    position: 'absolute',
    top: 12,
    right: 0,
    bottom: 12,
    width: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
  },
  statsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    position: 'relative',
    borderRadius: 20,
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
  statCardBody: {
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 12,
    marginLeft: 12,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  statCardGradient: {
    padding: 16,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 80,
    overflow: 'hidden',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 138, 61, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.70)',
    marginTop: 4,
    lineHeight: 16,
  },
  // Frame - overlay cinza transparente para stat cards
  statCardFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    zIndex: 1,
    overflow: 'hidden',
  },
  statCardFrameStroke: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statCardFrameBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statCardFrameBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  statCardFrameBorderLeft: {
    position: 'absolute',
    top: 12,
    left: 0,
    bottom: 12,
    width: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
  },
  statCardFrameBorderRight: {
    position: 'absolute',
    top: 12,
    right: 0,
    bottom: 12,
    width: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
  },
  infoCard: {
    position: 'relative',
    borderRadius: 20,
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
  infoCardBody: {
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 12,
    marginLeft: 12,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  infoCardGradient: {
    padding: 16,
    borderRadius: 13,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.70)',
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  // Frame - overlay cinza transparente
  infoCardFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    zIndex: 1,
    overflow: 'hidden',
  },
  infoCardFrameStroke: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  infoCardFrameBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  infoCardFrameBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  infoCardFrameBorderLeft: {
    position: 'absolute',
    top: 12,
    left: 0,
    bottom: 12,
    width: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
  },
  infoCardFrameBorderRight: {
    position: 'absolute',
    top: 12,
    right: 0,
    bottom: 12,
    width: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
  },
  exercisesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 16,
  },
  exerciseCard: {
    position: 'relative',
    borderRadius: 20,
    marginBottom: 12,
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
  exerciseCardBody: {
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 12,
    marginLeft: 12,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  exerciseCardGradient: {
    padding: 16,
    borderRadius: 13,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseHeaderLeft: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 4,
  },
  exerciseMeta: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.70)',
  },
  exerciseDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
    paddingTop: 16,
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.10)',
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.70)',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  historySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
  },
  historySectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.70)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  historyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.70)',
    marginBottom: 12,
  },
  lastSetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lastSetChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  lastSetText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  prSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
  },
  prSectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.70)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  prCard: {
    backgroundColor: 'rgba(255, 138, 61, 0.15)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 61, 0.25)',
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  prLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.70)',
  },
  prValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FF8A3D',
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
  },
  notesSectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.70)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.92)',
    lineHeight: 20,
  },
  // Frame - overlay cinza transparente
  exerciseCardFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    zIndex: 1,
    overflow: 'hidden',
  },
  exerciseCardFrameStroke: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  exerciseCardFrameBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  exerciseCardFrameBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  exerciseCardFrameBorderLeft: {
    position: 'absolute',
    top: 12,
    left: 0,
    bottom: 12,
    width: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
  },
  exerciseCardFrameBorderRight: {
    position: 'absolute',
    top: 12,
    right: 0,
    bottom: 12,
    width: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    paddingBottom: 20,
    gap: 8,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8A3D',
    borderRadius: 12,
    padding: 16,
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
  primaryButtonText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  deleteButton: {
    borderColor: '#FF5A5A',
  },
  secondaryButtonText: {
    color: '#FF8A3D',
    fontSize: 14,
    fontWeight: '700' as const,
  },
});
