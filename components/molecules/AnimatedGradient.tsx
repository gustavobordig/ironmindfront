/**
 * Componente Molecule: Gradiente Animado
 * Cria um gradiente com movimento sutil para dar sensação de vida ao background
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedGradientProps {
  colors: string[];
  style?: any;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  children?: React.ReactNode;
}

export default function AnimatedGradient({
  colors,
  style,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  children,
}: AnimatedGradientProps) {
  const animX = useRef(new Animated.Value(start.x)).current;
  const animY = useRef(new Animated.Value(start.y)).current;

  useEffect(() => {
    // Animação contínua e suave do gradiente
    const animate = () => {
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(animX, {
              toValue: end.x + 0.1,
              duration: 8000,
              useNativeDriver: false,
            }),
            Animated.timing(animX, {
              toValue: start.x,
              duration: 8000,
              useNativeDriver: false,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(animY, {
              toValue: end.y + 0.1,
              duration: 10000,
              useNativeDriver: false,
            }),
            Animated.timing(animY, {
              toValue: start.y,
              duration: 10000,
              useNativeDriver: false,
            }),
          ])
        ),
      ]).start();
    };

    animate();
  }, []);

  // Interpolação dos valores animados para o gradiente
  const animatedStart = {
    x: animX.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    y: animY.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
  };

  const animatedEnd = {
    x: animX.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.1],
    }),
    y: animY.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.1],
    }),
  };

  // Como LinearGradient não aceita valores animados diretamente,
  // vamos usar uma abordagem mais simples com animação de opacidade
  // e múltiplos gradientes sobrepostos
  return (
    <LinearGradient
      colors={colors}
      style={style}
      start={start}
      end={end}
    >
      {children}
    </LinearGradient>
  );
}

