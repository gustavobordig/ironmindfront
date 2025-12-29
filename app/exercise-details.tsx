import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dumbbell, Target, Plus } from 'lucide-react-native';
import { useWorkout } from '@/contexts/WorkoutContext';
import HeaderGlass from '@/components/molecules/HeaderGlass';
import AppBackground from '@/components/organisms/AppBackground';
import * as goalsService from '@/services/goals.service';
import type { Goal } from '@/types/workout';

const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: 'Peito',
  back: 'Costas',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  legs: 'Pernas',
  glutes: 'Glúteos',
  core: 'Core',
  cardio: 'Cardio',
  other: 'Outros',
};

export default function ExerciseDetailsScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { allExercises, getExerciseHistory, getPersonalRecord, loadData } = useWorkout();
  
  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoadingGoal, setIsLoadingGoal] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [pr, setPr] = useState<any | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const exercise = useMemo(() => {
    return allExercises.find(ex => ex.id === exerciseId);
  }, [allExercises, exerciseId]);

  useEffect(() => {
    if (!exerciseId) return;

    const loadGoal = async () => {
      try {
        setIsLoadingGoal(true);
        const goalData = await goalsService.getGoalByExercise(exerciseId);
        setGoal(goalData);
      } catch (error) {
        console.error('Error loading goal:', error);
        setGoal(null);
      } finally {
        setIsLoadingGoal(false);
      }
    };

    const loadExerciseData = async () => {
      try {
        setIsLoadingData(true);
        const [historyData, prData] = await Promise.all([
          getExerciseHistory(exerciseId),
          getPersonalRecord(exerciseId),
        ]);
        setHistory(historyData);
        setPr(prData);
      } catch (error) {
        console.error('Error loading exercise data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadGoal();
    loadExerciseData();
  }, [exerciseId, getExerciseHistory, getPersonalRecord]);

  // Recarregar quando a tela receber foco (voltar de criar meta)
  useFocusEffect(
    React.useCallback(() => {
      if (exerciseId) {
        goalsService.getGoalByExercise(exerciseId).then(setGoal).catch(() => setGoal(null));
      }
    }, [exerciseId])
  );

  const handleCreateGoal = () => {
    router.push(`/create-goal?exerciseId=${exerciseId}`);
  };

  const handleEditGoal = () => {
    if (goal) {
      router.push(`/create-goal?exerciseId=${exerciseId}&goalId=${goal.id}`);
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateToFormat = new Date(date);
    dateToFormat.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (dateToFormat.getTime() === today.getTime()) {
      return 'Hoje';
    }
    if (dateToFormat.getTime() === yesterday.getTime()) {
      return 'Ontem';
    }
    
    return dateToFormat.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  if (!exercise) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <HeaderGlass title="Exercício" onBack={() => router.back()} />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Exercício não encontrado</Text>
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  const lastExecution = history[0];
  const daysSinceLastExecution = lastExecution
    ? Math.floor((new Date().getTime() - new Date(lastExecution.workout.date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <AppBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <HeaderGlass
          title="GymTracker"
          onBack={() => router.back()}
        />
        
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Subtítulo - Grupo Muscular */}
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>{MUSCLE_GROUP_LABELS[exercise.muscleGroup] || exercise.muscleGroup}</Text>
          </View>

          {/* Card Principal do Exercício */}
          <View style={styles.exerciseCard}>
            <View style={styles.exerciseCardBody}>
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.05)',
                  'rgba(255, 255, 255, 0.03)',
                  'rgba(0, 0, 0, 0.35)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.exerciseCardGradient}
              >
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMuscleGroup}>
                  {MUSCLE_GROUP_LABELS[exercise.muscleGroup] || exercise.muscleGroup}
                </Text>

                {/* Melhor PR */}
                {pr && (
                  <View style={styles.statsRow}>
                    <Text style={styles.statsLabel}>Melhor PR:</Text>
                    <Text style={styles.statsValue}>{pr.weight} kg</Text>
                  </View>
                )}

                {/* Última Execução */}
                {lastExecution && (
                  <View style={styles.statsRow}>
                    <Text style={styles.statsLabel}>Última:</Text>
                    <Text style={styles.statsValue}>
                      {lastExecution.exercise.sets.filter((s: any) => s.completed).length} × {lastExecution.exercise.sets.find((s: any) => s.completed)?.weight || 0} kg
                      {daysSinceLastExecution !== null && ` após ${daysSinceLastExecution} ${daysSinceLastExecution === 1 ? 'dia' : 'dias'}`}
                    </Text>
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

          {/* Bloco Meta - Estado Vazio ou Ativo */}
          {isLoadingGoal ? (
            <View style={styles.goalCard}>
              <ActivityIndicator size="small" color="#FF8A3D" />
            </View>
          ) : goal ? (
            // Estado COM META
            <View style={styles.goalCard}>
              <View style={styles.goalCardBody}>
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.05)',
                    'rgba(255, 255, 255, 0.03)',
                    'rgba(0, 0, 0, 0.35)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.goalCardGradient, styles.goalCardGradientActive]}
                >
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle}>Meta ativa</Text>
                    <TouchableOpacity
                      onPress={handleEditGoal}
                      style={styles.editGoalButton}
                    >
                      <Text style={styles.editGoalButtonText}>Editar Meta</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.goalDataRow}>
                    <View style={styles.goalDataItem}>
                      <Text style={styles.goalDataLabel}>Meta:</Text>
                      <Text style={styles.goalDataValue}>{goal.targetKg} kg</Text>
                    </View>
                    <View style={styles.goalDataItem}>
                      <Text style={styles.goalDataLabel}>Atual:</Text>
                      <Text style={styles.goalDataValue}>{goal.bestKg} kg</Text>
                    </View>
                    {goal.nextMilestoneKg && (
                      <View style={styles.goalDataItem}>
                        <Text style={styles.goalDataLabel}>Próximo:</Text>
                        <Text style={styles.goalDataValue}>{goal.nextMilestoneKg} kg</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </View>
              
              {/* Frame com borda laranja à esquerda */}
              <View style={styles.goalCardFrame} pointerEvents="none">
                <View style={styles.goalCardFrameBorderLeftAccent} />
                <View style={styles.goalCardFrameBorderTop} />
                <View style={styles.goalCardFrameBorderBottom} />
                <View style={styles.goalCardFrameBorderRight} />
                <View style={styles.goalCardFrameStroke} />
              </View>
            </View>
          ) : (
            // Estado SEM META
            <View style={styles.goalCard}>
              <View style={styles.goalCardBody}>
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.04)',
                    'rgba(255, 255, 255, 0.02)',
                    'rgba(0, 0, 0, 0.30)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.goalCardGradient}
                >
                  <View style={styles.goalEmptyIcon}>
                    <Target size={32} color="rgba(255, 255, 255, 0.50)" />
                  </View>
                  <Text style={styles.goalEmptyTitle}>Meta</Text>
                  <Text style={styles.goalEmptyText}>
                    Nenhuma meta definida para este exercício
                  </Text>
                  <TouchableOpacity
                    style={styles.createGoalButton}
                    onPress={handleCreateGoal}
                    activeOpacity={0.8}
                  >
                    <Plus size={20} color="rgba(255, 255, 255, 0.92)" />
                    <Text style={styles.createGoalButtonText}>Criar Meta</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
              
              {/* Frame - overlay cinza transparente */}
              <View style={styles.goalCardFrame} pointerEvents="none">
                <View style={styles.goalCardFrameBorderTop} />
                <View style={styles.goalCardFrameBorderBottom} />
                <View style={styles.goalCardFrameBorderLeft} />
                <View style={styles.goalCardFrameBorderRight} />
                <View style={styles.goalCardFrameStrokeDashed} />
              </View>
            </View>
          )}

          {/* Histórico */}
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Histórico</Text>
            
            {isLoadingData ? (
              <ActivityIndicator size="small" color="#FF8A3D" style={styles.loadingIndicator} />
            ) : history.length === 0 ? (
              <Text style={styles.emptyHistoryText}>Nenhum histórico disponível</Text>
            ) : (
              <View style={styles.historyList}>
                {history.slice(0, 5).map((entry, index) => {
                  const completedSets = entry.exercise.sets.filter((s: any) => s.completed);
                  const firstSet = completedSets[0];
                  return (
                    <View key={index} style={styles.historyItem}>
                      <View style={styles.historyItemLeft}>
                        <View style={styles.historyCheckbox} />
                        <Text style={styles.historyDate}>{formatDate(new Date(entry.workout.date))}</Text>
                      </View>
                      <Text style={styles.historyValue}>
                        {completedSets.length} × {firstSet?.weight || 0} kg
                      </Text>
                    </View>
                  );
                })}
                {history.length > 5 && (
                  <TouchableOpacity style={styles.seeAllButton}>
                    <Text style={styles.seeAllText}>Ver tudo {'>'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>
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
  },
  subtitleContainer: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.70)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseCard: {
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
  exerciseCardBody: {
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 12,
    marginLeft: 12,
    marginRight: 12,
  },
  exerciseCardGradient: {
    padding: 20,
    borderRadius: 13,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 8,
  },
  exerciseMuscleGroup: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.70)',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.70)',
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FF8A3D',
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
  goalCard: {
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
  goalCardBody: {
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 12,
    marginLeft: 12,
    marginRight: 12,
  },
  goalCardGradient: {
    padding: 24,
    borderRadius: 13,
    alignItems: 'center',
  },
  goalCardGradientActive: {
    alignItems: 'flex-start',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  editGoalButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 138, 61, 0.20)',
  },
  editGoalButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FF8A3D',
  },
  goalDataRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  goalDataItem: {
    flex: 1,
  },
  goalDataLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.70)',
    marginBottom: 4,
  },
  goalDataValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  goalEmptyIcon: {
    marginBottom: 12,
  },
  goalEmptyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 8,
  },
  goalEmptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.70)',
    textAlign: 'center',
    marginBottom: 20,
  },
  createGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF8A3D',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
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
  createGoalButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  // Frame - overlay cinza transparente
  goalCardFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    zIndex: 1,
    overflow: 'hidden',
  },
  goalCardFrameStroke: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  goalCardFrameStrokeDashed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderStyle: 'dashed',
  },
  goalCardFrameBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  goalCardFrameBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  goalCardFrameBorderLeft: {
    position: 'absolute',
    top: 12,
    left: 0,
    bottom: 12,
    width: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
  },
  goalCardFrameBorderRight: {
    position: 'absolute',
    top: 12,
    right: 0,
    bottom: 12,
    width: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
  },
  goalCardFrameBorderLeftAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#FF8A3D',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 12,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  historyValue: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.70)',
  },
  seeAllButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF8A3D',
    fontWeight: '600' as const,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.70)',
    textAlign: 'center',
    paddingVertical: 24,
  },
  loadingIndicator: {
    marginVertical: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.70)',
  },
});

