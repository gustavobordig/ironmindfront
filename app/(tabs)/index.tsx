import { useWorkout } from '@/contexts/WorkoutContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut, BarChart3 } from 'lucide-react-native';
import MonthCalendar from '@/components/organisms/MonthCalendar';
import TodayRoutineCard from '@/components/molecules/TodayRoutineCard';
import TodayGoalCard from '@/components/molecules/TodayGoalCard';
import ActiveWorkoutBanner from '@/components/organisms/ActiveWorkoutBanner';
import WeeklyReportModal from '@/components/organisms/WeeklyReportModal';
import { colors } from '@/constants/colors';
import AppBackground from '@/components/organisms/AppBackground';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function HomeScreen() {
  const { getTodayRoutine, getTodayGoal, startWorkout, workoutStatuses, getWorkoutStatusForDate, activeWorkout, loadData } = useWorkout();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const todayRoutine = getTodayRoutine();
  const today = new Date();
  const dayOfWeek = DAY_NAMES[today.getDay()];
  const todayStatus = getWorkoutStatusForDate(today);
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [weeklyReportModal, setWeeklyReportModal] = useState<'summary' | 'prs' | 'insight'>('summary');

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const handleStartWorkout = async () => {
    // Prevenir múltiplas chamadas
    if (isStartingWorkout) {
      return;
    }

    // Se já existe um treino ativo, apenas redirecionar
    if (activeWorkout) {
      router.push('/workout');
      return;
    }

    if (todayRoutine) {
      setIsStartingWorkout(true);
      try {
        await startWorkout(todayRoutine.name, todayRoutine);
        router.push('/workout');
      } catch (error: any) {
        console.error('Error starting workout:', error);
        // Se o erro for 409 (treino ativo), redirecionar para a tela de treino
        if (error?.statusCode === 409 || error?.message?.includes('treino ativo')) {
          router.push('/workout');
        }
      } finally {
        setIsStartingWorkout(false);
      }
    }
  };

  return (
    <AppBackground>
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
        <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.title}>GymTracker</Text>
              <Text style={styles.subtitle}>
                {user ? `Olá, ${user.name}!` : 'Seu progresso, todos os dias'}
              </Text>
            </View>
            {user && (
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={logout}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <LogOut size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <MonthCalendar workoutStatuses={workoutStatuses} />
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Treino de hoje</Text>
            <TodayRoutineCard
              onStartWorkout={handleStartWorkout}
              onContinueWorkout={handleStartWorkout}
            />
          </View>
          
          {getTodayGoal() && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Metas de hoje</Text>
              <TodayGoalCard />
            </View>
          )}
          
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.weeklyReportCard}
              onPress={() => {
                setWeeklyReportModal('summary');
                setShowWeeklyReport(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.weeklyReportContent}>
                <BarChart3 size={24} color={colors.primary} />
                <View style={styles.weeklyReportText}>
                  <Text style={styles.weeklyReportTitle}>Relatório Semanal</Text>
                  <Text style={styles.weeklyReportSubtitle}>Veja seu progresso da semana</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <ActiveWorkoutBanner />
      
      <WeeklyReportModal
        visible={showWeeklyReport}
        onClose={() => setShowWeeklyReport(false)}
        initialModal={weeklyReportModal}
      />
    </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  logoutButton: {
    padding: 8,
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 12,
    marginLeft: 4,
  },
  weeklyReportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    padding: 16,
    marginBottom: 8,
  },
  weeklyReportContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weeklyReportText: {
    flex: 1,
  },
  weeklyReportTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  weeklyReportSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
