/**
 * Funções auxiliares para converter entre tipos da API e tipos locais
 */

import type {
  Workout as ApiWorkout,
  Routine as ApiRoutine,
  Exercise as ApiExercise,
  WorkoutExercise as ApiWorkoutExercise,
  WorkoutSet as ApiWorkoutSet,
  RoutineExercise as ApiRoutineExercise,
  PersonalRecord as ApiPersonalRecord,
} from '@/types/api';

import type {
  Workout,
  Routine,
  Exercise,
  WorkoutExercise,
  WorkoutSet,
  RoutineExercise,
  PersonalRecord,
} from '@/types/workout';

/**
 * Converte um Exercise da API para o tipo local
 */
export function convertApiExerciseToLocal(apiExercise: ApiExercise): Exercise {
  return {
    id: apiExercise.id,
    name: apiExercise.name,
    muscleGroup: apiExercise.muscleGroup,
    isCustom: apiExercise.isCustom,
    equipment: apiExercise.equipment,
    instructions: apiExercise.instructions,
    imageUrl: apiExercise.imageUrl,
  };
}

/**
 * Converte um WorkoutSet da API para o tipo local
 */
export function convertApiSetToLocal(apiSet: ApiWorkoutSet): WorkoutSet {
  return {
    id: apiSet.id,
    reps: apiSet.reps,
    weight: apiSet.weight,
    type: apiSet.type,
    completed: apiSet.completed,
  };
}

/**
 * Converte um WorkoutExercise da API para o tipo local
 */
export function convertApiWorkoutExerciseToLocal(
  apiExercise: ApiWorkoutExercise
): WorkoutExercise {
  return {
    id: apiExercise.id,
    exerciseId: apiExercise.exerciseId,
    exercise: convertApiExerciseToLocal(apiExercise.exercise),
    sets: apiExercise.sets.map(convertApiSetToLocal),
    restTime: apiExercise.restTime,
    notes: apiExercise.notes,
  };
}

/**
 * Converte um Workout da API para o tipo local
 */
export function convertApiWorkoutToLocal(apiWorkout: ApiWorkout): Workout {
  return {
    id: apiWorkout.id,
    name: apiWorkout.name,
    date: new Date(apiWorkout.date),
    exercises: (apiWorkout.exercises || []).map(convertApiWorkoutExerciseToLocal),
    duration: apiWorkout.duration,
    notes: apiWorkout.notes,
    isActive: apiWorkout.isActive,
    startedAt: apiWorkout.startedAt ? new Date(apiWorkout.startedAt) : undefined,
    completedAt: apiWorkout.completedAt
      ? new Date(apiWorkout.completedAt)
      : undefined,
  };
}

/**
 * Converte um RoutineExercise da API para o tipo local
 */
export function convertApiRoutineExerciseToLocal(
  apiRoutineExercise: ApiRoutineExercise
): RoutineExercise {
  return {
    id: apiRoutineExercise.id,
    exerciseId: apiRoutineExercise.exerciseId,
    exercise: convertApiExerciseToLocal(apiRoutineExercise.exercise),
    targetSets: apiRoutineExercise.targetSets,
    targetReps: apiRoutineExercise.targetReps,
    targetWeight: apiRoutineExercise.targetWeight,
    restTime: apiRoutineExercise.restTime,
    notes: apiRoutineExercise.notes,
  };
}

/**
 * Converte um Routine da API para o tipo local
 */
export function convertApiRoutineToLocal(apiRoutine: ApiRoutine): Routine {
  return {
    id: apiRoutine.id,
    name: apiRoutine.name,
    description: apiRoutine.description,
    exercises: apiRoutine.exercises.map(convertApiRoutineExerciseToLocal),
    daysOfWeek: apiRoutine.daysOfWeek as Routine['daysOfWeek'],
    createdAt: new Date(apiRoutine.createdAt),
    isCustom: apiRoutine.isCustom,
  };
}

/**
 * Converte um PersonalRecord da API para o tipo local
 */
export function convertApiPersonalRecordToLocal(
  apiPR: ApiPersonalRecord
): PersonalRecord {
  return {
    exerciseId: apiPR.exerciseId,
    weight: apiPR.weight,
    reps: apiPR.reps,
    date: new Date(apiPR.date),
    estimatedOneRepMax: apiPR.estimatedOneRepMax || 0,
  };
}

