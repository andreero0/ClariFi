import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Svg, {
  Circle,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { formatCurrency } from '../../utils/formatting/currency';

interface ProgressData {
  id: string;
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: 'currency' | 'percentage' | 'number';
}

interface ProgressChartProps {
  data: ProgressData[];
  size?: number;
  strokeWidth?: number;
  loading?: boolean;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  data,
  size = 120,
  strokeWidth = 8,
  loading = false,
}) => {
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading progress...</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyIcon}>🎯</Text>
        <Text style={styles.emptyTitle}>No Goals Set</Text>
        <Text style={styles.emptyText}>
          Set financial goals to track your progress.
        </Text>
      </View>
    );
  }

  const renderProgressCircle = (item: ProgressData, index: number) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(item.current / item.target, 1);
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - progress);
    const center = size / 2;

    const formatValue = (value: number, unit?: string) => {
      switch (unit) {
        case 'currency':
          return formatCurrency(value, { showCents: false });
        case 'percentage':
          return `${value.toFixed(1)}%`;
        case 'number':
          return value.toLocaleString();
        default:
          return formatCurrency(value, { showCents: false });
      }
    };

    const getProgressColor = () => {
      if (progress >= 1) return '#28a745'; // Green for completed
      if (progress >= 0.8) return '#007AFF'; // Blue for near completion
      if (progress >= 0.5) return '#fd7e14'; // Orange for moderate progress
      return '#dc3545'; // Red for low progress
    };

    const progressColor = getProgressColor();
    const isOverTarget = item.current > item.target;

    return (
      <View key={item.id} style={styles.progressItem}>
        <View style={styles.circleContainer}>
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient
                id={`gradient-${index}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <Stop offset="0%" stopColor={progressColor} stopOpacity="1" />
                <Stop
                  offset="100%"
                  stopColor={progressColor}
                  stopOpacity="0.6"
                />
              </LinearGradient>
            </Defs>

            {/* Background circle */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#f1f3f4"
              strokeWidth={strokeWidth}
              fill="none"
            />

            {/* Progress circle */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={isOverTarget ? '#dc3545' : `url(#gradient-${index})`}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${center} ${center})`}
            />

            {/* Center text */}
            <SvgText
              x={center}
              y={center - 8}
              textAnchor="middle"
              fontSize="16"
              fontWeight="bold"
              fill={progressColor}
            >
              {(progress * 100).toFixed(0)}%
            </SvgText>

            <SvgText
              x={center}
              y={center + 12}
              textAnchor="middle"
              fontSize="10"
              fill="#6c757d"
            >
              {isOverTarget ? 'Over' : 'Complete'}
            </SvgText>
          </Svg>

          {/* Completion indicator */}
          {progress >= 1 && (
            <View style={styles.completionBadge}>
              <Text style={styles.completionText}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.progressDetails}>
          <Text style={styles.progressLabel}>{item.label}</Text>

          <View style={styles.progressValues}>
            <Text style={styles.currentValue}>
              {formatValue(item.current, item.unit)}
            </Text>
            <Text style={styles.targetValue}>
              of {formatValue(item.target, item.unit)}
            </Text>
          </View>

          <View style={styles.remainingContainer}>
            {isOverTarget ? (
              <Text style={[styles.remainingText, { color: '#dc3545' }]}>
                {formatValue(item.current - item.target, item.unit)} over target
              </Text>
            ) : (
              <Text style={styles.remainingText}>
                {formatValue(item.target - item.current, item.unit)} remaining
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressGrid}>
        {data.map((item, index) => renderProgressCircle(item, index))}
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
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  progressItem: {
    alignItems: 'center',
    minWidth: '45%',
    marginBottom: 16,
  },
  circleContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  completionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#28a745',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  completionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressDetails: {
    alignItems: 'center',
    minHeight: 80,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressValues: {
    alignItems: 'center',
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 2,
  },
  targetValue: {
    fontSize: 12,
    color: '#6c757d',
  },
  remainingContainer: {
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
});
