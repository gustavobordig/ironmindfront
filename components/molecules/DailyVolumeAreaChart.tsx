/**
 * Molecule: Gráfico de Área - Volume Diário
 * Gráfico de área suave mostrando progressão do volume diário
 * Ideal para mostrar continuidade e tendência
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64; // padding lateral
const CHART_HEIGHT = 140;

const DAY_ABBREVIATIONS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface DailyVolumeAreaChartProps {
  dailyVolumes: number[]; // 7 valores (um para cada dia)
  color: string;
  delay?: number;
  startDate: string;
}

export default function DailyVolumeAreaChart({
  dailyVolumes,
  color,
  delay = 0,
  startDate,
}: DailyVolumeAreaChartProps) {
  const areaProgress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [showPoints, setShowPoints] = useState(false);
  const [areaOpacity, setAreaOpacity] = useState(0);

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

  // Calcular pontos do gráfico
  const maxVolume = Math.max(...mappedVolumes, 1);
  const padding = 20;
  const chartInnerWidth = CHART_WIDTH - padding * 2;
  const chartInnerHeight = CHART_HEIGHT - padding * 2 - 30;

  const points = mappedVolumes.map((volume, index) => {
    const x = padding + (index / (mappedVolumes.length - 1)) * chartInnerWidth;
    const y = padding + chartInnerHeight - (volume / maxVolume) * chartInnerHeight;
    return { x, y, volume };
  });

  // Criar path da área (fechado na base)
  const areaPath = React.useMemo(() => {
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const baseY = padding + chartInnerHeight;
    
    const linePath = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
    
    return `${linePath} L ${lastPoint.x} ${baseY} L ${firstPoint.x} ${baseY} Z`;
  }, [points, padding, chartInnerHeight]);

  // Criar path da linha (apenas a linha superior)
  const linePath = React.useMemo(() => {
    return points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  }, [points]);

  useEffect(() => {
    // Animação: fade-in + área preenche de baixo para cima
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(areaProgress, {
        toValue: 1,
        duration: 800,
        delay: delay + 100,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setShowPoints(true);
    });

    // Atualizar opacidade da área baseada no progresso
    const listener = areaProgress.addListener(({ value }) => {
      setAreaOpacity(value * 0.25);
    });

    return () => {
      areaProgress.removeListener(listener);
    };
  }, [delay]);

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
        <Path
          d={`M ${padding} ${padding + chartInnerHeight} L ${CHART_WIDTH - padding} ${padding + chartInnerHeight}`}
          stroke={colors.textSecondary}
          strokeWidth={1}
          strokeOpacity={0.1}
          fill="none"
        />

        {/* Área preenchida (com gradiente simulado via opacidade) */}
        <Path
          d={areaPath}
          fill={color}
          opacity={areaOpacity}
        />

        {/* Linha superior */}
        <Path
          d={linePath}
          stroke={color}
          strokeWidth={3}
          strokeOpacity={0.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Pontos - aparecem no final */}
        {showPoints && points.map((point, index) => {
          const hasVolume = mappedVolumes[index] > 0;
          if (!hasVolume) return null;
          
          const isLast = index === points.length - 1;
          const pointSize = isLast ? 6 : 4;

          return (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={pointSize}
              fill={color}
              opacity={0.95}
            />
          );
        })}

        {/* Ponto final com glow */}
        {showPoints && mappedVolumes[mappedVolumes.length - 1] > 0 && (
          <Circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={8}
            fill={color}
            opacity={0.3}
          />
        )}
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

