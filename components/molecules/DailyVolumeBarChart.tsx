/**
 * Molecule: Gráfico de Barras Verticais - Volume Diário
 * Barras verticais mostrando volume diário da semana
 * Ideal para comparação visual entre dias
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64; // padding lateral
const CHART_HEIGHT = 140;
const BAR_SPACING = 8;
const BAR_COUNT = 7;

const DAY_ABBREVIATIONS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface DailyVolumeBarChartProps {
  dailyVolumes: number[]; // 7 valores (um para cada dia)
  color: string;
  delay?: number;
  startDate: string;
}

export default function DailyVolumeBarChart({
  dailyVolumes,
  color,
  delay = 0,
  startDate,
}: DailyVolumeBarChartProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [barHeights, setBarHeights] = useState<number[]>([]);
  const [showBars, setShowBars] = useState(false);

  // Mapear volumes e labels baseado no período do relatório
  const { mappedVolumes, dayLabels } = React.useMemo(() => {
    const start = new Date(startDate);
    const volumes: number[] = [];
    const labels: string[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dayOfWeek = date.getDay();
      const volumeIndex = dayOfWeek;
      
      volumes.push(dailyVolumes[volumeIndex] || 0);
      labels.push(DAY_ABBREVIATIONS[dayOfWeek]);
    }
    
    return { mappedVolumes: volumes, dayLabels: labels };
  }, [startDate, dailyVolumes]);

  // Calcular dimensões das barras
  const maxVolume = Math.max(...mappedVolumes, 1);
  const padding = 20;
  const chartInnerWidth = CHART_WIDTH - padding * 2;
  const chartInnerHeight = CHART_HEIGHT - padding * 2 - 30; // espaço para labels
  const barWidth = (chartInnerWidth - (BAR_SPACING * (BAR_COUNT - 1))) / BAR_COUNT;

  useEffect(() => {
    // Calcular alturas das barras
    const heights = mappedVolumes.map(volume => {
      return (volume / maxVolume) * chartInnerHeight;
    });
    setBarHeights(heights);

    // Animação: fade-in + barras crescem de baixo para cima
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      delay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setShowBars(true);
    });
  }, [delay, mappedVolumes, maxVolume]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
        },
      ]}
    >
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.svg}>
        {/* Linha de base */}
        <Rect
          x={padding}
          y={CHART_HEIGHT - padding - 30}
          width={chartInnerWidth}
          height={1}
          fill={colors.textSecondary}
          opacity={0.1}
        />

        {/* Barras animadas */}
        {showBars && barHeights.map((height, index) => {
          const x = padding + index * (barWidth + BAR_SPACING);
          const y = CHART_HEIGHT - padding - 30 - height;
          const hasVolume = mappedVolumes[index] > 0;
          
          return (
            <React.Fragment key={index}>
              {/* Barra principal */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={height}
                fill={color}
                opacity={hasVolume ? 0.85 : 0.2}
                rx={4}
                ry={4}
              />
              {/* Brilho sutil no topo */}
              {hasVolume && height > 10 && (
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.min(height * 0.2, 8)}
                  fill={color}
                  opacity={0.4}
                  rx={4}
                  ry={4}
                />
              )}
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Labels dos dias */}
      <View style={styles.labelsContainer}>
        {dayLabels.map((label, index) => {
          const hasVolume = mappedVolumes[index] > 0;
          return (
            <View key={index} style={styles.label}>
              <Text 
                style={[styles.labelText, hasVolume && styles.labelTextActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: '100%',
    alignItems: 'center',
    marginTop: 8,
    flexShrink: 1,
  },
  svg: {
    marginBottom: 8,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: CHART_WIDTH,
    paddingHorizontal: 20,
    flexShrink: 1,
  },
  label: {
    alignItems: 'center',
    minWidth: 32,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelTextActive: {
    color: colors.textPrimary,
    opacity: 0.8,
    fontWeight: '600',
  },
});

