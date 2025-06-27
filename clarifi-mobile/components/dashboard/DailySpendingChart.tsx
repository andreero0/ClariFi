import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Maximize2 } from 'lucide-react-native';
import { formatCurrency } from '../../utils/formatting/currency';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

interface DailySpendingData {
  day: number;
  amount: number;
}

interface DailySpendingChartProps {
  data: DailySpendingData[];
  todayIndex: number;
  selectedMonth: Date;
  onDayPress?: (day: number, amount: number) => void;
}

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 32; // Account for margins
const BAR_WIDTH = (CHART_WIDTH - 40) / 31; // Space for 31 days with gaps

export const DailySpendingChart: React.FC<DailySpendingChartProps> = ({
  data,
  todayIndex,
  selectedMonth,
  onDayPress,
}) => {
  const router = useRouter();
  const maxAmount = Math.max(...data.map(d => d.amount), 100);
  const today = new Date();
  const isCurrentMonth = 
    selectedMonth.getMonth() === today.getMonth() &&
    selectedMonth.getFullYear() === today.getFullYear();

  const handleExpandChart = () => {
    router.push({
      pathname: '/modals/chart-detail',
      params: {
        month: selectedMonth.toISOString(),
        type: 'daily',
      },
    });
  };

  // Animation refs for bars
  const barAnimations = useRef(
    Array.from({ length: 31 }, () => new Animated.Value(0))
  ).current;

  // Pulsing animation for today's dot
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate bars in sequence
    const animations = data.map((_, index) =>
      Animated.timing(barAnimations[index], {
        toValue: 1,
        duration: 400,
        delay: index * 20,
        useNativeDriver: false,
      })
    );

    Animated.stagger(30, animations).start();

    // Start pulsing animation for today's dot
    if (isCurrentMonth) {
      const pulseSequence = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseSequence.start();
    }

    return () => {
      pulseAnimation.stopAnimation();
    };
  }, [data, isCurrentMonth]);

  const getBarHeight = (amount: number) => {
    return Math.max((amount / maxAmount) * 80, 2); // Min height 2px
  };

  const getBarColor = (day: number, amount: number) => {
    if (isCurrentMonth && day === todayIndex + 1) {
      return colors.primary;
    }
    if (amount > maxAmount * 0.8) {
      return colors.error;
    }
    if (amount > maxAmount * 0.6) {
      return colors.warning;
    }
    return colors.growth;
  };

  const renderDayBar = (dayData: DailySpendingData, index: number) => {
    const isToday = isCurrentMonth && dayData.day === todayIndex + 1;
    const barHeight = getBarHeight(dayData.amount);
    const barColor = getBarColor(dayData.day, dayData.amount);

    return (
      <TouchableOpacity
        key={dayData.day}
        style={styles.barContainer}
        onPress={() => onDayPress?.(dayData.day, dayData.amount)}
        activeOpacity={0.7}
      >
        {/* Today's pulsing dot */}
        {isToday && (
          <Animated.View
            style={[
              styles.todayDot,
              {
                transform: [{ scale: pulseAnimation }],
              },
            ]}
          />
        )}

        {/* Spending bar */}
        <Animated.View
          style={[
            styles.bar,
            {
              height: barAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0, barHeight],
              }),
              backgroundColor: barColor,
            },
          ]}
        />

        {/* Day label */}
        <Text
          style={[
            styles.dayLabel,
            isToday && styles.todayLabel,
          ]}
        >
          {dayData.day}
        </Text>

        {/* Amount on hover/press - show for high amounts */}
        {dayData.amount > maxAmount * 0.7 && (
          <View style={styles.amountBadge}>
            <Text style={styles.amountText}>
              ${dayData.amount.toFixed(0)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Get days in current month
  const daysInMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    0
  ).getDate();

  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const existingData = data.find(d => d.day === i + 1);
    return existingData || { day: i + 1, amount: 0 };
  });

  const totalSpent = chartData.reduce((sum, day) => sum + day.amount, 0);
  const averageDaily = totalSpent / daysInMonth;

  return (
    <View style={styles.container}>
      {/* Chart Header */}
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>Daily Spending</Text>
          <Text style={styles.chartSubtitle}>
            {selectedMonth.toLocaleDateString('en-CA', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.chartHeaderRight}>
          <View style={styles.chartStats}>
            <Text style={styles.totalAmount}>
              {formatCurrency(totalSpent)}
            </Text>
            <Text style={styles.averageAmount}>
              {formatCurrency(averageDaily)} avg/day
            </Text>
          </View>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={handleExpandChart}
            activeOpacity={0.7}
          >
            <Maximize2 size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {chartData.map((dayData, index) => renderDayBar(dayData, index))}
        </View>

        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>{formatCurrency(maxAmount)}</Text>
          <Text style={styles.axisLabel}>{formatCurrency(maxAmount * 0.5)}</Text>
          <Text style={styles.axisLabel}>$0</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.growth }]} />
          <Text style={styles.legendText}>Normal</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>High</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={styles.legendText}>Very High</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  chartSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chartHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chartStats: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  averageAmount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral?.lightest || '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chartContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    paddingLeft: 30, // Space for Y-axis
    paddingBottom: 20, // Space for day labels
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
    minWidth: BAR_WIDTH,
  },
  bar: {
    width: Math.max(BAR_WIDTH - 2, 4),
    borderRadius: 2,
    marginBottom: 4,
  },
  todayDot: {
    position: 'absolute',
    top: -8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    zIndex: 2,
  },
  dayLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  todayLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  amountBadge: {
    position: 'absolute',
    top: -24,
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 30,
    alignItems: 'center',
  },
  amountText: {
    fontSize: 8,
    color: colors.surface,
    fontWeight: '600',
  },
  yAxis: {
    position: 'absolute',
    left: 0,
    height: 80,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  axisLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'right',
    width: 25,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral?.light || '#e2e8f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});