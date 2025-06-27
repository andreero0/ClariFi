import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
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
  Line,
} from 'react-native-svg';
import { formatCurrency } from '../../utils/formatting/currency';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { BarChart3, LineChart, TrendingUp, Calendar, Filter } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.lg * 2;
const CHART_HEIGHT = 200;

interface SpendingData {
  date: string;
  amount: number;
  categories: Record<string, number>;
  budget?: number;
}

interface ChartOptions {
  type: 'bar' | 'line' | 'area';
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  showBudget: boolean;
  smoothing: boolean;
}

interface ModernSpendingChartProps {
  data: SpendingData[];
  onDataPointPress?: (data: SpendingData) => void;
  onOptionsChange?: (options: ChartOptions) => void;
  showControls?: boolean;
}

export const ModernSpendingChart: React.FC<ModernSpendingChartProps> = ({
  data,
  onDataPointPress,
  onOptionsChange,
  showControls = true,
}) => {
  const [chartOptions, setChartOptions] = useState<ChartOptions>({
    type: 'bar',
    timeRange: 'month',
    showBudget: true,
    smoothing: true,
  });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  
  // Animation refs
  const animatedValues = useRef(
    data.map(() => new Animated.Value(0))
  ).current;
  const panelAnimation = useRef(new Animated.Value(0)).current;
  
  const maxAmount = Math.max(...data.map(d => d.amount), ...data.map(d => d.budget || 0), 100);
  const minAmount = Math.min(...data.map(d => d.amount), 0);
  const range = maxAmount - minAmount;

  useEffect(() => {
    // Animate chart elements
    const animations = animatedValues.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 1000,
        delay: index * 30,
        useNativeDriver: false,
      })
    );

    Animated.stagger(20, animations).start();
  }, [data, chartOptions.type]);

  const getScaledValue = (value: number) => {
    return ((value - minAmount) / range) * (CHART_HEIGHT - 60);
  };

  const getXPosition = (index: number) => {
    return (index * (CHART_WIDTH / (data.length - 1))) + 40;
  };

  const getYPosition = (value: number) => {
    return CHART_HEIGHT - getScaledValue(value) - 30;
  };

  const generatePath = (values: number[], type: 'line' | 'area' = 'line') => {
    if (values.length === 0) return '';
    
    let path = '';
    
    values.forEach((value, index) => {
      const x = getXPosition(index);
      const y = getYPosition(value);
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else if (chartOptions.smoothing) {
        // Smooth curves using quadratic bezier
        const prevX = getXPosition(index - 1);
        const prevY = getYPosition(values[index - 1]);
        const cpX = (prevX + x) / 2;
        path += ` Q ${cpX} ${prevY} ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    if (type === 'area') {
      // Close the path for area chart
      const lastX = getXPosition(values.length - 1);
      const firstX = getXPosition(0);
      path += ` L ${lastX} ${CHART_HEIGHT - 30} L ${firstX} ${CHART_HEIGHT - 30} Z`;
    }
    
    return path;
  };

  const renderBarChart = () => (
    <G>
      {data.map((item, index) => {
        const barHeight = getScaledValue(item.amount);
        const x = getXPosition(index);
        const barWidth = Math.max(CHART_WIDTH / data.length - 8, 8);
        const isSelected = index === selectedIndex;
        
        return (
          <G key={index}>
            {/* Budget line */}
            {chartOptions.showBudget && item.budget && (
              <Line
                x1={x - barWidth/2}
                y1={getYPosition(item.budget)}
                x2={x + barWidth/2}
                y2={getYPosition(item.budget)}
                stroke={colors.warning}
                strokeWidth={2}
                strokeDasharray="4,4"
              />
            )}
            
            {/* Bar */}
            <Rect
              x={x - barWidth/2}
              y={animatedValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: [CHART_HEIGHT - 30, getYPosition(item.amount)],
              })}
              width={barWidth}
              height={animatedValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0, barHeight],
              })}
              fill={isSelected ? colors.primary : `url(#barGradient-${index})`}
              rx={4}
              onPress={() => {
                setSelectedIndex(index);
                onDataPointPress?.(item);
              }}
            />
            
            {/* Selection indicator */}
            {isSelected && (
              <Circle
                cx={x}
                cy={getYPosition(item.amount) - 8}
                r={4}
                fill={colors.primary}
              />
            )}
          </G>
        );
      })}
    </G>
  );

  const renderLineChart = () => {
    const linePath = generatePath(data.map(d => d.amount));
    const areaPath = generatePath(data.map(d => d.amount), 'area');
    
    return (
      <G>
        {/* Area fill */}
        {chartOptions.type === 'area' && (
          <Path
            d={areaPath}
            fill="url(#areaGradient)"
            opacity={0.3}
          />
        )}
        
        {/* Budget line */}
        {chartOptions.showBudget && (
          <Path
            d={generatePath(data.map(d => d.budget || 0))}
            stroke={colors.warning}
            strokeWidth={2}
            strokeDasharray="6,6"
            fill="none"
          />
        )}
        
        {/* Main line */}
        <Path
          d={linePath}
          stroke={colors.primary}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {data.map((item, index) => {
          const x = getXPosition(index);
          const y = getYPosition(item.amount);
          const isSelected = index === selectedIndex;
          
          return (
            <Circle
              key={index}
              cx={x}
              cy={y}
              r={isSelected ? 6 : 4}
              fill={colors.surface}
              stroke={colors.primary}
              strokeWidth={isSelected ? 3 : 2}
              onPress={() => {
                setSelectedIndex(index);
                onDataPointPress?.(item);
              }}
            />
          );
        })}
      </G>
    );
  };

  const renderGrid = () => (
    <G opacity={0.2}>
      {/* Horizontal grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((percent, index) => {
        const y = CHART_HEIGHT - 30 - (percent * (CHART_HEIGHT - 60));
        return (
          <Line
            key={`h-${index}`}
            x1={40}
            y1={y}
            x2={CHART_WIDTH - 20}
            y2={y}
            stroke={colors.textSecondary}
            strokeWidth={1}
          />
        );
      })}
      
      {/* Vertical grid lines */}
      {data.map((_, index) => {
        if (index % Math.ceil(data.length / 5) === 0) {
          const x = getXPosition(index);
          return (
            <Line
              key={`v-${index}`}
              x1={x}
              y1={30}
              x2={x}
              y2={CHART_HEIGHT - 30}
              stroke={colors.textSecondary}
              strokeWidth={1}
            />
          );
        }
        return null;
      })}
    </G>
  );

  const renderYAxisLabels = () => (
    <G>
      {[0, 0.25, 0.5, 0.75, 1].map((percent, index) => {
        const value = minAmount + (percent * range);
        const y = CHART_HEIGHT - 30 - (percent * (CHART_HEIGHT - 60));
        
        return (
          <SvgText
            key={index}
            x={35}
            y={y + 4}
            fontSize="10"
            fill={colors.textSecondary}
            textAnchor="end"
          >
            ${Math.round(value)}
          </SvgText>
        );
      })}
    </G>
  );

  const renderXAxisLabels = () => (
    <G>
      {data.map((item, index) => {
        if (index % Math.ceil(data.length / 5) === 0) {
          const x = getXPosition(index);
          const date = new Date(item.date);
          const label = date.getDate().toString();
          
          return (
            <SvgText
              key={index}
              x={x}
              y={CHART_HEIGHT - 10}
              fontSize="10"
              fill={colors.textSecondary}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        }
        return null;
      })}
    </G>
  );

  const renderChart = () => (
    <View style={styles.chartContainer}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          {/* Gradients for bars */}
          {data.map((_, index) => (
            <LinearGradient
              key={`barGradient-${index}`}
              id={`barGradient-${index}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.6" />
            </LinearGradient>
          ))}
          
          {/* Area chart gradient */}
          <LinearGradient
            id="areaGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.1" />
          </LinearGradient>
        </Defs>
        
        {renderGrid()}
        {renderYAxisLabels()}
        {renderXAxisLabels()}
        
        {chartOptions.type === 'bar' ? renderBarChart() : renderLineChart()}
      </Svg>
    </View>
  );

  const renderControls = () => {
    if (!showControls) return null;
    
    return (
      <View style={styles.controls}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.controlsContent}
        >
          {/* Chart type buttons */}
          <View style={styles.controlGroup}>
            {[
              { type: 'bar' as const, icon: BarChart3, label: 'Bar' },
              { type: 'line' as const, icon: LineChart, label: 'Line' },
              { type: 'area' as const, icon: TrendingUp, label: 'Area' },
            ].map(({ type, icon: Icon, label }) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.controlButton,
                  chartOptions.type === type && styles.controlButtonActive,
                ]}
                onPress={() => {
                  const newOptions = { ...chartOptions, type };
                  setChartOptions(newOptions);
                  onOptionsChange?.(newOptions);
                }}
              >
                <Icon
                  size={16}
                  color={chartOptions.type === type ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.controlButtonText,
                    chartOptions.type === type && styles.controlButtonTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Time range buttons */}
          <View style={styles.controlGroup}>
            {[
              { range: 'week' as const, label: '1W' },
              { range: 'month' as const, label: '1M' },
              { range: 'quarter' as const, label: '3M' },
              { range: 'year' as const, label: '1Y' },
            ].map(({ range, label }) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeButton,
                  chartOptions.timeRange === range && styles.timeButtonActive,
                ]}
                onPress={() => {
                  const newOptions = { ...chartOptions, timeRange: range };
                  setChartOptions(newOptions);
                  onOptionsChange?.(newOptions);
                }}
              >
                <Text
                  style={[
                    styles.timeButtonText,
                    chartOptions.timeRange === range && styles.timeButtonTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowOptionsPanel(!showOptionsPanel)}
        >
          <Filter size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderSelectedDetails = () => {
    if (selectedIndex === null) return null;
    
    const selectedData = data[selectedIndex];
    const date = new Date(selectedData.date);
    
    return (
      <Animated.View style={styles.selectedDetails}>
        <Text style={styles.selectedDate}>
          {date.toLocaleDateString('en-CA', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.selectedAmount}>
          {formatCurrency(selectedData.amount)}
        </Text>
        {selectedData.budget && (
          <Text style={styles.selectedBudget}>
            Budget: {formatCurrency(selectedData.budget)}
          </Text>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Spending Overview</Text>
        <Text style={styles.subtitle}>
          {chartOptions.timeRange.charAt(0).toUpperCase() + chartOptions.timeRange.slice(1)} view
        </Text>
      </View>
      
      {renderChart()}
      {renderSelectedDetails()}
      {renderControls()}
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
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...textStyles.h3,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
  chartContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  selectedDetails: {
    backgroundColor: colors.primary + '08',
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  selectedDate: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  selectedAmount: {
    ...textStyles.h2,
    color: colors.primary,
    fontWeight: '700',
    marginVertical: spacing.xs,
  },
  selectedBudget: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  controlsContent: {
    gap: spacing.lg,
  },
  controlGroup: {
    flexDirection: 'row',
    backgroundColor: colors.neutral?.lightest || '#f8f9fa',
    borderRadius: 12,
    padding: 4,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
  },
  controlButtonActive: {
    backgroundColor: colors.surface,
  },
  controlButtonText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  controlButtonTextActive: {
    color: colors.primary,
  },
  timeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: colors.surface,
  },
  timeButtonText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  timeButtonTextActive: {
    color: colors.primary,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral?.lightest || '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
});