import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useWorkout } from '@/contexts/WorkoutContext';

interface TodayGoalCardProps {
  onPress?: () => void;
}

export default function TodayGoalCard({ onPress }: TodayGoalCardProps) {
  const { getTodayGoal } = useWorkout();
  const todayGoal = getTodayGoal();

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else if (todayGoal) {
      // Navegar para detalhes do exercício
      router.push(`/exercise-details?exerciseId=${todayGoal.exercise.id}`);
    }
  };

  // Se não houver meta, não renderizar o card
  if (!todayGoal) {
    return null;
  }

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
          {/* Title Row - ícone + nome do exercício */}
          <TouchableOpacity
            style={styles.contentRow}
            onPress={handleCardPress}
            activeOpacity={0.7}
          >
            <View style={styles.titleRow}>
              <Dumbbell size={24} color="rgba(255, 255, 255, 0.92)" />
              <Text style={styles.title}>{todayGoal.exercise.name}</Text>
            </View>
            <ChevronRight size={20} color="rgba(255, 255, 255, 0.45)" />
          </TouchableOpacity>

          {/* Objetivo */}
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Objetivo:</Text>
            <Text style={styles.goalValue}>{todayGoal.goal.targetKg} kg</Text>
          </View>
        </LinearGradient>
      </View>
      
      {/* Frame - overlay cinza transparente (apenas nas bordas, não bloqueia o centro) */}
      <View style={styles.frameOverlay} pointerEvents="none">
        {/* Header Row - Meta de hoje + filete - dentro do frame */}
        <View style={styles.headerRowFrame}>
          <View style={styles.filete} />
          <Text style={styles.headerText}>META DE HOJE</Text>
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
    borderRadius: 13, // Reduzido para encaixar nas bordas
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.10)',
    overflow: 'hidden',
    marginTop: 40, // Espaço para o header no frame
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
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  // Content Row - título + chevron
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  // Goal Row
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.70)',
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FF8A3D', // Laranja para o valor
  },
});

