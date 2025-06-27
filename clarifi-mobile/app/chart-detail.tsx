import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Settings,
  Maximize,
  MoreVertical,
  Filter,
} from 'lucide-react-native';
import { colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface ChartDataPoint {
  day: number;
  amount: number;
  date?: string;
}

interface TimeRange {
  id: string;
  label: string;
  period: string;
}

const timeRanges: TimeRange[] = [
  { id: 'week', label: 'Week', period: '7 days' },
  { id: 'month', label: 'Month', period: '30 days' },
  { id: 'quarter', label: 'Quarter', period: '90 days' },
  { id: 'year', label: 'Year', period: '365 days' },
];

// Mock data for different time ranges
const mockData = {
  week: [
    { day: 1, amount: 45, date: '2024-11-11' },
    { day: 2, amount: 78, date: '2024-11-12' },
    { day: 3, amount: 92, date: '2024-11-13' },
    { day: 4, amount: 64, date: '2024-11-14' },
    { day: 5, amount: 156, date: '2024-11-15' },
    { day: 6, amount: 87, date: '2024-11-16' },
    { day: 7, amount: 203, date: '2024-11-17' },
  ],
  month: Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    amount: Math.floor(Math.random() * 200) + 20,
    date: `2024-11-${(i + 1).toString().padStart(2, '0')}`,
  })),
  quarter: Array.from({ length: 90 }, (_, i) => ({
    day: i + 1,
    amount: Math.floor(Math.random() * 250) + 30,
    date: `2024-${Math.floor(i / 30) + 9}-${((i % 30) + 1).toString().padStart(2, '0')}`,
  })),
  year: Array.from({ length: 12 }, (_, i) => ({
    day: i + 1,
    amount: Math.floor(Math.random() * 3000) + 1000,
    date: `2024-${(i + 1).toString().padStart(2, '0')}-01`,
  })),
};

export default function ChartDetailScreen() {
  const router = useRouter();
  const { timeRange: initialTimeRange = 'month' } = useLocalSearchParams<{ timeRange?: string }>();
  
  const [selectedTimeRange, setSelectedTimeRange] = useState(initialTimeRange);
  const [selectedDataPoint, setSelectedDataPoint] = useState<ChartDataPoint | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);

  // Animation references
  const chartScale = useRef(new Animated.Value(1)).current;
  const chartTranslateX = useRef(new Animated.Value(0)).current;
  const bottomSheetAnim = useRef(new Animated.Value(300)).current;
  const chartAnimations = useRef<Animated.Value[]>([]).current;

  const currentData = mockData[selectedTimeRange as keyof typeof mockData] || mockData.month;
  const maxAmount = Math.max(...currentData.map(d => d.amount));

  // Initialize chart animations
  useEffect(() => {
    chartAnimations.splice(0);
    currentData.forEach(() => {
      chartAnimations.push(new Animated.Value(0));
    });

    // Animate bars in sequence
    const animations = chartAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 30,
        useNativeDriver: true,
      })
    );

    Animated.stagger(30, animations).start();
  }, [selectedTimeRange]);

  // Bottom sheet animation
  useEffect(() => {
    Animated.timing(bottomSheetAnim, {
      toValue: showBottomSheet ? 0 : 300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showBottomSheet]);

  const handlePinchGesture = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      const scale = Math.max(1, Math.min(event.nativeEvent.scale, 3));
      setZoomLevel(scale);
      Animated.setValue(chartScale, scale);
    }
  };

  const handlePanGesture = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE && zoomLevel > 1) {
      const maxPan = (width * (zoomLevel - 1)) / 2;
      const translateX = Math.max(-maxPan, Math.min(maxPan, event.nativeEvent.translationX));
      setPanOffset(translateX);
      Animated.setValue(chartTranslateX, translateX);
    }
  };

  const handleBarPress = (dataPoint: ChartDataPoint) => {
    setSelectedDataPoint(selectedDataPoint?.day === dataPoint.day ? null : dataPoint);
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setSelectedTimeRange(range.id);
    setShowBottomSheet(false);
    setZoomLevel(1);
    setPanOffset(0);
    chartScale.setValue(1);
    chartTranslateX.setValue(0);
  };

  const getTimeLabel = (dataPoint: ChartDataPoint) => {
    switch (selectedTimeRange) {
      case 'week':
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dataPoint.day - 1];
      case 'month':
        return dataPoint.day.toString();
      case 'quarter':
        return Math.ceil(dataPoint.day / 30).toString();
      case 'year':
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dataPoint.day - 1];
      default:
        return dataPoint.day.toString();
    }
  };

  const calculateStats = () => {
    const total = currentData.reduce((sum, d) => sum + d.amount, 0);
    const average = total / currentData.length;
    const highest = Math.max(...currentData.map(d => d.amount));
    const lowest = Math.min(...currentData.map(d => d.amount));
    
    return { total, average, highest, lowest };
  };

  const stats = calculateStats();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.midnightInk} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Spending Chart</Text>
          <Text style={styles.headerSubtitle}>
            {timeRanges.find(r => r.id === selectedTimeRange)?.period}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.optionsButton}
          onPress={() => setShowBottomSheet(true)}
        >
          <Settings size={24} color={colors.midnightInk} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${stats.total.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${Math.round(stats.average).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${stats.highest.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Highest</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${stats.lowest.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Lowest</Text>
          </View>
        </ScrollView>
      </View>

      {/* Chart Container */}
      <View style={styles.chartContainer}>
        <PinchGestureHandler onGestureEvent={handlePinchGesture}>
          <PanGestureHandler onGestureEvent={handlePanGesture}>
            <Animated.View style={styles.chartWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chartScrollView}
                contentContainerStyle={styles.chartContent}
              >
                <Animated.View
                  style={[
                    styles.chart,
                    {
                      transform: [
                        { scaleX: chartScale },
                        { scaleY: chartScale },
                        { translateX: chartTranslateX },
                      ],
                    },
                  ]}
                >
                  {currentData.map((dataPoint, index) => {
                    const height = (dataPoint.amount / maxAmount) * 200;
                    const isSelected = selectedDataPoint?.day === dataPoint.day;
                    const isToday = selectedTimeRange === 'month' && dataPoint.day === new Date().getDate();

                    return (
                      <TouchableOpacity
                        key={dataPoint.day}
                        style={styles.chartBar}
                        onPress={() => handleBarPress(dataPoint)}
                        activeOpacity={0.7}
                      >
                        {/* Tooltip */}
                        {isSelected && (
                          <View style={styles.tooltip}>
                            <Text style={styles.tooltipAmount}>${dataPoint.amount}</Text>
                            {dataPoint.date && (
                              <Text style={styles.tooltipDate}>
                                {new Date(dataPoint.date).toLocaleDateString()}
                              </Text>
                            )}
                          </View>
                        )}

                        {/* Bar */}
                        <Animated.View
                          style={[
                            styles.bar,
                            {
                              height: height || 2,
                              backgroundColor: isToday 
                                ? colors.clarityBlue 
                                : isSelected 
                                ? colors.wisdomPurple 
                                : colors.neutral.light,
                              transform: [
                                {
                                  scaleY: chartAnimations[index] || new Animated.Value(1),
                                },
                                {
                                  scale: isSelected ? 1.1 : 1,
                                },
                              ],
                            },
                          ]}
                        />

                        {/* Label */}
                        <Text style={[
                          styles.barLabel,
                          isToday && styles.todayLabel,
                          isSelected && styles.selectedLabel,
                        ]}>
                          {getTimeLabel(dataPoint)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </Animated.View>
              </ScrollView>
            </Animated.View>
          </PanGestureHandler>
        </PinchGestureHandler>

        {/* Zoom Level Indicator */}
        {zoomLevel > 1 && (
          <View style={styles.zoomIndicator}>
            <Maximize size={16} color={colors.midnightInk} />
            <Text style={styles.zoomText}>{zoomLevel.toFixed(1)}x</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Pinch to zoom • Pan to navigate • Tap bars for details
        </Text>
      </View>

      {/* Bottom Sheet */}
      {showBottomSheet && (
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity 
            style={styles.bottomSheetBackdrop}
            onPress={() => setShowBottomSheet(false)}
          />
          <Animated.View
            style={[
              styles.bottomSheet,
              { transform: [{ translateY: bottomSheetAnim }] }
            ]}
          >
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Chart Options</Text>
              <TouchableOpacity onPress={() => setShowBottomSheet(false)}>
                <Text style={styles.bottomSheetClose}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timeRangeContainer}>
              <Text style={styles.timeRangeSectionTitle}>Time Range</Text>
              {timeRanges.map((range) => (
                <TouchableOpacity
                  key={range.id}
                  style={[
                    styles.timeRangeOption,
                    selectedTimeRange === range.id && styles.timeRangeOptionSelected,
                  ]}
                  onPress={() => handleTimeRangeChange(range)}
                >
                  <View style={styles.timeRangeContent}>
                    <Text style={[
                      styles.timeRangeLabel,
                      selectedTimeRange === range.id && styles.timeRangeLabelSelected,
                    ]}>
                      {range.label}
                    </Text>
                    <Text style={[
                      styles.timeRangePeriod,
                      selectedTimeRange === range.id && styles.timeRangePeriodSelected,
                    ]}>
                      {range.period}
                    </Text>
                  </View>
                  {selectedTimeRange === range.id && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.pureWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cloudGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.midnightInk,
    letterSpacing: -0.25,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.neutral.medium,
    marginTop: 2,
  },
  optionsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cloudGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    backgroundColor: colors.pureWhite,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.light,
  },
  statCard: {
    alignItems: 'center',
    marginRight: 32,
    minWidth: 80,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.midnightInk,
    letterSpacing: -0.25,
  },
  statLabel: {
    fontSize: 12,
    color: colors.neutral.medium,
    marginTop: 4,
  },
  chartContainer: {
    flex: 1,
    backgroundColor: colors.pureWhite,
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  chartWrapper: {
    flex: 1,
    padding: 24,
  },
  chartScrollView: {
    flex: 1,
  },
  chartContent: {
    alignItems: 'flex-end',
    paddingRight: 24,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 240,
    minWidth: width - 80,
  },
  chartBar: {
    alignItems: 'center',
    marginRight: 12,
    width: 32,
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    top: -50,
    backgroundColor: colors.midnightInk,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  tooltipAmount: {
    color: colors.pureWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  tooltipDate: {
    color: colors.pureWhite,
    fontSize: 10,
    opacity: 0.8,
    marginTop: 2,
  },
  bar: {
    width: 24,
    borderRadius: 12,
    marginBottom: 8,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 12,
    color: colors.neutral.medium,
    textAlign: 'center',
  },
  todayLabel: {
    color: colors.clarityBlue,
    fontWeight: '600',
  },
  selectedLabel: {
    color: colors.wisdomPurple,
    fontWeight: '600',
  },
  zoomIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cloudGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  zoomText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.midnightInk,
  },
  instructionsContainer: {
    backgroundColor: colors.pureWhite,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.light,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.neutral.medium,
    textAlign: 'center',
  },
  bottomSheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetBackdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: colors.pureWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    maxHeight: height * 0.7,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.light,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.midnightInk,
  },
  bottomSheetClose: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.clarityBlue,
  },
  timeRangeContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  timeRangeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.midnightInk,
    marginBottom: 16,
  },
  timeRangeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.appBackground,
  },
  timeRangeOptionSelected: {
    backgroundColor: colors.clarityBlue + '15',
    borderWidth: 1,
    borderColor: colors.clarityBlue,
  },
  timeRangeContent: {
    flex: 1,
  },
  timeRangeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.midnightInk,
  },
  timeRangeLabelSelected: {
    color: colors.clarityBlue,
    fontWeight: '600',
  },
  timeRangePeriod: {
    fontSize: 14,
    color: colors.neutral.medium,
    marginTop: 2,
  },
  timeRangePeriodSelected: {
    color: colors.clarityBlue,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.clarityBlue,
  },
});