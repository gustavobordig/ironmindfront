import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Platform,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { generateWeeklyReport } from '@/services/reports.service';
import type { WeeklyReport } from '@/types/api';
import { colors } from '@/constants/colors';
import WeeklySummaryCard from '@/components/molecules/WeeklySummaryCard';
import PRsCard from '@/components/molecules/PRsCard';
import InsightCard from '@/components/molecules/InsightCard';

export type ModalType = 'summary' | 'prs' | 'insight';

export interface WeeklyReportModalProps {
  visible: boolean;
  onClose: () => void;
  initialModal?: ModalType;
}

const STORIES: { key: ModalType; title: string }[] = [
  { key: 'summary', title: 'Resumo da semana' },
  { key: 'prs', title: 'PRs batidos' },
  { key: 'insight', title: 'Insight da semana' },
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_WIDTH = SCREEN_WIDTH - 60; // Largura do modal com margens (aumentado)
const MODAL_MAX_HEIGHT = SCREEN_HEIGHT * 0.90; // Altura máxima do modal (aumentado)
const STORY_DURATION = 5000; // 5 segundos por story (como Instagram)

/**
 * Componente WeeklyReportModal (Organism)
 * Modal que exibe os relatórios semanais (Resumo, PRs, Insight) em formato Stories
 */
export default function WeeklyReportModal({ 
  visible, 
  onClose, 
  initialModal = 'summary' 
}: WeeklyReportModalProps) {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const progressAnimations = useRef(
    STORIES.map(() => new Animated.Value(0))
  ).current;
  const progressTimers = useRef<Animated.CompositeAnimation[]>([]);
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitializing = useRef(false);
  const currentAnimationIndex = useRef(0);

  // Função para iniciar a animação de progresso do story atual
  const startProgressAnimation = useCallback((index: number) => {
    // Cancelar timers anteriores
    progressTimers.current.forEach(timer => timer.stop());
    progressTimers.current = [];
    
    // Atualizar ref do índice da animação atual
    currentAnimationIndex.current = index;
    
    // Resetar todas as animações
    progressAnimations.forEach(anim => anim.setValue(0));
    
    // Preencher stories anteriores
    for (let i = 0; i < index; i++) {
      progressAnimations[i].setValue(1);
    }
    
    // Animar o story atual
    if (index < STORIES.length) {
      const animation = Animated.timing(progressAnimations[index], {
        toValue: 1,
        duration: STORY_DURATION,
        useNativeDriver: false,
      });
      
      progressTimers.current.push(animation);
      animation.start((finished) => {
        // Só avançar automaticamente se a animação foi completada
        if (finished) {
          // Verificar condições após um pequeno delay para garantir estado atualizado
          setTimeout(() => {
            // Verificar se ainda estamos no mesmo índice (não mudou manualmente)
            if (currentAnimationIndex.current === index && !isPaused && !isInitializing.current) {
              // Avançar para o próximo story quando completar
              if (index < STORIES.length - 1) {
                const newIndex = index + 1;
                // Pausar antes de mudar
                pauseProgress();
                // Marcar que estamos mudando automaticamente
                isInitializing.current = true;
                // Atualizar o índice
                setCurrentIndex(newIndex);
                // Scroll para o próximo story
                setTimeout(() => {
                  flatListRef.current?.scrollToIndex({ 
                    index: newIndex, 
                    animated: true 
                  });
                  // Resetar flag e iniciar nova animação após scroll
                  setTimeout(() => {
                    isInitializing.current = false;
                    setIsPaused(false);
                    // Iniciar animação do próximo story
                    startProgressAnimation(newIndex);
                  }, 600);
                }, 100);
              } else {
                // Se for o último story (insights), fechar o modal após um pequeno delay
                setTimeout(() => {
                  onClose();
                }, 500);
              }
            }
          }, 100);
        }
      });
    }
  }, [onClose]);

  // Função para pausar/retomar a animação
  const pauseProgress = useCallback(() => {
    setIsPaused(true);
    progressTimers.current.forEach(timer => timer.stop());
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
  }, []);

  const resumeProgress = useCallback(() => {
    setIsPaused(false);
    if (visible && currentIndex < STORIES.length) {
      startProgressAnimation(currentIndex);
    }
  }, [visible, currentIndex, startProgressAnimation]);

  useEffect(() => {
    if (visible) {
      isInitializing.current = true;
      loadReport();
      // Sempre começar no primeiro story (summary)
      setCurrentIndex(0);
      setIsPaused(false);
      
      // Scroll para o primeiro story após um pequeno delay
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 0, animated: false });
        // Iniciar animação após scroll
        setTimeout(() => {
          isInitializing.current = false;
          startProgressAnimation(0);
        }, 400);
      }, 100);
    } else {
      // Resetar animações quando fechar
      isInitializing.current = false;
      pauseProgress();
      progressAnimations.forEach(anim => anim.setValue(0));
      setCurrentIndex(0);
      setIsPaused(false);
    }
    
    return () => {
      pauseProgress();
    };
  }, [visible, startProgressAnimation, pauseProgress]);

  // Reiniciar animação quando mudar de story manualmente (mas não na inicialização ou avanço automático)
  useEffect(() => {
    // Só reiniciar se não estiver inicializando e a mudança foi manual (não automática)
    if (visible && currentIndex < STORIES.length && !isInitializing.current) {
      // Pequeno delay para garantir que o scroll terminou
      const timer = setTimeout(() => {
        // Garantir que a animação seja iniciada do zero
        if (visible && !isPaused) {
          setIsPaused(false);
          startProgressAnimation(currentIndex);
        }
      }, 800);
      
      return () => {
        clearTimeout(timer);
        pauseProgress();
      };
    }
  }, [currentIndex, visible, isPaused, startProgressAnimation, pauseProgress]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateWeeklyReport();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar relatório');
      console.error('Erro ao carregar relatório:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / MODAL_WIDTH);
    
    if (index !== currentIndex && index >= 0 && index < STORIES.length) {
      // Cancelar completamente todas as animações
      progressTimers.current.forEach(timer => timer.stop());
      progressTimers.current = [];
      
      // Resetar todas as animações para 0
      progressAnimations.forEach(anim => anim.setValue(0));
      
      // Atualizar o índice da animação atual
      currentAnimationIndex.current = index;
      
      // Marcar que estamos mudando manualmente
      isInitializing.current = true;
      setIsPaused(false);
      
      setCurrentIndex(index);
    }
  };

  const handleScrollEnd = () => {
    // Retomar animação após scroll terminar (mas não se foi mudança automática)
    if (visible && !isInitializing.current) {
      setTimeout(() => {
        // Preencher stories anteriores
        for (let i = 0; i < currentIndex; i++) {
          progressAnimations[i].setValue(1);
        }
        // Resetar e reiniciar do zero
        setIsPaused(false);
        startProgressAnimation(currentIndex);
      }, 300);
    } else if (visible && isInitializing.current) {
      // Se estava inicializando, finalizar e iniciar animação
      setTimeout(() => {
        isInitializing.current = false;
        // Preencher stories anteriores
        for (let i = 0; i < currentIndex; i++) {
          progressAnimations[i].setValue(1);
        }
        // Iniciar animação do zero
        setIsPaused(false);
        startProgressAnimation(currentIndex);
      }, 300);
    }
  };

  const renderStoryContent = (storyKey: ModalType) => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando relatório...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadReport}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!report) {
      return null;
    }

    switch (storyKey) {
      case 'summary':
        return (
          <View style={styles.storyScrollView}>
            <WeeklySummaryCard
              period={report.period}
              frequency={report.frequency}
              volume={report.volume}
            />
          </View>
        );
      case 'prs':
        return (
          <View style={styles.storyScrollView}>
            <PRsCard
              prs={report.prs}
              onViewAll={() => {
                onClose();
              }}
            />
          </View>
        );
      case 'insight':
        return (
          <ScrollView
            style={styles.storyScrollView}
            contentContainerStyle={styles.storyScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <InsightCard
              insight={report.insight}
              challenge={report.challenge}
            />
          </ScrollView>
        );
      default:
        return null;
    }
  };

  const renderStory = ({ item }: { item: typeof STORIES[0] }) => {
    return (
      <View style={styles.storyContainer}>
        {renderStoryContent(item.key)}
      </View>
    );
  };

  const handlePreviousStory = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      
      // Cancelar completamente todas as animações
      progressTimers.current.forEach(timer => timer.stop());
      progressTimers.current = [];
      
      // Resetar todas as animações para 0
      progressAnimations.forEach(anim => anim.setValue(0));
      
      // Atualizar o índice da animação atual
      currentAnimationIndex.current = newIndex;
      
      // Marcar que estamos mudando manualmente para evitar conflitos
      isInitializing.current = true;
      setIsPaused(false);
      
      setCurrentIndex(newIndex);
      
      // Scroll para o story anterior
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ 
          index: newIndex, 
          animated: true 
        });
        
        // Reiniciar animação do zero após scroll
        setTimeout(() => {
          isInitializing.current = false;
          // Preencher stories anteriores
          for (let i = 0; i < newIndex; i++) {
            progressAnimations[i].setValue(1);
          }
          // Iniciar nova animação do zero
          startProgressAnimation(newIndex);
        }, 600);
      }, 50);
    }
  };

  const handleNextStory = () => {
    if (currentIndex < STORIES.length - 1) {
      // Cancelar completamente todas as animações
      progressTimers.current.forEach(timer => timer.stop());
      progressTimers.current = [];
      
      // Resetar todas as animações para 0
      progressAnimations.forEach(anim => anim.setValue(0));
      
      const newIndex = currentIndex + 1;
      
      // Atualizar o índice da animação atual
      currentAnimationIndex.current = newIndex;
      
      // Marcar que estamos mudando manualmente para evitar conflitos
      isInitializing.current = true;
      setIsPaused(false);
      
      setCurrentIndex(newIndex);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
      
      // Reiniciar animação do zero após scroll
      setTimeout(() => {
        isInitializing.current = false;
        // Preencher stories anteriores
        for (let i = 0; i < newIndex; i++) {
          progressAnimations[i].setValue(1);
        }
        // Iniciar nova animação do zero
        startProgressAnimation(newIndex);
      }, 800);
    } else {
      // Se for o último story, fechar o modal
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={styles.modalContainerWrapper}
          onTouchStart={(e) => {
            e.stopPropagation();
            pauseProgress();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            resumeProgress();
          }}
          onTouchCancel={(e) => {
            e.stopPropagation();
            resumeProgress();
          }}
        >
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.15)',
              'rgba(255, 255, 255, 0.12)',
              'rgba(0, 0, 0, 0.40)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.modalContainer}
          >
          {/* Header com indicadores de progresso (tipo Stories) */}
          <View style={styles.storiesHeader}>
            <View style={styles.progressBarsContainer}>
              {STORIES.map((_, index) => {
                const isCompleted = index < currentIndex;
                const isActive = index === currentIndex;
                const progress = progressAnimations[index] || new Animated.Value(isCompleted ? 1 : 0);
                
                return (
                  <View key={index} style={styles.progressBarWrapper}>
                    <Animated.View
                      style={[
                        styles.progressBar,
                        {
                          width: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  </View>
                );
              })}
            </View>
            
            <View style={styles.headerContent}>
              <Text style={styles.title}>{STORIES[currentIndex]?.title || 'Relatório Semanal'}</Text>
            </View>
          </View>

          {/* Áreas clicáveis para navegação lateral - apenas nas bordas */}
          <View style={styles.navigationAreas} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.leftArea}
              onPress={handlePreviousStory}
              activeOpacity={1}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 0 }}
              disabled={false}
            />
            <View style={styles.centerArea} pointerEvents="box-none" />
            <TouchableOpacity
              style={styles.rightArea}
              onPress={handleNextStory}
              activeOpacity={1}
              hitSlop={{ top: 20, bottom: 20, left: 0, right: 20 }}
              disabled={false}
            />
          </View>

          {/* Carousel de Stories */}
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={STORIES}
              renderItem={renderStory}
              keyExtractor={(item) => item.key}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              onMomentumScrollEnd={handleScrollEnd}
              scrollEventThrottle={16}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              getItemLayout={(_, index) => ({
                length: MODAL_WIDTH,
                offset: MODAL_WIDTH * index,
                index,
              })}
              onScrollToIndexFailed={(info) => {
                // Fallback para scroll manual se falhar
                setTimeout(() => {
                  flatListRef.current?.scrollToOffset({
                    offset: info.averageItemLength * info.index,
                    animated: true,
                  });
                }, 100);
              }}
            />
          </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainerWrapper: {
    width: MODAL_WIDTH,
    maxWidth: 500,
    height: MODAL_MAX_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 32,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  modalContainer: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 21, 24, 0.85)',
  },
  container: {
    flex: 1,
  },
  storiesHeader: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 10,
  },
  progressBarsContainer: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  progressBarWrapper: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '0%',
    backgroundColor: colors.primary,
    borderRadius: 1.5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  carouselContainer: {
    flex: 1,
    minHeight: 400,
  },
  storyContainer: {
    width: MODAL_WIDTH,
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 12,
    elevation: 12,
  },
  storyScrollView: {
    flex: 1,
    padding: 24,
    zIndex: 12,
    elevation: 12,
  },
  storyScrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  navigationAreas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  leftArea: {
    width: '25%',
    height: '100%',
    backgroundColor: 'transparent',
    zIndex: 11,
    elevation: 11,
  },
  centerArea: {
    flex: 1,
    height: '100%',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  rightArea: {
    width: '25%',
    height: '100%',
    backgroundColor: 'transparent',
    zIndex: 11,
    elevation: 11,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    minHeight: 200,
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    minHeight: 200,
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textOnPrimary,
  },
});
