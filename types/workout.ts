export type MuscleGroup = 
  | 'chest' 
  | 'back' 
  | 'shoulders' 
  | 'biceps' 
  | 'triceps' 
  | 'legs' 
  | 'core' 
  | 'glutes' 
  | 'cardio' 
  | 'other';

export type SetType = 'working' | 'warmup' | 'dropset' | 'failure' | 'superset';

export type EquipmentType = 'barra' | 'halteres' | 'maquina' | 'cabo' | 'peso-corporal';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  isCustom: boolean;
  instructions?: string;
  imageUrl?: string;
  equipment?: EquipmentType;
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  type: SetType;
  completed: boolean;
  restTime?: number;
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  restTime: number;
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  date: Date;
  exercises: WorkoutExercise[];
  duration?: number;
  notes?: string;
  isActive: boolean;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Goal {
  id: string;
  targetKg: number;
  bestKg: number;
  nextMilestoneKg: number | null;
  status: 'active' | 'paused';
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
  restTime: number;
  notes?: string;
  hasGoal?: boolean;  // ⭐ NOVA PROPRIEDADE
  goal?: Goal | null; // ⭐ NOVA PROPRIEDADE
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type WorkoutStatus = 'completed' | 'incomplete' | 'rest' | 'missed';

export interface Routine {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  daysOfWeek: DayOfWeek[];
  createdAt: Date;
  isCustom: boolean;
}

export interface PersonalRecord {
  exerciseId: string;
  weight: number;
  reps: number;
  date: Date;
  estimatedOneRepMax: number;
}
