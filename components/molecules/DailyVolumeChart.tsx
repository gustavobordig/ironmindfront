/**
 * Molecule: Gráfico de Linha Simples - Volume Diário
 * Linha simples de 7 pontos mostrando volume diário da semana
 * Animação: linha desenhada da esquerda para direita (600ms)
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Considerar padding do StoryScreen (16px) + padding lateral do gráfico (32px total)
const CHART_WIDTH = SCREEN_WIDTH - 64; // 32px (StoryScreen) + 32px (lateral) = 64px
const CHART_HEIGHT = 120;

const DAY_ABBREVIATIONS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface DailyVolumeChartProps {
  dailyVolumes: number[]; // 7 valores (um para cada dia) - índice 0 = Segunda, 6 = Domingo
  color: string;
  delay?: number;
  startDate: string; // ISO 8601 date string
}

export default function DailyVolumeChart({
  dailyVolumes,
  color,
  delay = 0,
  startDate,
}: DailyVolumeChartProps) {
  const lineProgress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [animatedPathLength, setAnimatedPathLength] = useState(0);
  const [showPoints, setShowPoints] = useState(false);
  const [showGlow, setShowGlow] = useState(false);

  // Mapear volumes e labels baseado no período do relatório
  const { mappedVolumes, dayLabels } = React.useMemo(() => {
    const start = new Date(startDate);
    const volumes: number[] = [];
    const labels: string[] = [];
    
    // Para cada um dos 7 dias do período
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda, etc.
      
      // Mapear volume: dailyVolumes está indexado como JavaScript dayOfWeek
      // [Dom=0, Seg=1, Ter=2, Qua=3, Qui=4, Sex=5, Sáb=6]
      // Então dayOfWeek já é o índice correto!
      const volumeIndex = dayOfWeek;
      
      volumes.push(dailyVolumes[volumeIndex] || 0);
      labels.push(DAY_ABBREVIATIONS[dayOfWeek]);
    }
    
    return { mappedVolumes: volumes, dayLabels: labels };
  }, [startDate, dailyVolumes]);

  // Calcular pontos do gráfico
  const maxVolume = Math.max(...mappedVolumes, 1); // Evitar divisão por zero
  const padding = 20;
  const chartInnerWidth = CHART_WIDTH - padding * 2;
  const chartInnerHeight = CHART_HEIGHT - padding * 2;

  const points = mappedVolumes.map((volume, index) => {
    const x = padding + (index / (mappedVolumes.length - 1)) * chartInnerWidth;
    const y = padding + chartInnerHeight - (volume / maxVolume) * chartInnerHeight;
    return { x, y, volume };
  });

  // Criar path da linha
  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  useEffect(() => {
    // Animação: fade-in + linha desenhada
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(lineProgress, {
        toValue: 1,
        duration: 600,
        delay: delay + 100,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: false, // Path não suporta native driver
      }),
    ]).start();
  }, [delay]);

  // Calcular comprimento do path para animação
  const pathLength = points.reduce((total, point, index) => {
    if (index === 0) return total;
    const prev = points[index - 1];
    const dx = point.x - prev.x;
    const dy = point.y - prev.y;
    return total + Math.sqrt(dx * dx + dy * dy);
  }, 0);

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
        {/* Grid suave (5-8% opacity) */}
        <Path
          d={`M ${padding} ${padding} L ${padding} ${CHART_HEIGHT - padding} L ${CHART_WIDTH - padding} ${CHART_HEIGHT - padding}`}
          stroke={colors.textSecondary}
          strokeWidth={1}
          strokeOpacity={0.06}
          fill="none"
        />

        {/* Linha principal animada */}
        <Path
          d={pathData}
          stroke={color}
          strokeWidth={3}
          strokeOpacity={0.85}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={pathLength}
          strokeDashoffset={animatedPathLength}
        />

        {/* Pontos - aparecem conforme a linha avança */}
        {showPoints && points.map((point, index) => {
          const isLast = index === points.length - 1;
          const pointSize = isLast ? 6 : 4;

          return (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={pointSize}
              fill={color}
              opacity={0.9}
            />
          );
        })}

        {/* Ponto final com glow sutil */}
        {showGlow && (
          <Circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={8}
            fill={color}
            opacity={0.3}
          />
        )}
      </Svg>

      {/* Labels dos dias da semana */}
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

