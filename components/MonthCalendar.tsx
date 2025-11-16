import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutStatus } from '@/types/workout';
import { colors } from '@/constants/colors';

interface CalendarDay {
  date: Date;
  status: WorkoutStatus | 'future' | null;
  isToday: boolean;
}

interface MonthCalendarProps {
  workoutStatuses: Map<string, WorkoutStatus>;
}

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const getDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getStatusColor = (status: WorkoutStatus | 'future' | null): string => {
  if (status === 'completed') return colors.success;
  if (status === 'incomplete') return colors.primary;
  if (status === 'rest') return colors.warning;
  if (status === 'missed') return colors.error;
  return 'transparent';
};

export default function MonthCalendar({ workoutStatuses }: MonthCalendarProps) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const days: (CalendarDay | null)[] = [];

  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateKey = getDateKey(date);
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const isFuture = date > today;
    const status = isFuture ? 'future' : workoutStatuses.get(dateKey) || null;

    days.push({
      date,
      status,
      isToday,
    });
  }

  const monthName = firstDayOfMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      <Text style={styles.monthTitle}>{monthName}</Text>
      
      <View style={styles.weekDaysContainer}>
        {DAYS.map((day, index) => (
          <View key={index} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.daysContainer}>
        {days.map((day, index) => (
          <View key={index} style={styles.dayCell}>
            {day ? (
              <View
                style={[
                  styles.dayContent,
                  day.isToday && styles.todayCircle,
                  day.status && day.status !== 'future' && {
                    backgroundColor: getStatusColor(day.status),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    day.isToday && styles.todayText,
                    (day.status === 'completed' ||
                      day.status === 'incomplete' ||
                      day.status === 'rest' ||
                      day.status === 'missed') &&
                      styles.dayTextWithStatus,
                  ]}
                >
                  {day.date.getDate()}
                </Text>
              </View>
            ) : (
              <View style={styles.dayContent} />
            )}
          </View>
        ))}
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Treinou</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>Descanso</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={styles.legendText}>Faltou</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Incompleto</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayContent: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500' as const,
  },
  todayText: {
    color: colors.primary,
    fontWeight: '700' as const,
  },
  dayTextWithStatus: {
    color: colors.textOnPrimary,
    fontWeight: '700' as const,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
