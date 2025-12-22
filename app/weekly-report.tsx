/**
 * Tela Principal do Relatório Semanal
 * Navegação tipo Spotify com swipe/tap entre telas
 */

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWeeklyReport } from '@/hooks/useWeeklyReport';
import { useAuth } from '@/contexts/AuthContext';
import ProgressDots from '@/components/atoms/ProgressDots';

// Importar todas as telas do relatório
import ReportOpeningScreen from '@/components/organisms/report-screens/ReportOpeningScreen';
import ReportFrequencyScreen from '@/components/organisms/report-screens/ReportFrequencyScreen';
import ReportVolumeScreen from '@/components/organisms/report-screens/ReportVolumeScreen';
import ReportMuscleHighlightScreen from '@/components/organisms/report-screens/ReportMuscleHighlightScreen';
import ReportTopExerciseScreen from '@/components/organisms/report-screens/ReportTopExerciseScreen';
import ReportPRsScreen from '@/components/organisms/report-screens/ReportPRsScreen';
import ReportInsightScreen from '@/components/organisms/report-screens/ReportInsightScreen';
import ReportFinalScreen from '@/components/organisms/report-screens/ReportFinalScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_SCREENS = 8;

export default function WeeklyReportScreen() {
  const { report, loading, error } = useWeeklyReport();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentScreen, setCurrentScreen] = useState(0);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const screenIndex = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentScreen(screenIndex);
  };

  const goToNextScreen = () => {
    if (currentScreen < TOTAL_SCREENS - 1) {
      const nextScreen = currentScreen + 1;
      scrollViewRef.current?.scrollTo({
        x: nextScreen * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentScreen(nextScreen);
    }
  };

  const goToPreviousScreen = () => {
    if (currentScreen > 0) {
      const previousScreen = currentScreen - 1;
      scrollViewRef.current?.scrollTo({
        x: previousScreen * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentScreen(previousScreen);
    }
  };

  const handleScreenPress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const screenMiddle = SCREEN_WIDTH / 2;
    
    // Tap na direita → avançar, tap na esquerda → voltar (conforme guidelines)
    if (locationX > screenMiddle) {
      goToNextScreen();
    } else {
      goToPreviousScreen();
    }
  };

  const handleShare = () => {
    // Implementar compartilhamento
    console.log('Compartilhar relatório');
  };

  const handlePlanWorkouts = () => {
    router.push('/(tabs)/routines');
  };

  const handleDownloadStats = async () => {
    if (!report) return;
    
    try {
      const { generateWeeklyReportPDF } = await import('@/utils/pdfGenerator');
      await generateWeeklyReportPDF(report, user?.name);
    } catch (error) {
      console.error('Erro ao baixar estatísticas:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando relatório...</Text>
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>
          {error || 'Erro ao carregar relatório'}
        </Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header com dots e botão fechar - estilo Stories */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.progressContainer}>
          <ProgressDots total={TOTAL_SCREENS} current={currentScreen} />
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ScrollView horizontal para navegação entre telas (400-500ms conforme guidelines) */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
        style={styles.scrollView}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleScreenPress}
          style={styles.screenContainer}
        >
          <ReportOpeningScreen report={report} userName={user?.name} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={1}
          onPress={handleScreenPress}
          style={styles.screenContainer}
        >
          <ReportFrequencyScreen report={report} isVisible={currentScreen === 1} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={1}
          onPress={handleScreenPress}
          style={styles.screenContainer}
        >
          <ReportVolumeScreen report={report} isVisible={currentScreen === 2} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={1}
          onPress={handleScreenPress}
          style={styles.screenContainer}
        >
          <ReportMuscleHighlightScreen report={report} isVisible={currentScreen === 3} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={1}
          onPress={handleScreenPress}
          style={styles.screenContainer}
        >
          <ReportTopExerciseScreen report={report} isVisible={currentScreen === 4} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={1}
          onPress={handleScreenPress}
          style={styles.screenContainer}
        >
          <ReportPRsScreen report={report} isVisible={currentScreen === 5} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={1}
          onPress={handleScreenPress}
          style={styles.screenContainer}
        >
          <ReportInsightScreen report={report} />
        </TouchableOpacity>

        <View style={styles.screenContainer}>
          <ReportFinalScreen
            onPlanWorkouts={handlePlanWorkouts}
            onDownloadStats={handleDownloadStats}
            onShare={handleShare}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  progressContainer: {
    flex: 1,
    paddingRight: 16,
  },
  scrollView: {
    flex: 1,
  },
  screenContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
});

