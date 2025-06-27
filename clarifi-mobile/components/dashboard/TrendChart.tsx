import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Svg, {
  Line,
  Circle,
  Path,
  G,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { formatCurrency } from '../../utils/formatting/currency';

interface TrendDataPoint {
  date: string;
  amount: number;
  label: string;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  color?: string;
  showGrid?: boolean;
  loading?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title = 'Spending Trend',
  color = '#007AFF',
  showGrid = true,
  loading = false,
}) => {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  const { width } = Dimensions.get('window');
  const chartWidth = width - 32;
  const chartHeight = 200;
  const padding = 40;
  const plotWidth = chartWidth - padding * 2;
  const plotHeight = chartHeight - padding * 2;

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading trend data...</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyIcon}>📈</Text>
        <Text style={styles.emptyTitle}>No Trend Data</Text>
        <Text style={styles.emptyText}>
          Add more transactions to see spending trends.
        </Text>
      </View>
    );
  }

  // Calculate data bounds
  const maxAmount = Math.max(...data.map(d => d.amount));
  const minAmount = Math.min(...data.map(d => d.amount));
  const range = maxAmount - minAmount;
  const adjustedMax = maxAmount + range * 0.1; // Add 10% padding
  const adjustedMin = Math.max(0, minAmount - range * 0.1);

  // Generate path data for the line
  const generatePath = () => {
    if (data.length < 2) return '';

    let path = '';
    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * plotWidth;
      const y =
        padding +
        plotHeight -
        ((point.amount - adjustedMin) / (adjustedMax - adjustedMin)) *
          plotHeight;

      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });

    return path;
  };

  // Generate grid lines
  const generateGridLines = () => {
    const gridLines = [];
    const gridCount = 4;

    // Horizontal grid lines
    for (let i = 0; i <= gridCount; i++) {
      const y = padding + (i / gridCount) * plotHeight;
      const value = adjustedMax - (i / gridCount) * (adjustedMax - adjustedMin);

      gridLines.push(
        <G key={`h-grid-${i}`}>
          <Line
            x1={padding}
            y1={y}
            x2={padding + plotWidth}
            y2={y}
            stroke="#e1e5e9"
            strokeWidth={1}
            strokeDasharray="2,2"
          />
          <SvgText
            x={padding - 8}
            y={y + 4}
            fontSize="10"
            fill="#6c757d"
            textAnchor="end"
          >
            {formatCurrency(value, { showSymbol: false, showCents: false })}
          </SvgText>
        </G>
      );
    }

    return gridLines;
  };

  // Generate data points
  const generateDataPoints = () => {
    return data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * plotWidth;
      const y =
        padding +
        plotHeight -
        ((point.amount - adjustedMin) / (adjustedMax - adjustedMin)) *
          plotHeight;
      const isSelected = selectedPoint === index;

      return (
        <G key={index}>
          <Circle
            cx={x}
            cy={y}
            r={isSelected ? 6 : 4}
            fill={color}
            opacity={isSelected ? 1 : 0.8}
            onPress={() =>
              setSelectedPoint(selectedPoint === index ? null : index)
            }
          />
          {isSelected && (
            <Circle
              cx={x}
              cy={y}
              r={10}
              fill="none"
              stroke={color}
              strokeWidth={2}
              opacity={0.3}
            />
          )}
        </G>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {selectedPoint !== null && (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedLabel}>
              {data[selectedPoint].label}
            </Text>
            <Text style={styles.selectedValue}>
              {formatCurrency(data[selectedPoint].amount)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.4" />
            </LinearGradient>
          </Defs>

          {/* Grid lines */}
          {showGrid && generateGridLines()}

          {/* Trend line */}
          <Path
            d={generatePath()}
            stroke="url(#lineGradient)"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {generateDataPoints()}

          {/* X-axis labels */}
          {data.map((point, index) => {
            const x = padding + (index / (data.length - 1)) * plotWidth;
            const y = chartHeight - padding + 20;

            return (
              <SvgText
                key={`label-${index}`}
                x={x}
                y={y}
                fontSize="10"
                fill="#6c757d"
                textAnchor="middle"
              >
                {point.label}
              </SvgText>
            );
          })}
        </Svg>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={styles.statValue}>
            {formatCurrency(
              data.reduce((sum, p) => sum + p.amount, 0) / data.length
            )}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Highest</Text>
          <Text style={[styles.statValue, { color: '#dc3545' }]}>
            {formatCurrency(maxAmount)}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Lowest</Text>
          <Text style={[styles.statValue, { color: '#28a745' }]}>
            {formatCurrency(minAmount)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6c757d',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  selectedInfo: {
    alignItems: 'flex-end',
  },
  selectedLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  selectedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e1e5e9',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
