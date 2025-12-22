/**
 * Componente Atom: Número Animado (Count-up)
 * Anima números de 0 até o valor final
 */

import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '@/constants/colors';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  style?: any;
  formatter?: (value: number) => string;
  triggerAnimation?: boolean; // Força a animação a reiniciar quando muda para true
}

// Versão simplificada com listener
// Duração padrão: 700ms (conforme guidelines: 600-800ms para números principais)
export function SimpleAnimatedNumber({
  value,
  duration = 700,
  style,
  formatter,
  triggerAnimation = false,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const previousTriggerRef = useRef(false);

  useEffect(() => {
    // Se triggerAnimation mudou de false para true, reiniciar animação
    if (triggerAnimation && !previousTriggerRef.current) {
      animatedValue.setValue(0);
      setDisplayValue(0);
      
      // Iniciar animação imediatamente
      Animated.timing(animatedValue, {
        toValue: value,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
    
    previousTriggerRef.current = triggerAnimation;

    // Se triggerAnimation não está ativo mas o valor mudou, também animar
    if (!triggerAnimation && value > 0) {
      animatedValue.setValue(0);
      setDisplayValue(0);
      Animated.timing(animatedValue, {
        toValue: value,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.floor(v));
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, duration, triggerAnimation]);

  const formatted = formatter ? formatter(displayValue) : displayValue.toLocaleString('pt-BR');

  return <Text style={[styles.text, style]}>{formatted}</Text>;
}

/**
 * Número animado com suporte a decimais (para percentuais)
 */
export function AnimatedDecimalNumber({
  value,
  duration = 700,
  style,
  decimals = 1,
  suffix = '',
  triggerAnimation = false,
}: {
  value: number;
  duration?: number;
  style?: any;
  decimals?: number;
  suffix?: string;
  triggerAnimation?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const previousTriggerRef = useRef(false);

  useEffect(() => {
    // Se triggerAnimation mudou de false para true, reiniciar animação
    if (triggerAnimation && !previousTriggerRef.current) {
      animatedValue.setValue(0);
      setDisplayValue(0);
      
      // Iniciar animação imediatamente
      Animated.timing(animatedValue, {
        toValue: value,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
    
    previousTriggerRef.current = triggerAnimation;

    // Se triggerAnimation não está ativo mas o valor mudou, também animar
    if (!triggerAnimation && value > 0) {
      animatedValue.setValue(0);
      setDisplayValue(0);
      Animated.timing(animatedValue, {
        toValue: value,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(v);
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, duration, triggerAnimation]);

  const formatted = displayValue.toFixed(decimals) + suffix;

  return <Text style={[styles.text, style]}>{formatted}</Text>;
}

const styles = StyleSheet.create({
  text: {
    color: colors.textPrimary,
  },
});

