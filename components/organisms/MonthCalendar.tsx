import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutStatus } from '@/types/workout';

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

// Tokens de glass conforme especificação final
const glassTokens = {
  surface: {
    base: 'rgba(255,255,255,0.08)',
    top: 'rgba(255,255,255,0.10)',
    bottom: 'rgba(0,0,0,0.12)',
  },
  border: 'rgba(255,255,255,0.12)',
  text: {
    primary: 'rgba(255,255,255,0.92)',
    secondary: 'rgba(255,255,255,0.65)',
    tertiary: 'rgba(255,255,255,0.45)',
  },
  status: {
    success: '#4CAF6A',
    warning: '#F2C94C',
    danger: '#EB5757',
    incomplete: '#F2994A',
    empty: 'rgba(255,255,255,0.06)',
  },
  emptyText: 'rgba(255,255,255,0.55)',
  radius: {
    card: 20,
    cell: 10,
    pill: 12,
  },
  shadow: {
    outer: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  today: {
    borderColor: '#FF8A3D',
  },
};

// Função para obter cor de status
const getStatusColor = (status: WorkoutStatus | 'future' | null): string => {
  if (status === 'completed') return glassTokens.status.success;
  if (status === 'incomplete') return glassTokens.status.incomplete;
  if (status === 'rest') return glassTokens.status.warning;
  if (status === 'missed') return glassTokens.status.danger;
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

  // Formatar mês/ano: "Dezembro de 2025"
  const monthName = firstDayOfMonth.toLocaleDateString('pt-BR', { month: 'long' });
  const year = firstDayOfMonth.getFullYear();
  const monthTitle = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;

  return (
    <View style={styles.container}>
      {/* Body - glass principal (calendário) */}
      <View style={styles.body}>
        <LinearGradient
          colors={[glassTokens.surface.top, glassTokens.surface.base, glassTokens.surface.bottom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bodyGradient}
        >
          <View style={styles.weekDaysContainer}>
            {DAYS.map((day, index) => (
              <View key={index} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysContainer}>
            {days.map((day, index) => {
              const hasStatus = day && day.status && day.status !== 'future';
              const isEmpty = day && (!day.status || day.status === 'future');
              // Calcular a linha (semana) para aplicar zebrado
              const weekRow = Math.floor(index / 7);
              const isZebraRow = weekRow % 2 === 1; // Linhas ímpares (1, 3, 5...) terão zebrado
              
              return (
                <View key={index} style={styles.dayCell}>
                  {day ? (
                    <View
                      style={[
                        styles.dayContent,
                        isZebraRow && !hasStatus && styles.dayContentZebra, // Aplicar zebrado apenas se não tiver status
                        hasStatus && {
                          backgroundColor: getStatusColor(day.status),
                          opacity: 0.9,
                        },
                        isEmpty && !day.isToday && styles.emptyDay,
                        day.isToday && styles.todayIndicator,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          day.isToday && !hasStatus && styles.todayText,
                          hasStatus && styles.dayTextWithStatus,
                          isEmpty && !day.isToday && styles.emptyDayText,
                        ]}
                      >
                        {day.date.getDate()}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.dayContent, isZebraRow && styles.dayContentZebra]} />
                  )}
                </View>
              );
            })}
          </View>
        </LinearGradient>
      </View>
      
      {/* Frame - overlay vidro fumê (título e legenda) */}
      <View style={styles.frameOverlay} pointerEvents="none">
        {/* Título do mês/ano - dentro do frame */}
        <View style={styles.headerFrame}>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
        </View>
        
        {/* Legenda - dentro do frame */}
        <View style={styles.legendFrame}>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: glassTokens.status.success }]} />
              <Text style={styles.legendText}>Treinou</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: glassTokens.status.warning }]} />
              <Text style={styles.legendText}>Descanso</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: glassTokens.status.danger }]} />
              <Text style={styles.legendText}>Faltou</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: glassTokens.status.incomplete }]} />
              <Text style={styles.legendText}>Incompleto</Text>
            </View>
          </View>
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
  container: {
    marginBottom: 16,
    position: 'relative',
    ...glassTokens.shadow.outer,
  },
  // Body - glass principal (calendário)
  body: {
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    borderBottomLeftRadius: 13, // Border radius na parte de baixo
    borderBottomRightRadius: 13, // Border radius na parte de baixo
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.10)',
    overflow: 'hidden',
    marginTop: 50, // Espaço para o título no frame
    marginBottom: 60, // Espaço para a legenda no frame
    marginLeft: 24,
    marginRight: 24,
  },
  // Body Gradient - gradiente interno para o glass effect
  bodyGradient: {
    paddingTop: 16,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 24, // Padding maior na parte de baixo
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    borderBottomLeftRadius: 13, // Border radius na parte de baixo
    borderBottomRightRadius: 13, // Border radius na parte de baixo
    overflow: 'hidden', // Garantir que o conteúdo respeite o border radius
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
  // Header Frame - título do mês/ano dentro do frame
  headerFrame: {
    position: 'absolute',
    top: 14,
    left: 24,
    zIndex: 2,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: glassTokens.text.primary,
  },
  // Legend Frame - legenda dentro do frame
  legendFrame: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    right: 24,
    zIndex: 2,
    alignItems: 'center', // Centralizar a legenda
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
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  // Bordas cinza transparente
  frameBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50, // Altura para o título
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  frameBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60, // Altura para a legenda
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  frameBorderLeft: {
    position: 'absolute',
    top: 50,
    left: 0,
    bottom: 60,
    width: 24,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
  },
  frameBorderRight: {
    position: 'absolute',
    top: 50,
    right: 0,
    bottom: 60,
    width: 24,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
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
    fontWeight: '500' as const,
    color: glassTokens.text.tertiary,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
  },
  dayContent: {
    flex: 1,
    borderRadius: glassTokens.radius.cell,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
  },
  dayContentZebra: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)', // Cor sutil para o efeito zebrado
  },
  emptyDay: {
    backgroundColor: glassTokens.status.empty,
  },
  todayIndicator: {
    borderWidth: 1,
    borderColor: glassTokens.today.borderColor,
    borderStyle: 'dashed',
  },
  dayText: {
    fontSize: 14,
    color: glassTokens.text.primary,
    fontWeight: '500' as const,
  },
  emptyDayText: {
    color: glassTokens.emptyText,
    fontWeight: '500' as const,
  },
  todayText: {
    color: glassTokens.today.borderColor,
    fontWeight: '700' as const,
  },
  dayTextWithStatus: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center', // Centralizar os itens da legenda
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: glassTokens.text.secondary,
    fontWeight: '400' as const,
  },
});
