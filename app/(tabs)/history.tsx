import { useWorkout } from '@/contexts/WorkoutContext';
import { Workout, WorkoutExercise } from '@/types/workout';
import { ChevronDown, ChevronUp, Filter, Trophy } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import ActiveWorkoutBanner from '@/components/organisms/ActiveWorkoutBanner';

type PeriodFilter = '7' | '30' | '90' | 'all';

const PERIOD_OPTIONS: { label: string; value: PeriodFilter }[] = [
  { label: '7 dias', value: '7' },
  { label: '30 dias', value: '30' },
  { label: '90 dias', value: '90' },
  { label: 'Todos', value: 'all' },
];

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export default function HistoryScreen() {
  const { workouts, getPersonalRecord } = useWorkout();
  const insets = useSafeAreaInsets();

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('30');
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());

  const filteredWorkouts = useMemo(() => {
    const now = new Date();
    const filtered = workouts.filter((w) => {
      if (periodFilter === 'all') return true;

      const days = parseInt(periodFilter);
      const diff = (now.getTime() - w.date.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= days;
    });

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [workouts, periodFilter]);

  const toggleWorkout = (workoutId: string) => {
    const newExpanded = new Set(expandedWorkouts);
    if (newExpanded.has(workoutId)) {
      newExpanded.delete(workoutId);
    } else {
      newExpanded.add(workoutId);
    }
    setExpandedWorkouts(newExpanded);
  };

  const toggleExercise = (key: string) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedExercises(newExpanded);
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    const dayOfWeek = DAY_NAMES[date.getDay()];
    return `${day} de ${month}, ${year} • ${dayOfWeek}`;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  const calculateTotalVolume = (workout: Workout) => {
    let total = 0;
    workout.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.completed && set.type !== 'warmup') {
          total += set.weight * set.reps;
        }
      });
    });
    return total;
  };

  const calculateTotalSets = (workout: Workout) => {
    let total = 0;
    workout.exercises.forEach((ex) => {
      total += ex.sets.filter((s) => s.completed).length;
    });
    return total;
  };

  const getExerciseVolume = (exercise: WorkoutExercise) => {
    let total = 0;
    exercise.sets.forEach((set) => {
      if (set.completed && set.type !== 'warmup') {
        total += set.weight * set.reps;
      }
    });
    return total;
  };

  const countPRs = (workout: Workout) => {
    let count = 0;
    workout.exercises.forEach((ex) => {
      const pr = getPersonalRecord(ex.exerciseId);
      ex.sets.forEach((set) => {
        if (
          set.completed &&
          set.type !== 'warmup' &&
          set.weight === pr.weight &&
          set.reps === pr.reps
        ) {
          count++;
        }
      });
    });
    return count;
  };

  const getSetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      working: 'Normal',
      warmup: 'Aquecimento',
      dropset: 'Drop Set',
      failure: 'Falha',
      superset: 'Superconjunto',
    };
    return labels[type] || type;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Histórico</Text>
      </View>

      <View style={styles.filterContainer}>
        <Filter size={16} color="#6b7280" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterButtons}>
            {PERIOD_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterButton,
                  periodFilter === option.value && styles.filterButtonActive,
                ]}
                onPress={() => setPeriodFilter(option.value)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    periodFilter === option.value && styles.filterButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredWorkouts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Nenhum treino encontrado</Text>
            <Text style={styles.emptyStateText}>
              Complete treinos para ver seu histórico aqui
            </Text>
          </View>
        )}

        {filteredWorkouts.map((workout) => {
          const isExpanded = expandedWorkouts.has(workout.id);
          const totalVolume = calculateTotalVolume(workout);
          const totalSets = calculateTotalSets(workout);
          const prCount = countPRs(workout);

          return (
            <View key={workout.id} style={styles.workoutCard}>
              <TouchableOpacity
                style={styles.workoutHeader}
                onPress={() => toggleWorkout(workout.id)}
              >
                <View style={styles.workoutHeaderLeft}>
                  <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <View style={styles.workoutMeta}>
                    <Text style={styles.workoutMetaText}>
                      {formatDuration(workout.duration)}
                    </Text>
                    <Text style={styles.workoutMetaDot}>•</Text>
                    <Text style={styles.workoutMetaText}>
                      {workout.exercises.length} exercícios
                    </Text>
                    {prCount > 0 && (
                      <>
                        <Text style={styles.workoutMetaDot}>•</Text>
                        <View style={styles.prBadge}>
                          <Trophy size={12} color="#f59e0b" />
                          <Text style={styles.prBadgeText}>{prCount} PRs</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
                {isExpanded ? (
                  <ChevronUp size={24} color={colors.textSecondary} />
                ) : (
                  <ChevronDown size={24} color="#6b7280" />
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.workoutDetails}>
                  <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                        {formatDuration(workout.duration)}
                      </Text>
                      <Text style={styles.statLabel} numberOfLines={1}>
                        Duração
                      </Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statValue} numberOfLines={1}>
                        {totalSets}
                      </Text>
                      <Text style={styles.statLabel} numberOfLines={1}>
                        Séries
                      </Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                        {totalVolume.toLocaleString('pt-BR')}
                      </Text>
                      <Text style={styles.statLabel} numberOfLines={1}>
                        Volume (kg)
                      </Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statValue} numberOfLines={1}>
                        {workout.exercises.length}
                      </Text>
                      <Text style={styles.statLabel} numberOfLines={1}>
                        Exercícios
                      </Text>
                    </View>
                  </View>

                  <View style={styles.exercisesSection}>
                    <Text style={styles.exercisesSectionTitle}>Exercícios</Text>
                    {workout.exercises.map((ex) => {
                      const exerciseKey = `${workout.id}-${ex.id}`;
                      const isExerciseExpanded = expandedExercises.has(exerciseKey);
                      const exerciseVolume = getExerciseVolume(ex);
                      const completedSets = ex.sets.filter((s) => s.completed).length;

                      return (
                        <View key={ex.id} style={styles.exerciseCard}>
                          <TouchableOpacity
                            style={styles.exerciseHeader}
                            onPress={() => toggleExercise(exerciseKey)}
                          >
                            <View style={styles.exerciseHeaderLeft}>
                              <Text style={styles.exerciseName}>{ex.exercise.name}</Text>
                              <Text style={styles.exerciseMeta}>
                                {completedSets} séries • {exerciseVolume.toLocaleString('pt-BR')}{' '}
                                kg
                              </Text>
                            </View>
                            {isExerciseExpanded ? (
                              <ChevronUp size={20} color="#9ca3af" />
                            ) : (
                              <ChevronDown size={20} color="#9ca3af" />
                            )}
                          </TouchableOpacity>

                          {isExerciseExpanded && (
                            <View style={styles.setsSection}>
                              {ex.sets
                                .filter((s) => s.completed)
                                .map((set, index) => (
                                  <View key={set.id} style={styles.setRow}>
                                    <Text style={styles.setNumber}>S{index + 1}</Text>
                                    <View style={styles.setDetails}>
                                      <Text style={styles.setDetailText}>
                                        {set.weight} kg × {set.reps} reps
                                      </Text>
                                      <Text style={styles.setType}>
                                        {getSetTypeLabel(set.type)}
                                      </Text>
                                    </View>
                                    <Text style={styles.setVolume}>
                                      {(set.weight * set.reps).toFixed(0)} kg
                                    </Text>
                                  </View>
                                ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {workout.notes && (
                    <View style={styles.notesSection}>
                      <Text style={styles.notesSectionTitle}>Observações</Text>
                      <Text style={styles.notesText}>{workout.notes}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
      <ActiveWorkoutBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.textOnPrimary,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 8,  
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  workoutCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  workoutHeaderLeft: {
    flex: 1,
  },
  workoutDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  workoutName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  workoutMetaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  workoutMetaDot: {
    fontSize: 13,
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  prBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textOnPrimary,
  },
  workoutDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.textSecondary + '20',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 75,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
    minHeight: 24,
    includeFontPadding: false,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500' as const,
    width: '100%',
  },
  exercisesSection: {
    padding: 16,
    paddingTop: 8,
  },
  exercisesSectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  exerciseHeaderLeft: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  exerciseMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  setsSection: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 6,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.primary,
    width: 32,
  },
  setDetails: {
    flex: 1,
  },
  setDetailText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  setType: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  setVolume: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  notesSection: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.textSecondary + '20',
  },
  notesSectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
