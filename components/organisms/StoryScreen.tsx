/**
 * Organism: StoryScreen - Container Base para Telas de Story
 * Força hierarquia: 1 mensagem principal por tela
 * Coreografia de animação: fundo → métrica → complemento
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '@/constants/spacing';

interface StoryScreenProps {
  children: React.ReactNode;
  gradientColors: string[];
  animationDelay?: number;
  style?: ViewStyle;
}

export default function StoryScreen({
  children,
  gradientColors,
  animationDelay = 0,
  style,
}: StoryScreenProps) {
  // Coreografia fixa: fundo → conteúdo
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(20)).current;
  
  const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

  useEffect(() => {
    // 1. Fundo aparece primeiro
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 300,
      delay: animationDelay,
      useNativeDriver: true,
    }).start(() => {
      // 2. Conteúdo entra após fundo
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          easing: easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 500,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [animationDelay]);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: backgroundOpacity },
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
    width: '100%',
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

