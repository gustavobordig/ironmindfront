import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { Workout, WorkoutExercise, WorkoutSet, Exercise, Routine, WorkoutStatus, DayOfWeek, Goal } from '@/types/workout';
import { DEFAULT_EXERCISES } from '@/constants/exercises';
import * as workoutsService from '@/services/workouts.service';
import * as routinesService from '@/services/routines.service';
import * as exercisesService from '@/services/exercises.service';
import * as statsService from '@/services/stats.service';
import {
  convertApiWorkoutToLocal,
  convertApiRoutineToLocal,
  convertApiExerciseToLocal,
  convertApiPersonalRecordToLocal,
  convertApiWorkoutExerciseToLocal,
} from '@/services/converters';
import type { CreateRoutineData } from '@/types/api';

export const [WorkoutProvider, useWorkout] = createContextHook(() => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [allApiExercises, setAllApiExercises] = useState<Exercise[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar dados da API
      const [workoutsResponse, routinesData, exercisesResponse, activeWorkoutData] = await Promise.all([
        workoutsService.getWorkoutHistory().catch(() => ({ workouts: [] })),
        routinesService.getRoutines().catch(() => []),
        exercisesService.getExercises({ limit: 1000 }).catch(() => ({ exercises: [], pagination: {} })),
        workoutsService.getActiveWorkout().catch(() => null),
      ]);

      // Converter e definir treinos
      const workoutsList = workoutsResponse.workouts?.map(convertApiWorkoutToLocal) || [];
      setWorkouts(workoutsList);

      // Definir treino ativo
      if (activeWorkoutData) {
        setActiveWorkout(convertApiWorkoutToLocal(activeWorkoutData));
      }

      // Converter e definir rotinas
      const routinesList = routinesData.map(convertApiRoutineToLocal);
      setRoutines(routinesList);

      // Converter e definir exercícios
      const exercisesList = exercisesResponse.exercises?.map(convertApiExerciseToLocal) || [];
      setAllApiExercises(exercisesList);
      
      // Separar exercícios customizados
      const custom = exercisesList.filter(ex => ex.isCustom);
      setCustomExercises(custom);
    } catch (error) {
      console.error('Error loading data from API:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllExercises = useCallback(() => {
    // Combinar exercícios padrão com exercícios da API
    const apiExerciseIds = new Set(allApiExercises.map(ex => ex.id));
    const defaultNotInApi = DEFAULT_EXERCISES.filter(ex => !apiExerciseIds.has(ex.id));
    return [...defaultNotInApi, ...allApiExercises];
  }, [allApiExercises]);

  const startWorkout = useCallback(async (name: string, fromRoutine?: Routine) => {
    try {
      const workoutData = await workoutsService.startWorkout({
        name,
        routineId: fromRoutine?.id,
      });
      
      const newWorkout = convertApiWorkoutToLocal(workoutData);
      setActiveWorkout(newWorkout);
      
      // Recarregar lista de treinos
      const workoutsResponse = await workoutsService.getWorkoutHistory();
      const workoutsList = workoutsResponse.workouts?.map(convertApiWorkoutToLocal) || [];
      setWorkouts(workoutsList);
    } catch (error) {
      console.error('Error starting workout:', error);
      throw error;
    }
  }, []);

  const addExerciseToWorkout = useCallback(async (exercise: Exercise) => {
    if (!activeWorkout) return;

    try {
      const workoutData = await workoutsService.addExerciseToWorkout(
        exercise.id,
        90
      );
      
      const updatedWorkout = convertApiWorkoutToLocal(workoutData);
      setActiveWorkout(updatedWorkout);
    } catch (error) {
      console.error('Error adding exercise to workout:', error);
      throw error;
    }
  }, [activeWorkout]);

  const removeExerciseFromWorkout = useCallback(async (workoutExerciseId: string) => {
    if (!activeWorkout) return;

    try {
      const workoutData = await workoutsService.removeExerciseFromWorkout(workoutExerciseId);
      
      // Verificar se a resposta é um workout válido
      const isWorkout = workoutData && workoutData.name !== undefined && workoutData.exercises !== undefined;
      
      if (isWorkout) {
        const updatedWorkout = convertApiWorkoutToLocal(workoutData);
        if (updatedWorkout && updatedWorkout.id) {
          if (!updatedWorkout.exercises || !Array.isArray(updatedWorkout.exercises)) {
            updatedWorkout.exercises = [];
          }
          setActiveWorkout(updatedWorkout);
        }
      } else {
        // Se a API não retornar workout completo, atualizar localmente
        const updatedExercises = activeWorkout.exercises.filter(ex => ex.id !== workoutExerciseId);
        setActiveWorkout({
          ...activeWorkout,
          exercises: updatedExercises,
        });
      }
    } catch (error) {
      console.error('Error removing exercise from workout:', error);
      throw error;
    }
  }, [activeWorkout]);

  const addSetToExercise = useCallback(async (workoutExerciseId: string, set: Omit<WorkoutSet, 'id'>) => {
    if (!activeWorkout) return;

    try {
      const workoutData = await workoutsService.addSet(workoutExerciseId, {
        reps: set.reps,
        weight: set.weight,
        type: set.type,
      });
      
      const updatedWorkout = convertApiWorkoutToLocal(workoutData);
      setActiveWorkout(updatedWorkout);
      
      // Retornar a série adicionada (encontrar na resposta)
      const exercise = updatedWorkout.exercises.find(ex => ex.id === workoutExerciseId);
      const addedSet = exercise?.sets[exercise.sets.length - 1];
      return addedSet || set as WorkoutSet;
    } catch (error) {
      console.error('Error adding set:', error);
      throw error;
    }
  }, [activeWorkout]);

  const updateSet = useCallback(async (workoutExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    if (!activeWorkout) return;

    try {
      const workoutData = await workoutsService.updateSet(
        workoutExerciseId,
        setId,
        {
          reps: updates.reps,
          weight: updates.weight,
          type: updates.type,
          completed: updates.completed,
        }
      );
      
      console.log('Resposta da API:', workoutData);
      
      // Verificar se a resposta é um workout válido (deve ter 'name' e 'exercises')
      // Se não for, a API está retornando apenas o set atualizado, não o workout completo
      const isWorkout = workoutData && workoutData.name !== undefined && workoutData.exercises !== undefined;
      
      if (!isWorkout) {
        console.warn('API retornou apenas o set, não o workout completo. Atualizando apenas o set localmente.');
        // Atualizar apenas o set localmente sem fazer requisição adicional
        const updatedExercises = activeWorkout.exercises.map(ex => {
          if (ex.id === workoutExerciseId) {
            const updatedSets = ex.sets.map(s => {
              if (s.id === setId) {
                return {
                  ...s,
                  reps: updates.reps !== undefined ? updates.reps : s.reps,
                  weight: updates.weight !== undefined ? updates.weight : s.weight,
                  type: updates.type !== undefined ? updates.type : s.type,
                  completed: updates.completed !== undefined ? updates.completed : s.completed,
                };
              }
              return s;
            });
            return { ...ex, sets: updatedSets };
          }
          return ex;
        });
        
        setActiveWorkout({
          ...activeWorkout,
          exercises: updatedExercises,
        });
        return;
      }
      
      // Se for um workout válido, converter e atualizar normalmente
      const updatedWorkout = convertApiWorkoutToLocal(workoutData);
      
      // Validar que o workout retornado é válido antes de atualizar
      if (updatedWorkout && updatedWorkout.id && updatedWorkout.name) {
        // Se exercises não existir ou não for array, usar array vazio
        if (!updatedWorkout.exercises || !Array.isArray(updatedWorkout.exercises)) {
          console.warn('Exercises inválido no workout, usando array vazio');
          updatedWorkout.exercises = [];
        }
        setActiveWorkout(updatedWorkout);
      } else {
        console.warn('Workout retornado da API é inválido, mantendo estado atual');
      }
    } catch (error) {
      console.error('Error updating set:', error);
      throw error;
    }
  }, [activeWorkout]);

  const deleteSet = useCallback(async (workoutExerciseId: string, setId: string) => {
    if (!activeWorkout) return;

    // Nota: A API pode não ter endpoint para deletar série diretamente
    // Por enquanto, vamos atualizar a série para marcá-la como não completada
    // ou implementar uma lógica alternativa
    try {
      // Se a API não suportar deletar, podemos atualizar para um estado "deletado"
      // Por enquanto, vamos apenas atualizar localmente
      const exercise = activeWorkout.exercises.find(ex => ex.id === workoutExerciseId);
      if (exercise) {
        const updatedSets = exercise.sets.filter(s => s.id !== setId);
        // Atualizar o treino removendo a série
        const updatedWorkout = {
          ...activeWorkout,
          exercises: activeWorkout.exercises.map(ex =>
            ex.id === workoutExerciseId
              ? { ...ex, sets: updatedSets }
              : ex
          ),
        };
        setActiveWorkout(updatedWorkout);
      }
    } catch (error) {
      console.error('Error deleting set:', error);
      throw error;
    }
  }, [activeWorkout]);

  const completeWorkout = useCallback(async (notes?: string) => {
    if (!activeWorkout) return;

    try {
      await workoutsService.completeWorkout(notes);
      setActiveWorkout(null);
      
      // Recarregar lista de treinos
      const workoutsResponse = await workoutsService.getWorkoutHistory();
      const workoutsList = workoutsResponse.workouts?.map(convertApiWorkoutToLocal) || [];
      setWorkouts(workoutsList);
    } catch (error) {
      console.error('Error completing workout:', error);
      throw error;
    }
  }, [activeWorkout]);

  const cancelWorkout = useCallback(async () => {
    if (!activeWorkout) return;

    try {
      await workoutsService.cancelWorkout();
      setActiveWorkout(null);
      
      // Recarregar lista de treinos
      const workoutsResponse = await workoutsService.getWorkoutHistory();
      const workoutsList = workoutsResponse.workouts?.map(convertApiWorkoutToLocal) || [];
      setWorkouts(workoutsList);
    } catch (error) {
      console.error('Error canceling workout:', error);
      throw error;
    }
  }, [activeWorkout]);

  const getDateKey = useCallback((date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, []);

  const getRoutineForDay = useCallback((dayOfWeek: DayOfWeek): Routine | null => {
    return routines.find(r => r.daysOfWeek.includes(dayOfWeek)) || null;
  }, [routines]);

  const getTodayRoutine = useCallback((): Routine | null => {
    const today = new Date().getDay() as DayOfWeek;
    return getRoutineForDay(today);
  }, [getRoutineForDay]);

  const getTodayGoal = useCallback((): { exercise: Exercise; goal: Goal } | null => {
    const todayRoutine = getTodayRoutine();
    if (!todayRoutine) return null;

    // Encontrar o primeiro exercício com meta ativa
    const exerciseWithGoal = todayRoutine.exercises.find(
      ex => ex.hasGoal && ex.goal && ex.goal.status === 'active'
    );

    if (!exerciseWithGoal || !exerciseWithGoal.goal) return null;

    return {
      exercise: exerciseWithGoal.exercise,
      goal: exerciseWithGoal.goal,
    };
  }, [getTodayRoutine]);

  const getWorkoutStatusForDate = useCallback((date: Date): WorkoutStatus | null => {
    const dateKey = getDateKey(date);
    const dayOfWeek = date.getDay() as DayOfWeek;
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Primeiro, verificar se há um treino realizado nesta data (mesmo sem rotina)
    const workoutForDate = workouts.find(w => {
      const workoutDateKey = getDateKey(w.date);
      return workoutDateKey === dateKey && !w.isActive;
    });

    // Se há um treino realizado, verificar se está completo
    if (workoutForDate) {
      const totalSets = workoutForDate.exercises.reduce(
        (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
        0
      );
      const totalExercises = workoutForDate.exercises.length;
      
      // Se tem pelo menos uma série completa, considerar como treino realizado
      if (totalSets > 0) {
        // Se tem rotina programada, calcular taxa de conclusão
        const routineForDay = getRoutineForDay(dayOfWeek);
        if (routineForDay && routineForDay.daysOfWeek.includes(dayOfWeek)) {
          // Verificar se a rotina existia naquela data
          const routineCreatedDate = new Date(routineForDay.createdAt);
          routineCreatedDate.setHours(0, 0, 0, 0);
          
          // Se a rotina existia naquela data, calcular conclusão
          if (routineCreatedDate <= checkDate) {
            const completedExercises = workoutForDate.exercises.filter(
              ex => ex.sets.some(s => s.completed)
            ).length;
            const completionRate = totalExercises > 0 ? completedExercises / totalExercises : 0;
            
            if (completionRate >= 0.8) {
              return 'completed';
            }
            if (completionRate > 0) {
              return 'incomplete';
            }
          }
        }
        // Se não tem rotina programada mas fez treino, marcar como completo
        return 'completed';
      }
    }

    // Se não há treino, verificar se deveria ter (se havia rotina naquela data)
    // Verificar todas as rotinas que incluem este dia da semana
    const routinesForDay = routines.filter(r => r.daysOfWeek.includes(dayOfWeek));

    if (routinesForDay.length === 0) {
      return null;
    }

    // Verificar se alguma rotina existia naquela data
    const routinesThatExisted = routinesForDay.filter(r => {
      const routineCreatedDate = new Date(r.createdAt);
      routineCreatedDate.setHours(0, 0, 0, 0);
      return routineCreatedDate <= checkDate;
    });

    // Se nenhuma rotina existia naquela data, não marcar como missed
    if (routinesThatExisted.length === 0) {
      return null;
    }

    // Se chegou aqui, havia rotina mas não foi feito treino
    return 'missed';
  }, [workouts, routines, getDateKey, getRoutineForDay]);

  const workoutStatuses = useMemo(() => {
    const statuses = new Map<string, WorkoutStatus>();
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);

    // Primeiro, adicionar todos os treinos realizados (mesmo sem rotina)
    workouts.forEach(workout => {
      if (!workout.isActive) {
        const dateKey = getDateKey(workout.date);
        const workoutDate = new Date(workout.date);
        workoutDate.setHours(0, 0, 0, 0);
        const startDateCopy = new Date(startDate);
        startDateCopy.setHours(0, 0, 0, 0);
        
        // Só adicionar se estiver no mês atual
        if (workoutDate >= startDateCopy && workoutDate <= today) {
          const totalSets = workout.exercises.reduce(
            (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
            0
          );
          
          if (totalSets > 0) {
            // Verificar se tem rotina programada para calcular status completo/incompleto
            const status = getWorkoutStatusForDate(workout.date);
            if (status) {
              statuses.set(dateKey, status);
            }
          }
        }
      }
    });

    // Depois, adicionar status para dias com rotina programada (mas sem treino)
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateKey = getDateKey(d);
      // Só adicionar se ainda não tiver status (para não sobrescrever treinos realizados)
      if (!statuses.has(dateKey)) {
        const status = getWorkoutStatusForDate(new Date(d));
        if (status) {
          statuses.set(dateKey, status);
        }
      }
    }

    return statuses;
  }, [workouts, routines, getDateKey, getWorkoutStatusForDate]);

  const createRoutine = useCallback(async (routine: Omit<Routine, 'id' | 'createdAt' | 'isCustom'>) => {
    try {
      const routineData: CreateRoutineData = {
        name: routine.name,
        description: routine.description,
        daysOfWeek: routine.daysOfWeek,
        exercises: routine.exercises.map(re => {
          const exercise: any = {
            exerciseId: re.exerciseId,
            targetSets: re.targetSets,
            restTime: re.restTime,
          };
          
          // Só incluir targetReps se for maior que 0
          if (re.targetReps && re.targetReps > 0) {
            exercise.targetReps = re.targetReps;
          }
          
          // Só incluir targetWeight se for maior que 0
          if (re.targetWeight && re.targetWeight > 0) {
            exercise.targetWeight = re.targetWeight;
          }
          
          // Só incluir notes se existir
          if (re.notes) {
            exercise.notes = re.notes;
          }
          
          return exercise;
        }),
      };
      
      const apiRoutine = await routinesService.createRoutine(routineData);
      const newRoutine = convertApiRoutineToLocal(apiRoutine);
      
      // Usar função de atualização funcional para garantir estado atualizado
      setRoutines(prevRoutines => [...prevRoutines, newRoutine]);
      return newRoutine;
    } catch (error) {
      console.error('Error creating routine:', error);
      throw error;
    }
  }, []);

  const updateRoutine = useCallback(async (id: string, updates: Partial<Routine>) => {
    try {
      const routineData: Partial<CreateRoutineData> = {};
      if (updates.name) routineData.name = updates.name;
      if (updates.description !== undefined) routineData.description = updates.description;
      if (updates.daysOfWeek) routineData.daysOfWeek = updates.daysOfWeek;
      if (updates.exercises) {
        routineData.exercises = updates.exercises.map(re => {
          const exercise: any = {
            exerciseId: re.exerciseId,
            targetSets: re.targetSets,
            restTime: re.restTime,
          };
          
          // Só incluir targetReps se for maior que 0
          if (re.targetReps && re.targetReps > 0) {
            exercise.targetReps = re.targetReps;
          }
          
          // Só incluir targetWeight se for maior que 0
          if (re.targetWeight && re.targetWeight > 0) {
            exercise.targetWeight = re.targetWeight;
          }
          
          // Só incluir notes se existir
          if (re.notes) {
            exercise.notes = re.notes;
          }
          
          return exercise;
        });
      }
      
      const apiRoutine = await routinesService.updateRoutine(id, routineData);
      const updatedRoutine = convertApiRoutineToLocal(apiRoutine);
      
      // Usar função de atualização funcional para garantir estado atualizado
      setRoutines(prevRoutines => prevRoutines.map(r => r.id === id ? updatedRoutine : r));
    } catch (error) {
      console.error('Error updating routine:', error);
      throw error;
    }
  }, []);

  const deleteRoutine = useCallback(async (id: string) => {
    try {
      console.log('Deletando rotina com ID:', id);
      await routinesService.deleteRoutine(id);
      console.log('Rotina deletada com sucesso na API');
      // Usar função de atualização funcional para garantir estado atualizado
      setRoutines(prevRoutines => {
        const filtered = prevRoutines.filter(r => r.id !== id);
        console.log('Rotinas após exclusão:', filtered.length);
        return filtered;
      });
    } catch (error) {
      console.error('Error deleting routine:', error);
      throw error;
    }
  }, []);

  const createCustomExercise = useCallback(async (exercise: Omit<Exercise, 'id' | 'isCustom'>) => {
    try {
      const apiExercise = await exercisesService.createExercise({
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        equipment: exercise.equipment,
        instructions: exercise.instructions,
        imageUrl: exercise.imageUrl,
      });
      
      const newExercise = convertApiExerciseToLocal(apiExercise);
      setCustomExercises([...customExercises, newExercise]);
      setAllApiExercises([...allApiExercises, newExercise]);
      
      return newExercise;
    } catch (error) {
      console.error('Error creating custom exercise:', error);
      throw error;
    }
  }, [customExercises, allApiExercises]);

  const updateCustomExercise = useCallback(async (id: string, updates: Partial<Exercise>) => {
    try {
      const apiExercise = await exercisesService.updateExercise(id, {
        name: updates.name,
        muscleGroup: updates.muscleGroup,
        equipment: updates.equipment,
        instructions: updates.instructions,
        imageUrl: updates.imageUrl,
      });
      
      const updatedExercise = convertApiExerciseToLocal(apiExercise);
      setCustomExercises(customExercises.map(e => e.id === id ? updatedExercise : e));
      setAllApiExercises(allApiExercises.map(e => e.id === id ? updatedExercise : e));
    } catch (error) {
      console.error('Error updating custom exercise:', error);
      throw error;
    }
  }, [customExercises, allApiExercises]);

  const deleteCustomExercise = useCallback(async (id: string) => {
    try {
      await exercisesService.deleteExercise(id);
      setCustomExercises(customExercises.filter(e => e.id !== id));
      setAllApiExercises(allApiExercises.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting custom exercise:', error);
      throw error;
    }
  }, [customExercises, allApiExercises]);

  const updateExerciseRestTime = useCallback(async (workoutExerciseId: string, restTime: number) => {
    if (!activeWorkout) return;

    try {
      // Atualizar localmente por enquanto (a API pode não ter endpoint específico)
      const updatedWorkout = {
        ...activeWorkout,
        exercises: activeWorkout.exercises.map(ex =>
          ex.id === workoutExerciseId ? { ...ex, restTime } : ex
        ),
      };
      setActiveWorkout(updatedWorkout);
    } catch (error) {
      console.error('Error updating exercise rest time:', error);
      throw error;
    }
  }, [activeWorkout]);

  const getExerciseHistory = useCallback(async (exerciseId: string) => {
    try {
      const history = await statsService.getExerciseHistory(exerciseId);
      return history.map(entry => ({
        workout: convertApiWorkoutToLocal(entry.workout),
        exercise: convertApiWorkoutExerciseToLocal(entry.exercise),
      }));
    } catch (error) {
      console.error('Error getting exercise history:', error);
      // Fallback para dados locais
      return workouts
        .filter(w => !w.isActive)
        .flatMap(workout =>
          workout.exercises
            .filter(ex => ex.exerciseId === exerciseId)
            .map(ex => ({
              workout,
              exercise: ex,
            }))
        )
        .sort((a, b) => b.workout.date.getTime() - a.workout.date.getTime());
    }
  }, [workouts]);

  const getPersonalRecord = useCallback(async (exerciseId: string) => {
    try {
      const pr = await statsService.getPersonalRecord(exerciseId);
      if (pr) {
        return convertApiPersonalRecordToLocal(pr);
      }
      
      // Fallback: calcular localmente se não houver PR na API
      const history = await getExerciseHistory(exerciseId);
      let maxWeight = 0;
      let maxReps = 0;
      let prDate = new Date();

      history.forEach(({ exercise }) => {
        exercise.sets.forEach(set => {
          if (set.completed && set.type !== 'warmup') {
            if (set.weight > maxWeight || (set.weight === maxWeight && set.reps > maxReps)) {
              maxWeight = set.weight;
              maxReps = set.reps;
            }
          }
        });
      });

      const estimatedOneRepMax = maxWeight * (1 + maxReps / 30);

      return {
        exerciseId,
        weight: maxWeight,
        reps: maxReps,
        date: prDate,
        estimatedOneRepMax: Math.round(estimatedOneRepMax * 10) / 10,
      };
    } catch (error) {
      console.error('Error getting personal record:', error);
      throw error;
    }
  }, [getExerciseHistory]);

  return {
    workouts: workouts.filter(w => !w.isActive),
    routines,
    customExercises,
    allExercises: getAllExercises(),
    activeWorkout,
    isLoading,
    startWorkout,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    addSetToExercise,
    updateSet,
    deleteSet,
    completeWorkout,
    cancelWorkout,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    createCustomExercise,
    updateCustomExercise,
    deleteCustomExercise,
    getExerciseHistory,
    getPersonalRecord,
    getTodayRoutine,
    getTodayGoal,
    getRoutineForDay,
    getWorkoutStatusForDate,
    workoutStatuses,
    updateExerciseRestTime,
    loadData,
  };
});
