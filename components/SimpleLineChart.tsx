import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { colors } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 200;
const PADDING = 20;
const Y_AXIS_WIDTH = 50; // Espaço para os valores do eixo Y
const CHART_INNER_WIDTH = CHART_WIDTH - PADDING * 2 - Y_AXIS_WIDTH;
const CHART_INNER_HEIGHT = CHART_HEIGHT - PADDING * 2;

interface DataPoint {
  value: number;
  label: string;
  date: Date;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  color?: string;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
}

export default function SimpleLineChart({
  data,
  color = colors.primary,
  showGrid = true,
  formatValue,
}: SimpleLineChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Sem dados disponíveis</Text>
        </View>
      </View>
    );
  }

  // Filtrar valores válidos e calcular mínimos e máximos
  const validData = data.filter(d => 
    typeof d.value === 'number' && 
    !isNaN(d.value) && 
    isFinite(d.value)
  );

  if (validData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Sem dados válidos</Text>
        </View>
      </View>
    );
  }

  const values = validData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1; // Evitar divisão por zero

  // Calcular pontos do gráfico (relativos ao SVG, sem Y_AXIS_WIDTH)
  const svgWidth = CHART_WIDTH - Y_AXIS_WIDTH;
  const svgInnerWidth = svgWidth - PADDING * 2;
  
  const points = validData.map((point, index) => {
    const x = PADDING + (index / Math.max(validData.length - 1, 1)) * svgInnerWidth;
    const normalizedValue = (point.value - minValue) / valueRange;
    const y = PADDING + CHART_INNER_HEIGHT - normalizedValue * CHART_INNER_HEIGHT;
    
    // Garantir que x e y são números válidos
    const validX = isNaN(x) || !isFinite(x) ? PADDING : Math.max(PADDING, Math.min(svgWidth - PADDING, x));
    const validY = isNaN(y) || !isFinite(y) ? PADDING + CHART_INNER_HEIGHT : Math.max(PADDING, Math.min(CHART_HEIGHT - PADDING, y));
    
    return { x: validX, y: validY, ...point };
  });

  // Gerar linhas do grid
  const gridLines = showGrid ? Array.from({ length: 5 }, (_, i) => {
    const y = PADDING + (i / 4) * CHART_INNER_HEIGHT;
    const value = maxValue - (i / 4) * valueRange;
    return { y, value };
  }) : [];

  // Criar path para a linha usando formato SVG correto
  const pathData = points
    .map((point, index) => {
      const x = point.x.toFixed(2);
      const y = point.y.toFixed(2);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        {/* Valores do eixo Y */}
        {showGrid && (
          <View style={styles.yAxisContainer}>
            {gridLines.map((grid, index) => (
              <Text
                key={index}
                style={[
                  styles.yAxisLabel,
                  { top: grid.y - 8 }
                ]}
              >
                {formatValue ? formatValue(grid.value) : Math.round(grid.value).toLocaleString('pt-BR')}
              </Text>
            ))}
          </View>
        )}

        {/* Gráfico SVG */}
        <Svg width={svgWidth} height={CHART_HEIGHT}>
          {/* Grid lines */}
          {showGrid && gridLines.map((grid, index) => (
            <Line
              key={index}
              x1={PADDING}
              y1={grid.y}
              x2={svgWidth - PADDING}
              y2={grid.y}
              stroke={colors.textSecondary + '20'}
              strokeWidth="1"
            />
          ))}

          {/* Linha do gráfico */}
          <Path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pontos */}
          {points.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={color}
              stroke={colors.background}
              strokeWidth="2"
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartWrapper: {
    flexDirection: 'row',
    width: '100%',
    height: CHART_HEIGHT,
  },
  yAxisContainer: {
    width: Y_AXIS_WIDTH,
    height: CHART_HEIGHT,
    position: 'relative',
    justifyContent: 'flex-start',
    paddingRight: 8,
  },
  yAxisLabel: {
    position: 'absolute',
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500' as const,
    textAlign: 'right',
    width: Y_AXIS_WIDTH - 8,
  },
  emptyState: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

