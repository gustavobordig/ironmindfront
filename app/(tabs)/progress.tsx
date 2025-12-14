import { useWorkout } from '@/contexts/WorkoutContext';
import { Dumbbell, ChevronDown, X } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MuscleGroup, Exercise } from '@/types/workout';
import { colors } from '@/constants/colors';
import ActiveWorkoutBanner from '@/components/organisms/ActiveWorkoutBanner';
import SimpleLineChart from '@/components/organisms/SimpleLineChart';

const MUSCLE_GROUPS: { label: string; value: MuscleGroup }[] = [
  { label: 'Peito', value: 'chest' },
  { label: 'Costas', value: 'back' },
  { label: 'Ombros', value: 'shoulders' },
  { label: 'Bíceps', value: 'biceps' },
  { label: 'Tríceps', value: 'triceps' },
  { label: 'Pernas', value: 'legs' },
  { label: 'Core', value: 'core' },
];

type ViewMode = 'volume' | 'exercise';
type MetricType = 'weight' | 'reps' | 'volume';
type PeriodFilter = '1' | '2' | '3' | '6' | '12' | 'all';

const PERIOD_OPTIONS: { label: string; value: PeriodFilter }[] = [
  { label: '1 mês', value: '1' },
  { label: '2 meses', value: '2' },
  { label: '3 meses', value: '3' },
  { label: '6 meses', value: '6' },
  { label: '12 meses', value: '12' },
  { label: 'Todos', value: 'all' },
];

export default function ProgressScreen() {
  const { workouts, allExercises } = useWorkout();
  const insets = useSafeAreaInsets();
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup>('chest');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('volume');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('volume');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  // Filtrar treinos por grupo muscular e período
  const filteredWorkouts = useMemo(() => {
    const now = new Date();
    const filtered = workouts
      .filter(workout => {
        // Filtro por grupo muscular
        const hasMuscleGroup = workout.exercises.some(ex => ex.exercise.muscleGroup === selectedMuscle);
        if (!hasMuscleGroup) return false;

        // Filtro por período
        if (periodFilter === 'all') return true;
        
        const monthsAgo = parseInt(periodFilter);
        const cutoffDate = new Date(now);
        cutoffDate.setMonth(cutoffDate.getMonth() - monthsAgo);
        cutoffDate.setHours(0, 0, 0, 0); // Resetar horas para comparar apenas datas
        
        const workoutDate = new Date(workout.date);
        workoutDate.setHours(0, 0, 0, 0);
        
        return workoutDate >= cutoffDate;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return filtered;
  }, [workouts, selectedMuscle, periodFilter]);

  // Calcular volume total por treino
  const volumeData = useMemo(() => {
    return filteredWorkouts.map(workout => {
      const muscleExercises = workout.exercises.filter(
        ex => ex.exercise.muscleGroup === selectedMuscle
      );
      
      const totalVolume = muscleExercises.reduce((sum, ex) => {
        const completedSets = ex.sets.filter(s => s.completed && s.type === 'working');
        return sum + completedSets.reduce((setSum, set) => setSum + set.weight * set.reps, 0);
      }, 0);

      return {
        value: totalVolume,
        label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(workout.date),
        date: workout.date,
      };
    });
  }, [filteredWorkouts, selectedMuscle]);

  // Obter exercícios do grupo muscular selecionado ordenados por frequência
  const availableExercises = useMemo(() => {
    // Contar frequência de cada exercício
    const exerciseFrequency = new Map<string, { exercise: Exercise; count: number }>();
    
    filteredWorkouts.forEach(workout => {
      workout.exercises
        .filter(ex => ex.exercise.muscleGroup === selectedMuscle)
        .forEach(ex => {
          const exerciseId = ex.exercise.id;
          const exercise = allExercises.find(e => e.id === exerciseId);
          if (exercise) {
            const current = exerciseFrequency.get(exerciseId);
            if (current) {
              current.count += 1;
            } else {
              exerciseFrequency.set(exerciseId, { exercise, count: 1 });
            }
          }
        });
    });

    // Converter para array e ordenar por frequência (mais feito primeiro)
    return Array.from(exerciseFrequency.values())
      .sort((a, b) => b.count - a.count)
      .map(item => item.exercise);
  }, [filteredWorkouts, selectedMuscle, allExercises]);

  // Mapa de frequência para uso rápido
  const exerciseFrequencyMap = useMemo(() => {
    const frequencyMap = new Map<string, number>();
    filteredWorkouts.forEach(workout => {
      workout.exercises
        .filter(ex => ex.exercise.muscleGroup === selectedMuscle)
        .forEach(ex => {
          const count = frequencyMap.get(ex.exercise.id) || 0;
          frequencyMap.set(ex.exercise.id, count + 1);
        });
    });
    return frequencyMap;
  }, [filteredWorkouts, selectedMuscle]);

  // Calcular dados de evolução do exercício selecionado
  const exerciseProgression = useMemo(() => {
    if (!selectedExercise || viewMode !== 'exercise') return null;

    const exerciseWorkouts = filteredWorkouts
      .map(workout => {
        const exercise = workout.exercises.find(ex => ex.exercise.id === selectedExercise.id);
        if (!exercise) return null;

        const completedSets = exercise.sets.filter(s => s.completed && s.type === 'working');
        if (completedSets.length === 0) return null;

        const totalVolume = completedSets.reduce((sum, set) => sum + set.weight * set.reps, 0);
        // Peso máximo usado no treino (progressão real)
        const weights = completedSets.map(set => set.weight).filter(w => w > 0);
        const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
        // Reps máxima do treino (progressão real)
        const reps = completedSets.map(set => set.reps).filter(r => r > 0);
        const maxReps = reps.length > 0 ? Math.max(...reps) : 0;

        return {
          workout,
          totalVolume,
          maxWeight,
          maxReps,
          date: workout.date,
        };
      })
      .filter(Boolean) as Array<{
        workout: typeof filteredWorkouts[0];
        totalVolume: number;
        maxWeight: number;
        maxReps: number;
        date: Date;
      }>;

    // Ordenar por data (mais antigo primeiro para progressão cronológica)
    const sortedWorkouts = [...exerciseWorkouts].sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      weight: sortedWorkouts.map(item => ({
        value: item.maxWeight,
        label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(item.date),
        date: item.date,
      })),
      reps: sortedWorkouts.map(item => ({
        value: item.maxReps,
        label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(item.date),
        date: item.date,
      })),
      volume: sortedWorkouts.map(item => ({
        value: item.totalVolume,
        label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(item.date),
        date: item.date,
      })),
    };
  }, [selectedExercise, filteredWorkouts, viewMode]);

  const formatVolume = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return Math.round(value).toString();
  };

  const formatWeight = (value: number) => {
    if (value === 0 || !value || isNaN(value)) return '0kg';
    return `${value.toFixed(1)}kg`;
  };

  const formatReps = (value: number) => {
    if (value === 0 || !value || isNaN(value)) return '0';
    return `${Math.round(value)}`;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Progresso</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Filtros de Grupo Muscular */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterChips}>
              {MUSCLE_GROUPS.map((muscle) => (
                <TouchableOpacity
                  key={muscle.value}
                  style={[
                    styles.filterChip,
                    selectedMuscle === muscle.value && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    setSelectedMuscle(muscle.value);
                    setSelectedExercise(null);
                    setViewMode('volume');
                    setSelectedMetric('volume');
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedMuscle === muscle.value && styles.filterChipTextActive,
                    ]}
                  >
                    {muscle.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Filtro de Período - Select */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowPeriodModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {PERIOD_OPTIONS.find(opt => opt.value === periodFilter)?.label || 'Todos'}
            </Text>
            <ChevronDown size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Modal de Seleção de Período */}
        <Modal
          visible={showPeriodModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPeriodModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPeriodModal(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecionar Período</Text>
                <TouchableOpacity onPress={() => setShowPeriodModal(false)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalOptions}>
                {PERIOD_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.modalOption,
                      periodFilter === option.value && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setPeriodFilter(option.value);
                      setShowPeriodModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        periodFilter === option.value && styles.modalOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Seletor de Métrica (quando modo exercício) */}
        {viewMode === 'exercise' && selectedExercise && (
          <View style={styles.metricSelectorContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.metricChips}>
                <TouchableOpacity
                  style={[
                    styles.metricChip,
                    selectedMetric === 'volume' && styles.metricChipActive,
                  ]}
                  onPress={() => setSelectedMetric('volume')}
                >
                  <Text
                    style={[
                      styles.metricChipText,
                      selectedMetric === 'volume' && styles.metricChipTextActive,
                    ]}
                  >
                    Volume Total
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.metricChip,
                    selectedMetric === 'weight' && styles.metricChipActive,
                  ]}
                  onPress={() => setSelectedMetric('weight')}
                >
                  <Text
                    style={[
                      styles.metricChipText,
                      selectedMetric === 'weight' && styles.metricChipTextActive,
                    ]}
                  >
                    Peso Máximo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.metricChip,
                    selectedMetric === 'reps' && styles.metricChipActive,
                  ]}
                  onPress={() => setSelectedMetric('reps')}
                >
                  <Text
                    style={[
                      styles.metricChipText,
                      selectedMetric === 'reps' && styles.metricChipTextActive,
                    ]}
                  >
                    Repetições Máximas
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Gráfico de Volume Total */}
        {viewMode === 'volume' && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Evolução do Volume Total</Text>
            <Text style={styles.chartSubtitle}>
              Volume total carregado por treino ({MUSCLE_GROUPS.find(m => m.value === selectedMuscle)?.label})
            </Text>
            {volumeData.length > 0 ? (
              <SimpleLineChart
                data={volumeData}
                color={colors.primary}
                formatValue={formatVolume}
              />
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>Sem dados disponíveis</Text>
              </View>
            )}

            {/* Lista de Exercícios */}
            {availableExercises.length > 0 && (
              <View style={styles.exercisesListContainer}>
                <Text style={styles.exercisesListTitle}>Exercícios de {MUSCLE_GROUPS.find(m => m.value === selectedMuscle)?.label}</Text>
                <TouchableOpacity
                  style={[styles.exerciseItem, viewMode === 'volume' && styles.exerciseItemSelected]}
                  onPress={() => {
                    setSelectedExercise(null);
                    setViewMode('volume');
                  }}
                >
                  <Text style={[styles.exerciseItemText, viewMode === 'volume' && styles.exerciseItemTextSelected]}>
                    Músculo no Geral
                  </Text>
                </TouchableOpacity>
                {availableExercises.map((exercise) => {
                  // Obter frequência do mapa
                  const frequency = exerciseFrequencyMap.get(exercise.id) || 0;

                  return (
                    <TouchableOpacity
                      key={exercise.id}
                      style={[
                        styles.exerciseItem,
                        selectedExercise?.id === exercise.id && styles.exerciseItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedExercise(exercise);
                        setViewMode('exercise');
                        setSelectedMetric('volume'); // Resetar para volume total ao selecionar exercício
                      }}
                    >
                      <View style={styles.exerciseItemContent}>
                        <Text
                          style={[
                            styles.exerciseItemText,
                            selectedExercise?.id === exercise.id && styles.exerciseItemTextSelected,
                          ]}
                        >
                          {exercise.name}
                        </Text>
                        <Text style={styles.exerciseItemFrequency}>
                          {frequency} {frequency === 1 ? 'vez' : 'vezes'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Gráfico de Exercício Específico */}
        {viewMode === 'exercise' && selectedExercise && exerciseProgression && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{selectedExercise.name}</Text>
            
            {/* Gráfico baseado na métrica selecionada */}
            {selectedMetric === 'volume' && (
              <>
                <Text style={styles.chartSubtitle}>Volume Total (kg)</Text>
                {exerciseProgression.volume.length > 0 ? (
                  <SimpleLineChart
                    data={exerciseProgression.volume}
                    color={colors.warning}
                    formatValue={formatVolume}
                  />
                ) : (
                  <View style={styles.emptyChart}>
                    <Text style={styles.emptyChartText}>Sem dados</Text>
                  </View>
                )}
              </>
            )}

            {selectedMetric === 'weight' && (
              <>
                <Text style={styles.chartSubtitle}>Peso Máximo (kg)</Text>
                {exerciseProgression.weight.length > 0 ? (
                  <SimpleLineChart
                    data={exerciseProgression.weight}
                    color={colors.primary}
                    formatValue={formatWeight}
                  />
                ) : (
                  <View style={styles.emptyChart}>
                    <Text style={styles.emptyChartText}>Sem dados</Text>
                  </View>
                )}
              </>
            )}

            {selectedMetric === 'reps' && (
              <>
                <Text style={styles.chartSubtitle}>Repetições Máximas</Text>
                {exerciseProgression.reps.length > 0 ? (
                  <SimpleLineChart
                    data={exerciseProgression.reps}
                    color={colors.success}
                    formatValue={formatReps}
                  />
                ) : (
                  <View style={styles.emptyChart}>
                    <Text style={styles.emptyChartText}>Sem dados</Text>
                  </View>
                )}
              </>
            )}

            {/* Lista de Exercícios */}
            {availableExercises.length > 0 && (
              <View style={styles.exercisesListContainer}>
                <Text style={styles.exercisesListTitle}>Exercícios de {MUSCLE_GROUPS.find(m => m.value === selectedMuscle)?.label}</Text>
                <TouchableOpacity
                  style={[styles.exerciseItem, viewMode === 'volume' && styles.exerciseItemSelected]}
                  onPress={() => {
                    setSelectedExercise(null);
                    setViewMode('volume');
                  }}
                >
                  <Text style={[styles.exerciseItemText, viewMode === 'volume' && styles.exerciseItemTextSelected]}>
                    Músculo no Geral
                  </Text>
                </TouchableOpacity>
                {availableExercises.map((exercise) => {
                  // Obter frequência do mapa
                  const frequency = exerciseFrequencyMap.get(exercise.id) || 0;

                  return (
                    <TouchableOpacity
                      key={exercise.id}
                      style={[
                        styles.exerciseItem,
                        selectedExercise?.id === exercise.id && styles.exerciseItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedExercise(exercise);
                        setViewMode('exercise');
                        setSelectedMetric('volume'); // Resetar para volume total ao selecionar exercício
                      }}
                    >
                      <View style={styles.exerciseItemContent}>
                        <Text
                          style={[
                            styles.exerciseItemText,
                            selectedExercise?.id === exercise.id && styles.exerciseItemTextSelected,
                          ]}
                        >
                          {exercise.name}
                        </Text>
                        <Text style={styles.exerciseItemFrequency}>
                          {frequency} {frequency === 1 ? 'vez' : 'vezes'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Estado vazio */}
        {filteredWorkouts.length === 0 && (
          <View style={styles.emptyState}>
            <Dumbbell size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>Nenhum treino encontrado</Text>
            <Text style={styles.emptyStateText}>
              Complete alguns treinos de {MUSCLE_GROUPS.find(m => m.value === selectedMuscle)?.label.toLowerCase()} para ver seu progresso
            </Text>
          </View>
        )}
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
  scrollView: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: 12,
  },
  filterChips: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textOnPrimary,
  },
  metricSelectorContainer: {
    paddingVertical: 12,
  },
  metricChips: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  metricChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  metricChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  metricChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  metricChipTextActive: {
    color: colors.textOnPrimary,
  },
  chartContainer: {
    padding: 20,
    paddingTop: 8,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  subChartContainer: {
    marginTop: 24,
  },
  subChartTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  emptyChart: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  emptyChartText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    paddingTop: 32,
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
  exercisesListContainer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.textSecondary + '20',
  },
  exercisesListTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  exerciseItem: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  exerciseItemSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  exerciseItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseItemText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.textPrimary,
    flex: 1,
  },
  exerciseItemTextSelected: {
    color: colors.primary,
    fontWeight: '700' as const,
  },
  exerciseItemFrequency: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
    marginHorizontal: 20,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    width: '80%',
    maxHeight: '60%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  modalOptions: {
    maxHeight: 300,
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '10',
  },
  modalOptionSelected: {
    backgroundColor: colors.primary + '20',
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500' as const,
  },
  modalOptionTextSelected: {
    color: colors.primary,
    fontWeight: '700' as const,
  },
});
