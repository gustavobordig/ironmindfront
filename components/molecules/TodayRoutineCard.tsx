import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, Clock, ChevronRight, Play, Activity } from 'lucide-react-native';
import { router } from 'expo-router';
import { Routine, WorkoutStatus } from '@/types/workout';
import { colors } from '@/constants/colors';
import { useWorkout } from '@/contexts/WorkoutContext';

interface TodayRoutineCardProps {
  onStartWorkout?: () => void;
  onContinueWorkout?: () => void;
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function TodayRoutineCard({
  onStartWorkout: onStartWorkoutProp,
  onContinueWorkout: onContinueWorkoutProp,
}: TodayRoutineCardProps) {
  // Buscar dados dinamicamente do contexto (sempre da API)
  const { getTodayRoutine, startWorkout, getWorkoutStatusForDate, activeWorkout } = useWorkout();
  
  // Sempre usar o dia de hoje
  const today = new Date();
  const dayOfWeek = DAY_NAMES[today.getDay()]; // Sempre calcular o dia atual
  
  // Sempre buscar a rotina do dia de hoje da API
  const todayRoutine = getTodayRoutine();
  const status = getWorkoutStatusForDate(today);

  // Se não houver rotina, mostrar estado vazio
  if (!todayRoutine) {
    return (
      <View style={styles.container}>
        <View style={styles.body}>
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.10)',
              'rgba(255, 255, 255, 0.06)',
              'rgba(0, 0, 0, 0.20)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.bodyGradient}
          >
            <View style={styles.emptyState}>
              <Dumbbell size={32} color="rgba(255, 255, 255, 0.40)" />
              <Text style={styles.emptyStateText}>Nenhum treino programado para hoje</Text>
              <Text style={styles.emptyStateSubtext}>
                Configure uma rotina para {dayOfWeek.toLowerCase()} nas suas rotinas
              </Text>
            </View>
          </LinearGradient>
        </View>
        
        {/* Frame - overlay cinza transparente */}
        <View style={styles.frameOverlay} pointerEvents="none">
          {/* Header Row - dia da semana + filete - dentro do frame */}
          <View style={styles.headerRowFrame}>
            <View style={styles.filete} />
            <Text style={styles.headerText}>{dayOfWeek.toUpperCase()}</Text>
          </View>
          
          {/* Bordas cinza transparente */}
          <View style={styles.frameBorderTop} />
          <View style={styles.frameBorderBottom} />
          <View style={styles.frameBorderLeft} />
          <View style={styles.frameBorderRight} />
          {/* Borda (stroke) */}
          <View style={styles.frameStroke} />
        </View>
      </View>
    );
  }

  // Calcular metadados
  const exerciseCount = todayRoutine.exercises.length;
  const estimatedMinutes = Math.ceil(exerciseCount * 4.5); // ~4.5min por exercício

  // Mostrar apenas os primeiros 3 exercícios na preview
  const previewExercises = todayRoutine.exercises.slice(0, 3);
  const remainingCount = exerciseCount - 3;

  // Descrição padrão se não houver
  const description = todayRoutine.description || 'Treino completo';

  const handleCardPress = () => {
    // Navegar para detalhes da rotina
    if (todayRoutine.id) {
      router.push(`/routine-details?id=${todayRoutine.id}`);
    }
  };

  const handleStartWorkout = async () => {
    // Se já existe um treino ativo, apenas redirecionar
    if (activeWorkout) {
      router.push('/workout');
      return;
    }

    // Se foi passada uma função customizada, usar ela
    if (onStartWorkoutProp) {
      onStartWorkoutProp();
      return;
    }

    // Caso contrário, iniciar o treino usando o contexto
    try {
      await startWorkout(todayRoutine.name, todayRoutine);
      router.push('/workout');
    } catch (error: any) {
      console.error('Error starting workout:', error);
      // Se o erro for 409 (treino ativo), redirecionar para a tela de treino
      if (error?.statusCode === 409 || error?.message?.includes('treino ativo')) {
        router.push('/workout');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Body - glass principal */}
      <View style={styles.body}>
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.10)',
            'rgba(255, 255, 255, 0.06)',
            'rgba(0, 0, 0, 0.20)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bodyGradient}
        >
          {/* Title Row - ícone + Push A */}
        <View style={styles.titleRow}>
          <Dumbbell size={24} color="rgba(255, 255, 255, 0.92)" />
          <Text style={styles.title}>{todayRoutine.name}</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>{description}</Text>

        {/* Meta Row - 4 exercícios + ~20min + chevron */}
        <TouchableOpacity
          style={styles.metaRow}
          onPress={handleCardPress}
          activeOpacity={0.7}
        >
          <View style={styles.metaLeft}>
            <View style={styles.metaItem}>
              <Activity size={16} color="rgba(255, 255, 255, 0.55)" />
              <Text style={styles.metaText}>{exerciseCount} exercícios</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={16} color="rgba(255, 255, 255, 0.55)" />
              <Text style={styles.metaText}>~{estimatedMinutes}min</Text>
            </View>
          </View>
          <ChevronRight size={20} color="rgba(255, 255, 255, 0.45)" />
        </TouchableOpacity>

        {/* Bullets List - preview de exercícios */}
        <View style={styles.bulletsList}>
          {previewExercises.map((routineExercise) => (
            <View key={routineExercise.id} style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                {routineExercise.exercise.name}
              </Text>
            </View>
          ))}
          {remainingCount > 0 && (
            <View style={styles.bulletItem}>
              <Text style={styles.bulletMore}>•</Text>
              <Text style={styles.bulletTextMore}>
                + {remainingCount} {remainingCount === 1 ? 'mais' : 'mais'}
              </Text>
            </View>
          )}
        </View>

        {/* CTA Button - Iniciar Treino */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleStartWorkout}
          activeOpacity={0.8}
        >
          <Play size={20} color="rgba(255, 255, 255, 0.92)" fill="rgba(255, 255, 255, 0.92)" />
          <Text style={styles.ctaButtonText}>Iniciar Treino</Text>
        </TouchableOpacity>
        </LinearGradient>
      </View>
      
      {/* Frame - overlay vidro fumê (apenas nas bordas, não bloqueia o centro) */}
      <View style={styles.frameOverlay} pointerEvents="none">
        {/* Header Row - QUARTA + filete - dentro do frame (vidro fumê) */}
        <View style={styles.headerRowFrame}>
          <View style={styles.filete} />
          <Text style={styles.headerText}>{dayOfWeek.toUpperCase()}</Text>
        </View>
        
        {/* Bordas cinza transparente */}
        <View style={styles.frameBorderTop} />
        <View style={styles.frameBorderBottom} />
        <View style={styles.frameBorderLeft} />
        <View style={styles.frameBorderRight} />
        {/* Borda (stroke) */}
        <View style={styles.frameStroke} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container principal
  container: {
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 32,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  // Body - glass principal (card inteiro)
  body: {
    borderRadius:13, // Reduzido para encaixar nas bordas
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.10)',
    overflow: 'hidden',
    marginTop: 40, // Espaço para o header no frame (aumentado)
    marginBottom: 24,
    marginLeft: 24,
    marginRight: 24,
  },
  // Body Gradient - gradiente interno para o glass effect
  bodyGradient: {
    padding: 16,
    borderRadius: 14, // Reduzido para encaixar nas bordas
  },
  // Frame Overlay - cinza transparente (apenas nas bordas, não bloqueia o centro)
  frameOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    zIndex: 1,
    overflow: 'hidden',
  },
  // Header Row dentro do frame
  headerRowFrame: {
    position: 'absolute',
    top: 14,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  // Stroke (borda)
  frameStroke: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)', // Cinza claro transparente
  },
  // Bordas cinza transparente (mais escuro, mas ainda mais transparente)
  frameBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40, // Aumentado para ser maior que as outras partes
    backgroundColor: 'rgba(30, 31, 34, 0.40)', // Cinza mais escuro mas ainda mais transparente
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  frameBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: 'rgba(30, 31, 34, 0.40)', // Cinza mais escuro mas ainda mais transparente
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  frameBorderLeft: {
    position: 'absolute',
    top: 40, // Ajustado para corresponder à altura aumentada do top
    left: 0,
    bottom: 24,
    width: 24,
    backgroundColor: 'rgba(30, 31, 34, 0.40)', // Cinza mais escuro mas ainda mais transparente
  },
  frameBorderRight: {
    position: 'absolute',
    top: 40, // Ajustado para corresponder à altura aumentada do top
    right: 0,
    bottom: 24,
    width: 24,
    backgroundColor: 'rgba(30, 31, 34, 0.40)', // Cinza mais escuro mas ainda mais transparente
  },
  filete: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#FF8A3D',
    marginRight: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FF8A3D',
  },
  // Title Row
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  // Description
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.70)',
    marginTop: 6,
    marginBottom: 12,
  },
  // Meta Row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.70)',
  },
  // Bullets List
  bulletsList: {
    marginTop: 12,
    marginBottom: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bullet: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.92)',
    marginRight: 8,
  },
  bulletText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  bulletMore: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.55)',
    marginRight: 8,
  },
  bulletTextMore: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.55)',
    fontStyle: 'italic',
  },
  // CTA Button
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 13,
    backgroundColor: '#FF8A3D',
    gap: 8,
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.30,
        shadowRadius: 22,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.70)',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.50)',
    marginTop: 8,
    textAlign: 'center',
  },
});

