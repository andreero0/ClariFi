import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  GestureHandlerRootView,
  State,
} from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Calendar,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react-native';
import { formatCurrency } from '../../utils/formatting/currency';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

const { width, height } = Dimensions.get('window');

interface ChartData {
  day: number;
  amount: number;
  transactions?: number;
}

export default function ChartDetailModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Chart state
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [chartType, setChartType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Animation refs
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Mock data - in real app this would come from props/API
  const mockData: ChartData[] = Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    amount: Math.random() * 200 + 20,
    transactions: Math.floor(Math.random() * 8) + 1,
  }));

  const maxAmount = Math.max(...mockData.map(d => d.amount));
  const totalSpent = mockData.reduce((sum, day) => sum + day.amount, 0);
  const averageDaily = totalSpent / mockData.length;

  useEffect(() => {
    // Auto-select today if current month
    const today = new Date().getDate();
    if (mockData.find(d => d.day === today)) {
      setSelectedDay(today);
    }
  }, []);

  const handlePanGesture = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      translateX.setValue(event.nativeEvent.translationX + panOffset.x);
      translateY.setValue(event.nativeEvent.translationY + panOffset.y);
    } else if (event.nativeEvent.state === State.END) {
      setPanOffset({
        x: event.nativeEvent.translationX + panOffset.x,
        y: event.nativeEvent.translationY + panOffset.y,
      });
    }
  };

  const handlePinchGesture = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      const newScale = Math.max(0.5, Math.min(3, event.nativeEvent.scale));
      scale.setValue(newScale);
      setZoomLevel(newScale);
    }
  };

  const resetZoom = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
    
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const getBarHeight = (amount: number) => {
    const baseHeight = 150;
    return Math.max((amount / maxAmount) * baseHeight * zoomLevel, 4);
  };

  const getBarColor = (amount: number, isSelected: boolean) => {
    if (isSelected) return colors.primary;
    if (amount > averageDaily * 1.5) return colors.error;
    if (amount > averageDaily * 1.2) return colors.warning;
    return colors.growth;
  };

  const renderInteractiveChart = () => (
    <GestureHandlerRootView style={styles.gestureContainer}>
      <PinchGestureHandler onGestureEvent={handlePinchGesture}>
        <Animated.View style={styles.pinchContainer}>
          <PanGestureHandler onGestureEvent={handlePanGesture}>
            <Animated.View
              style={[
                styles.chartContainer,
                {
                  transform: [
                    { scale },
                    { translateX },
                    { translateY },
                  ],
                },
              ]}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chartScrollContent}
              >
                {mockData.map((dayData) => {
                  const isSelected = selectedDay === dayData.day;
                  const barHeight = getBarHeight(dayData.amount);
                  const barColor = getBarColor(dayData.amount, isSelected);

                  return (
                    <TouchableOpacity
                      key={dayData.day}
                      style={[
                        styles.barContainer,
                        isSelected && styles.selectedBarContainer,
                      ]}
                      onPress={() => setSelectedDay(dayData.day)}
                      activeOpacity={0.7}
                    >
                      {/* Amount label for selected bar */}
                      {isSelected && (
                        <View style={styles.amountLabel}>
                          <Text style={styles.amountLabelText}>
                            {formatCurrency(dayData.amount)}
                          </Text>
                          <Text style={styles.transactionCount}>
                            {dayData.transactions} transactions
                          </Text>
                        </View>
                      )}

                      {/* Bar */}
                      <Animated.View
                        style={[
                          styles.interactiveBar,
                          {
                            height: barHeight,
                            backgroundColor: barColor,
                            borderWidth: isSelected ? 2 : 0,
                            borderColor: colors.primary,
                          },
                        ]}
                      />

                      {/* Day label */}
                      <Text
                        style={[
                          styles.dayLabel,
                          isSelected && styles.selectedDayLabel,
                        ]}
                      >
                        {dayData.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>
    </GestureHandlerRootView>
  );

  const renderSelectedDayDetails = () => {
    if (!selectedDay) return null;

    const dayData = mockData.find(d => d.day === selectedDay);
    if (!dayData) return null;

    const percentageOfMonth = (dayData.amount / totalSpent) * 100;
    const vsAverage = dayData.amount / averageDaily;

    return (
      <View style={styles.detailsCard}>
        <View style={styles.detailsHeader}>
          <Text style={styles.detailsTitle}>
            Day {selectedDay} Details
          </Text>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => {
              Alert.alert(
                'Chart Interactions',
                '• Tap bars to see details\n• Pinch to zoom in/out\n• Drag to pan around\n• Swipe up/down for different views',
                [{ text: 'Got it!' }]
              );
            }}
          >
            <Info size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContent}>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Amount Spent</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(dayData.amount)}
            </Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Transactions</Text>
            <Text style={styles.detailValue}>
              {dayData.transactions}
            </Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>% of Month</Text>
            <Text style={styles.detailValue}>
              {percentageOfMonth.toFixed(1)}%
            </Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>vs Daily Average</Text>
            <View style={styles.comparisonContainer}>
              {vsAverage > 1.2 ? (
                <TrendingUp size={16} color={colors.error} />
              ) : vsAverage < 0.8 ? (
                <TrendingDown size={16} color={colors.growth} />
              ) : null}
              <Text
                style={[
                  styles.detailValue,
                  {
                    color: vsAverage > 1.2 ? colors.error : 
                          vsAverage < 0.8 ? colors.growth : colors.textPrimary,
                  },
                ]}
              >
                {vsAverage.toFixed(1)}x
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewTransactionsButton}
          onPress={() => {
            router.push({
              pathname: '/modals/transaction-detail',
              params: {
                date: `2024-06-${selectedDay.toString().padStart(2, '0')}`,
                amount: dayData.amount.toString(),
              },
            });
          }}
        >
          <Text style={styles.viewTransactionsText}>View Transactions</Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Spending Chart</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={resetZoom}
          >
            <ZoomOut size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chart Type Selector */}
      <View style={styles.chartTypeSelector}>
        {['daily', 'weekly', 'monthly'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.chartTypeButton,
              chartType === type && styles.activeChartTypeButton,
            ]}
            onPress={() => setChartType(type as any)}
          >
            <Text
              style={[
                styles.chartTypeText,
                chartType === type && styles.activeChartTypeText,
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart Summary */}
      <View style={styles.chartSummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatCurrency(totalSpent)}</Text>
          <Text style={styles.summaryLabel}>Total Spent</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatCurrency(averageDaily)}</Text>
          <Text style={styles.summaryLabel}>Daily Average</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {zoomLevel.toFixed(1)}x
          </Text>
          <Text style={styles.summaryLabel}>Zoom Level</Text>
        </View>
      </View>

      {/* Interactive Chart */}
      <View style={styles.chartSection}>
        {renderInteractiveChart()}
      </View>

      {/* Selected Day Details */}
      {renderSelectedDayDetails()}

      {/* Interaction Hints */}
      <View style={styles.hintsContainer}>
        <Text style={styles.hintsText}>
          💡 Pinch to zoom • Drag to pan • Tap bars for details
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary || '#fafbfd',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral?.light || '#e2e8f0',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral?.lightest || '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral?.lightest || '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTypeSelector: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    backgroundColor: colors.neutral?.lightest || '#f8f9fa',
    borderRadius: 12,
    padding: 4,
  },
  chartTypeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeChartTypeButton: {
    backgroundColor: colors.primary,
  },
  chartTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeChartTypeText: {
    color: colors.surface,
  },
  chartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chartSection: {
    flex: 1,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gestureContainer: {
    flex: 1,
  },
  pinchContainer: {
    flex: 1,
  },
  chartContainer: {
    flex: 1,
    padding: spacing.md,
  },
  chartScrollContent: {
    alignItems: 'flex-end',
    paddingVertical: spacing.lg,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
    position: 'relative',
  },
  selectedBarContainer: {
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  interactiveBar: {
    width: 20,
    borderRadius: 4,
    marginBottom: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  selectedDayLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  amountLabel: {
    position: 'absolute',
    top: -40,
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 10,
  },
  amountLabelText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  transactionCount: {
    color: colors.surface,
    fontSize: 10,
    opacity: 0.8,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  infoButton: {
    padding: spacing.xs,
  },
  detailsContent: {
    gap: spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewTransactionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: spacing.sm,
    borderRadius: 12,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  viewTransactionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  hintsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral?.lightest || '#f8f9fa',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral?.light || '#e2e8f0',
  },
  hintsText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});