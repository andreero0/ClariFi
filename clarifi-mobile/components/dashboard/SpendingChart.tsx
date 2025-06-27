import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText, Defs, Stop, LinearGradient } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { ToggleGroup } from '../ui/ToggleGroup';

interface SpendingChartProps {
  data: {
    categories: Array<{
      name: string;
      amount: number;
      color: string;
    }>;
    dailyTrend: Array<{
      date: Date;
      amount: number;
    }>;
  };
  onSegmentPress?: (category: string) => void;
}

const { width } = Dimensions.get('window');
const CHART_SIZE = width - 48;
const CENTER_X = CHART_SIZE / 2;
const CENTER_Y = CHART_SIZE / 2;
const RADIUS = CHART_SIZE / 2 - 40;

export const SpendingChart: React.FC<SpendingChartProps> = ({
  data,
  onSegmentPress,
}) => {
  const [viewMode, setViewMode] = useState<'pie' | 'trend'>('pie');
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const segmentAnims = useRef(
    (data?.categories || []).map(() => new Animated.Value(0))
  ).current;

  // Handle empty or invalid data
  if (!data || !data.categories || !data.dailyTrend) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No spending data available</Text>
        </View>
      </View>
    );
  }

  // Handle cases where arrays exist but are empty
  if (data.categories.length === 0 && data.dailyTrend.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No spending data available</Text>
        </View>
      </View>
    );
  }

  useEffect(() => {
    // Animate segments in sequentially
    const animations = segmentAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: false,
      })
    );

    Animated.stagger(50, animations).start();
  }, []);

  const switchView = (mode: 'pie' | 'trend') => {
    if (mode === viewMode) return;

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setViewMode(mode);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const calculateTotal = () => {
    return (data?.categories || []).reduce((sum, cat) => sum + cat.amount, 0);
  };

  const calculatePieSlicePath = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const start = (startAngle - 90) * Math.PI / 180;
    const end = (endAngle - 90) * Math.PI / 180;
    
    const x1 = centerX + radius * Math.cos(start);
    const y1 = centerY + radius * Math.sin(start);
    const x2 = centerX + radius * Math.cos(end);
    const y2 = centerY + radius * Math.sin(end);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${centerX},${centerY} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2} Z`;
  };

  const handleSegmentPress = (index: number, category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSegment(selectedSegment === index ? null : index);
    onSegmentPress?.(category);
  };

  const renderPieChart = () => {
    const total = calculateTotal();
    const categories = data?.categories || [];
    
    if (categories.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No data available</Text>
        </View>
      );
    }

    let currentAngle = 0;
    const chartSize = 200;
    const centerX = chartSize / 2;
    const centerY = chartSize / 2;
    const radius = 70;

    return (
      <View style={styles.pieContainer}>
        <View style={styles.chartWrapper}>
          <Svg width={chartSize} height={chartSize} style={styles.pieChart}>
            {categories.map((category, index) => {
              const percentage = (category.amount / total) * 100;
              const angle = (percentage / 100) * 360;
              const endAngle = currentAngle + angle;
              
              const path = calculatePieSlicePath(centerX, centerY, radius, currentAngle, endAngle);
              currentAngle = endAngle;

              return (
                <Path
                  key={category.name}
                  d={path}
                  fill={category.color}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  onPress={() => handleSegmentPress(index, category.name)}
                />
              );
            })}
            
            {/* Center circle */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={35}
              fill="#FFFFFF"
            />
          </Svg>
          
          <View style={styles.centerContent}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              ${total.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.legend}>
          {categories.map((category, index) => {
            const percentage = ((category.amount / total) * 100).toFixed(0);
            return (
              <View key={category.name} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: category.color },
                  ]}
                />
                <Text style={styles.legendText}>{category.name}</Text>
                <Text style={styles.legendPercentage}>{percentage}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTrendChart = () => {
    const dailyTrend = data?.dailyTrend || [];
    
    if (dailyTrend.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No trend data available</Text>
        </View>
      );
    }

    // Use actual trend data from props
    const trendData = dailyTrend.slice(-7).map((item, index) => ({
      date: item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: item.amount,
    }));

    const maxAmount = Math.max(...trendData.map(d => d.amount));
    const minAmount = Math.min(...trendData.map(d => d.amount));
    const chartHeight = 160;
    const chartWidth = width - 80;
    const padding = 40;
    
    const points = trendData.map((day, index) => ({
      x: padding + (index * (chartWidth - padding * 2)) / (trendData.length - 1),
      y: padding + ((maxAmount - day.amount) / (maxAmount - minAmount)) * (chartHeight - padding * 2),
    }));

    // Create smooth curve path
    const createSmoothPath = (points: any[]) => {
      if (points.length < 2) return '';
      
      let path = `M ${points[0].x} ${points[0].y}`;
      
      for (let i = 1; i < points.length; i++) {
        const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) / 3;
        const cp1y = points[i - 1].y;
        const cp2x = points[i].x - (points[i].x - points[i - 1].x) / 3;
        const cp2y = points[i].y;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
      }
      
      return path;
    };

    const pathData = createSmoothPath(points);
    const areaData = `${pathData} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

    return (
      <View style={styles.trendContainer}>
        <Svg width={width - 48} height={chartHeight + 60}>
          <Defs>
            <LinearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#FF8A80" stopOpacity={0.3} />
              <Stop offset="100%" stopColor="#FF8A80" stopOpacity={0.05} />
            </LinearGradient>
          </Defs>

          {/* Area fill */}
          <Path d={areaData} fill="url(#trendGradient)" />

          {/* Line */}
          <Path
            d={pathData}
            stroke="#FF6B6B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#FF6B6B"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          ))}

          {/* X-axis labels */}
          {trendData.map((day, index) => (
            <SvgText
              key={index}
              x={points[index].x}
              y={chartHeight + 30}
              fontSize="12"
              fill="#718096"
              textAnchor="middle"
            >
              {day.date}
            </SvgText>
          ))}
        </Svg>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Spending Overview</Text>
        <ToggleGroup
          value={viewMode}
          onValueChange={(value: string) => switchView(value as 'pie' | 'trend')}
        >
          <ToggleGroup.Item value="pie">
            Chart
          </ToggleGroup.Item>
          <ToggleGroup.Item value="trend">
            Trend
          </ToggleGroup.Item>
        </ToggleGroup>
      </View>

      <Animated.View style={{ opacity: fadeAnim }}>
        {viewMode === 'pie' ? renderPieChart() : renderTrendChart()}
      </Animated.View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1F36',
  },
  pieContainer: {
    alignItems: 'center',
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 24,
  },
  pieChart: {
    // Chart styling
  },
  centerContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -20 }],
    alignItems: 'center',
    width: 70,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#718096',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1F36',
  },
  legend: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F7F9FC',
    borderRadius: 8,
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1F36',
    flex: 1,
  },
  legendPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1F36',
  },
  trendContainer: {
    alignItems: 'center',
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#718096',
  },
});