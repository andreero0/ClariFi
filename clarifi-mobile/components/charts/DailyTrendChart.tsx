import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
} from 'react-native';
import Svg, { 
  G, 
  Rect, 
  Circle, 
  Path, 
  LinearGradient, 
  Defs, 
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { formatCurrency } from '../../utils/formatting/currency';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { TrendingUp, Maximize2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.lg * 2;
const CHART_HEIGHT = 180;
const BAR_WIDTH = CHART_WIDTH / 31; // For 31 days max

interface DayData {
  date: string;
  amount: number;
  categories: Record<string, number>;
}

interface CategoryData {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface DailyTrendChartProps {
  data: DayData[];
  categories: CategoryData[];
  onDayPress?: (day: DayData) => void;
  onExpandPress?: () => void;
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({
  data,
  categories,
  onDayPress,
  onExpandPress,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Animation values
  const barAnimations = useRef(
    data.map(() => new Animated.Value(0))
  ).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  
  const maxAmount = Math.max(...data.map(d => d.amount), 100);
  const today = new Date();
  const todayIndex = data.findIndex(d => {
    const itemDate = new Date(d.date);
    return itemDate.toDateString() === today.toDateString();
  });

  useEffect(() => {
    // Animate bars in sequence
    const animations = barAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 20,
        useNativeDriver: false,
      })
    );

    Animated.stagger(15, animations).start();

    // Pulsing animation for today
    if (todayIndex >= 0) {
      const pulse = Animated.loop(
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
      pulse.start();
    }
  }, [data]);

  // Pan responder for drag interactions
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    onPanResponderGrant: (evt) => {
      setIsDragging(true);
      const x = evt.nativeEvent.locationX;
      const index = Math.floor(x / BAR_WIDTH);
      if (index >= 0 && index < data.length) {
        setSelectedIndex(index);
      }
    },
    
    onPanResponderMove: (evt) => {
      const x = evt.nativeEvent.locationX;
      const index = Math.floor(x / BAR_WIDTH);
      if (index >= 0 && index < data.length && index !== selectedIndex) {
        setSelectedIndex(index);
      }
      dragX.setValue(evt.nativeEvent.locationX);
    },
    
    onPanResponderRelease: () => {
      setIsDragging(false);
      if (selectedIndex !== null && onDayPress) {
        onDayPress(data[selectedIndex]);
      }
    },
  });

  const getBarHeight = (amount: number) => {
    return (amount / maxAmount) * (CHART_HEIGHT - 40);
  };

  const getBarColor = (amount: number, index: number) => {
    if (index === todayIndex) return colors.primary;
    if (amount > maxAmount * 0.8) return colors.error;
    if (amount > maxAmount * 0.6) return colors.warning;
    return colors.growth;
  };

  const renderChart = () => (
    <View style={styles.chartContainer} {...panResponder.panHandlers}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
        <Defs>
          <LinearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.6" />
          </LinearGradient>
          <LinearGradient id="todayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.8" />
          </LinearGradient>
        </Defs>
        
        {data.map((day, index) => {
          const barHeight = getBarHeight(day.amount);
          const barColor = getBarColor(day.amount, index);
          const x = index * BAR_WIDTH + BAR_WIDTH * 0.1;
          const barWidth = BAR_WIDTH * 0.8;
          const isToday = index === todayIndex;
          const isSelected = index === selectedIndex;
          
          return (
            <G key={index}>
              {/* Bar */}
              <AnimatedRect
                x={x}
                y={CHART_HEIGHT - barHeight}
                width={barWidth}
                height={barAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, barHeight],
                })}
                fill={isToday ? 'url(#todayGradient)' : barColor}
                rx={2}
                opacity={isSelected ? 1 : 0.8}
                stroke={isSelected ? colors.primary : 'none'}
                strokeWidth={isSelected ? 2 : 0}
              />
              
              {/* Today indicator */}
              {isToday && (
                <AnimatedCircle
                  cx={x + barWidth / 2}
                  cy={CHART_HEIGHT - barHeight - 8}
                  r={3}
                  fill={colors.primary}
                  transform={[{ scale: pulseAnimation }]}
                />
              )}
              
              {/* Day label */}
              <SvgText
                x={x + barWidth / 2}
                y={CHART_HEIGHT + 15}
                fontSize="10"
                fontWeight={isToday ? "600" : "400"}
                fill={isToday ? colors.primary : colors.textSecondary}
                textAnchor="middle"
              >
                {new Date(day.date).getDate()}
              </SvgText>
              
              {/* Amount tooltip for selected day */}
              {isSelected && (
                <G>
                  <Rect
                    x={x - 15}
                    y={CHART_HEIGHT - barHeight - 35}
                    width={barWidth + 30}
                    height={20}
                    rx={4}
                    fill={colors.textPrimary}
                    opacity={0.9}
                  />
                  <SvgText
                    x={x + barWidth / 2}
                    y={CHART_HEIGHT - barHeight - 22}
                    fontSize="10"
                    fontWeight="600"
                    fill={colors.surface}
                    textAnchor="middle"
                  >
                    ${day.amount.toFixed(0)}
                  </SvgText>
                </G>
              )}
            </G>
          );
        })}
      </Svg>
      
      {/* Interaction overlay */}
      <View style={styles.interactionOverlay} />
    </View>
  );

  const renderSelectedDayDetails = () => {
    if (selectedIndex === null) return null;
    
    const selectedDay = data[selectedIndex];
    const date = new Date(selectedDay.date);
    const isToday = selectedIndex === todayIndex;
    
    return (
      <Animated.View
        style={[
          styles.detailsCard,
          {
            opacity: isDragging ? 1 : 0,
            transform: [
              {
                translateY: isDragging ? 0 : 20,
              },
            ],
          },
        ]}
      >
        <View style={styles.detailsHeader}>
          <Text style={styles.detailsDate}>
            {isToday ? 'Today' : date.toLocaleDateString('en-CA', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.detailsAmount}>
            {formatCurrency(selectedDay.amount)}
          </Text>
        </View>
        
        <View style={styles.categoryBreakdown}>
          {Object.entries(selectedDay.categories).slice(0, 3).map(([categoryId, amount]) => {
            const category = categories.find(c => c.id === categoryId);
            if (!category || amount === 0) return null;
            
            return (
              <View key={categoryId} style={styles.categoryItem}>
                <View style={styles.categoryIndicator}>
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: category.color },
                    ]}
                  />
                  <Text style={styles.categoryText}>{category.name}</Text>
                </View>
                <Text style={styles.categoryAmount}>
                  ${amount.toFixed(0)}
                </Text>
              </View>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  const total = data.reduce((sum, day) => sum + day.amount, 0);
  const average = total / data.length;
  const trend = data.length > 15 ? 
    ((data.slice(-7).reduce((sum, d) => sum + d.amount, 0) / 7) - 
     (data.slice(0, 7).reduce((sum, d) => sum + d.amount, 0) / 7)) / average * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Daily Spending</Text>
          <View style={styles.stats}>
            <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
            <View style={styles.trendContainer}>
              <TrendingUp 
                size={14} 
                color={trend >= 0 ? colors.growth : colors.error}
              />
              <Text style={[
                styles.trendText,
                { color: trend >= 0 ? colors.growth : colors.error }
              ]}>
                {Math.abs(trend).toFixed(1)}% vs avg
              </Text>
            </View>
          </View>
        </View>
        
        {onExpandPress && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={onExpandPress}
          >
            <Maximize2 size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {renderChart()}
      {renderSelectedDayDetails()}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Touch and drag to see daily amounts
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    margin: spacing.lg,
    marginTop: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...textStyles.h3,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  totalAmount: {
    ...textStyles.h2,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral?.lightest || '#f8f9fa',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral?.lightest || '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  interactionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  detailsCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailsDate: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  detailsAmount: {
    ...textStyles.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  categoryBreakdown: {
    gap: spacing.xs,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  categoryText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  categoryAmount: {
    ...textStyles.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  footerText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});