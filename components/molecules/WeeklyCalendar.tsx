/**
 * Componente Molecule: Calendário Semanal
 * Mostra os dias da semana com destaque para os dias treinados
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '@/constants/colors';

interface WeeklyCalendarProps {
  startDate: Date;
  trainedDays: number[]; // Array com os dias da semana (0-6) que foram treinados
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function WeeklyCalendar({ startDate, trainedDays }: WeeklyCalendarProps) {
  const animatedValues = useRef(
    Array.from({ length: 7 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Animar dias em sequência (stagger)
    const animations = animatedValues.map((animValue, index) =>
      Animated.timing(animValue, {
        toValue: 1,
        duration: 300,
        delay: index * 40,
        useNativeDriver: true,
      })
    );

    Animated.stagger(40, animations).start();
  }, []);

  const getDayOfWeek = (date: Date) => {
    return date.getDay();
  };

  const isTrained = (dayIndex: number) => {
    return trainedDays.includes(dayIndex);
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: 7 }).map((_, index) => {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + index);
        const dayOfWeek = getDayOfWeek(dayDate);
        const trained = isTrained(dayOfWeek);

        const scale = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        });

        const opacity = animatedValues[index];

        return (
          <Animated.View
            key={index}
            style={[
              styles.dayContainer,
              {
                transform: [{ scale }],
                opacity,
              },
            ]}
          >
            <Text style={styles.dayName}>{DAY_NAMES[dayOfWeek]}</Text>
            <View
              style={[
                styles.dayCircle,
                trained && styles.dayCircleTrained,
              ]}
            >
              <Text
                style={[
                  styles.dayNumber,
                  trained && styles.dayNumberTrained,
                ]}
              >
                {dayDate.getDate()}
              </Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  dayContainer: {
    alignItems: 'center',
    gap: 8,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCircleTrained: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayNumberTrained: {
    color: colors.textOnPrimary,
  },
});

