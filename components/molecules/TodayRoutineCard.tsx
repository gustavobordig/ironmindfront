import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Dumbbell, Clock, Play, CheckCircle, AlertCircle, Coffee } from 'lucide-react-native';
import { Routine, WorkoutStatus } from '@/types/workout';
import { colors } from '@/constants/colors';

interface TodayRoutineCardProps {
  routine: Routine | null;
  dayOfWeek: string;
  status: WorkoutStatus | null;
  onStartWorkout: () => void;
  onContinueWorkout?: () => void;
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const getStatusInfo = (status: WorkoutStatus | null) => {
  if (status === 'completed') {
    return {
      color: '#22c55e',
      icon: CheckCircle,
      text: 'Treino Concluído',
    };
  }
  if (status === 'incomplete') {
    return {
      color: '#f97316',
      icon: AlertCircle,
      text: 'Treino Incompleto',
    };
  }
  if (status === 'rest') {
    return {
      color: '#fbbf24',
      icon: Coffee,
      text: 'Dia de Descanso',
    };
  }
  return null;
};

export default function TodayRoutineCard({
  routine,
  dayOfWeek,
  status,
  onStartWorkout,
  onContinueWorkout,
}: TodayRoutineCardProps) {
  const statusInfo = getStatusInfo(status);

  if (!routine && status === 'rest') {
    return (
      <View style={styles.card}>
        <View style={styles.restHeader}>
          <Coffee size={24} color="#fbbf24" />
          <Text style={styles.restTitle}>Dia de Descanso</Text>
        </View>
        <Text style={styles.restSubtitle}>Aproveite para recuperar!</Text>
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={styles.card}>
        <Text style={styles.noRoutineTitle}>Nenhuma rotina programada</Text>
        <Text style={styles.noRoutineText}>
          Configure uma rotina para este dia da semana
        </Text>
      </View>
    );
  }

  const estimatedDuration = routine.exercises.length * 5;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.dayLabel}>{dayOfWeek.toUpperCase()}</Text>
          <Text style={styles.routineName}>{routine.name}</Text>
          {routine.description && (
            <Text style={styles.routineDescription}>{routine.description}</Text>
          )}
        </View>
        {statusInfo && (
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <statusInfo.icon size={16} color={statusInfo.color} />
          </View>
        )}
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Dumbbell size={16} color="#6b7280" />
          <Text style={styles.statText}>{routine.exercises.length} exercícios</Text>
        </View>
        <View style={styles.stat}>
          <Clock size={16} color="#6b7280" />
          <Text style={styles.statText}>~{estimatedDuration}min</Text>
        </View>
      </View>

      <View style={styles.exercisesPreview}>
        {routine.exercises.slice(0, 3).map((ex, index) => (
          <Text key={ex.id} style={styles.exerciseItem}>
            • {ex.exercise.name}
          </Text>
        ))}
        {routine.exercises.length > 3 && (
          <Text style={styles.exerciseMore}>+ {routine.exercises.length - 3} mais</Text>
        )}
      </View>

      {status === 'completed' ? (
        <View style={styles.completedBanner}>
          <CheckCircle size={20} color="#22c55e" />
          <Text style={styles.completedText}>Treino Concluído Hoje</Text>
        </View>
      ) : status === 'incomplete' ? (
        <TouchableOpacity
          style={[styles.button, styles.continueButton]}
          onPress={onContinueWorkout}
        >
          <Play size={20} color="#fff" fill="#fff" />
          <Text style={styles.buttonText}>Continuar Treino</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={onStartWorkout}>
          <Play size={20} color="#fff" fill="#fff" />
          <Text style={styles.buttonText}>Iniciar Treino</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  routineName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  routineDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  exercisesPreview: {
    marginBottom: 16,
  },
  exerciseItem: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 6,
    lineHeight: 20,
  },
  exerciseMore: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButton: {
    backgroundColor: colors.warning,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textOnPrimary,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: colors.success + '15',
    borderRadius: 12,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#22c55e',
  },
  restHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  restTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
  },
  restSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  noRoutineTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  noRoutineText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
