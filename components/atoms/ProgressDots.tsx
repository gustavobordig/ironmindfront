/**
 * Componente Atom: Indicador de Progresso (Dots)
 * Usado para mostrar em qual tela o usuário está no relatório
 * Estilo Stories: maior, mais contrastante e animado
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '@/constants/colors';

interface ProgressDotsProps {
  total: number;
  current: number;
}

export default function ProgressDots({ total, current }: ProgressDotsProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Resetar animação quando muda de tela
    scaleAnim.setValue(1);
    
    // Animação de pulso suave no dot ativo
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [current]);

  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === current;
        const isPast = index < current;
        
        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              isPast && styles.dotPast,
              isActive && styles.dotActive,
              isActive && {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textSecondary,
    opacity: 0.3,
  },
  dotPast: {
    backgroundColor: colors.primary,
    opacity: 0.6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    opacity: 1,
  },
});

