import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import Svg, {
  Circle,
  Rect,
  G,
  Path,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { PieChart as PieChartIcon, BarChart3 } from 'lucide-react-native';
import { formatCurrency } from '../../utils/formatting/currency';
import { spacing } from '../../constants/spacing';

// ClariFi color palette
const clarifiColors = {
  primary: '#2B5CE6',
  secondary: '#4B7BF5',
  surface: '#FFFFFF',
  growth: '#00C896',
  wisdom: '#6B5DD3',
  error: '#E53E3E',
  warning: '#F6AD55',
  neutralPrimary: '#4A5568',
  neutralSecondary: '#718096',
  border: '#E2E8F0',
  appBackground: '#FAFBFD',
  primaryText: '#1A1F36',
};

interface CategoryData {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: any;
}

interface EnhancedSpendingChartProps {
  data: CategoryData[];
  onCategoryPress?: (category: CategoryData) => void;
  isLoading?: boolean;
}

type ChartType = 'pie' | 'bar';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export const EnhancedSpendingChart: React.FC<EnhancedSpendingChartProps> = ({
  data,
  onCategoryPress,
  isLoading = false,
}) => {
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const morphAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  
  const { width } = Dimensions.get('window');
  const chartWidth = width - spacing.lg * 2;
  const chartHeight = 200;
  const pieRadius = 80;
  const pieCenter = { x: chartWidth / 2, y: chartHeight / 2 };
  
  // Total amount for calculations
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
  
  // Handle chart type toggle with animation
  const toggleChartType = () => {
    const newType = chartType === 'pie' ? 'bar' : 'pie';
    
    // Scale down
    Animated.timing(scaleAnimation, {
      toValue: 0.8,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Morph animation
      Animated.timing(morphAnimation, {
        toValue: newType === 'bar' ? 1 : 0,
        duration: 500,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }).start(() => {
        // Scale back up
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    });
    
    setChartType(newType);
  };
  
  // Calculate pie chart paths
  const calculatePiePath = (startAngle: number, endAngle: number): string => {
    const startX = pieCenter.x + pieRadius * Math.cos(startAngle);
    const startY = pieCenter.y + pieRadius * Math.sin(startAngle);
    const endX = pieCenter.x + pieRadius * Math.cos(endAngle);
    const endY = pieCenter.y + pieRadius * Math.sin(endAngle);
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
    
    return `M ${pieCenter.x} ${pieCenter.y} L ${startX} ${startY} A ${pieRadius} ${pieRadius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
  };
  
  // Calculate angles for pie slices
  let currentAngle = -Math.PI / 2; // Start at top
  const pieData = data.map((item) => {
    const angle = (item.amount / totalAmount) * Math.PI * 2;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    
    return {
      ...item,
      startAngle,
      endAngle,
      path: calculatePiePath(startAngle, endAngle),
    };
  });
  
  // Handle category selection
  const handleCategoryPress = (category: CategoryData) => {
    setSelectedCategory(selectedCategory === category.id ? null : category.id);
    
    // Scale animation for feedback
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (onCategoryPress) {
      onCategoryPress(category);
    }
  };
  
  // Calculate bar chart dimensions
  const barWidth = (chartWidth - spacing.md * (data.length + 1)) / data.length;
  const maxBarHeight = chartHeight - 40;
  
  const renderPieChart = () => (
    <G>
      {pieData.map((item, index) => {
        const isSelected = selectedCategory === item.id;
        const scale = morphAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0],
        });
        
        return (
          <AnimatedG
            key={item.id}
            scale={scale}
            origin={`${pieCenter.x}, ${pieCenter.y}`}
          >
            <Path
              d={item.path}
              fill={item.color}
              opacity={selectedCategory && !isSelected ? 0.3 : 1}
              onPress={() => handleCategoryPress(item)}
            />
            {isSelected && (
              <Circle
                cx={pieCenter.x}
                cy={pieCenter.y}
                r={pieRadius + 10}
                fill="none"
                stroke={item.color}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}
          </AnimatedG>
        );
      })}
      
      {/* Center hole for donut effect */}
      <Circle
        cx={pieCenter.x}
        cy={pieCenter.y}
        r={pieRadius * 0.6}
        fill={clarifiColors.surface}
      />
      
      {/* Center text */}
      <SvgText
        x={pieCenter.x}
        y={pieCenter.y - 10}
        fontSize="14"
        fill={clarifiColors.neutralSecondary}
        textAnchor="middle"
      >
        Total
      </SvgText>
      <SvgText
        x={pieCenter.x}
        y={pieCenter.y + 10}
        fontSize="20"
        fontWeight="bold"
        fill={clarifiColors.primaryText}
        textAnchor="middle"
      >
        {formatCurrency(totalAmount)}
      </SvgText>
    </G>
  );
  
  const renderBarChart = () => (
    <G>
      {data.map((item, index) => {
        const barHeight = (item.amount / totalAmount) * maxBarHeight;
        const x = spacing.md + index * (barWidth + spacing.md);
        const y = chartHeight - barHeight - 20;
        const isSelected = selectedCategory === item.id;
        
        const scaleY = morphAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });
        
        return (
          <AnimatedG key={item.id}>
            <Defs>
              <LinearGradient id={`barGradient-${item.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={item.color} stopOpacity="1" />
                <Stop offset="100%" stopColor={item.color} stopOpacity="0.7" />
              </LinearGradient>
            </Defs>
            
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={`url(#barGradient-${item.id})`}
              rx={4}
              opacity={selectedCategory && !isSelected ? 0.3 : 1}
              onPress={() => handleCategoryPress(item)}
            />
            
            {/* Value on top of bar */}
            <SvgText
              x={x + barWidth / 2}
              y={y - 5}
              fontSize="12"
              fill={clarifiColors.primaryText}
              textAnchor="middle"
              fontWeight="600"
            >
              {item.percentage.toFixed(0)}%
            </SvgText>
            
            {/* Category name below bar */}
            <SvgText
              x={x + barWidth / 2}
              y={chartHeight - 5}
              fontSize="10"
              fill={clarifiColors.neutralSecondary}
              textAnchor="middle"
            >
              {item.name.substring(0, 8)}
            </SvgText>
          </AnimatedG>
        );
      })}
    </G>
  );
  
  return (
    <View style={styles.container}>
      {/* Chart Type Toggle */}
      <View style={styles.header}>
        <Text style={styles.title}>Spending Breakdown</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={toggleChartType}
          activeOpacity={0.7}
        >
          {chartType === 'pie' ? (
            <BarChart3 size={20} color={clarifiColors.primary} />
          ) : (
            <PieChartIcon size={20} color={clarifiColors.primary} />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Chart */}
      <Animated.View
        style={[
          styles.chartContainer,
          {
            transform: [{ scale: scaleAnimation }],
          },
        ]}
      >
        <Svg width={chartWidth} height={chartHeight}>
          {chartType === 'pie' ? renderPieChart() : renderBarChart()}
        </Svg>
      </Animated.View>
      
      {/* Legend */}
      <View style={styles.legend}>
        {data.map((item) => {
          const isSelected = selectedCategory === item.id;
          
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.legendItem,
                isSelected && styles.legendItemSelected,
              ]}
              onPress={() => handleCategoryPress(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.legendAmount}>
                {formatCurrency(item.amount)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: clarifiColors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: clarifiColors.primaryText,
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: clarifiColors.appBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: clarifiColors.border,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  legend: {
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  legendItemSelected: {
    backgroundColor: clarifiColors.appBackground,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: clarifiColors.primaryText,
    fontWeight: '400',
  },
  legendAmount: {
    fontSize: 14,
    color: clarifiColors.neutralSecondary,
    fontWeight: '500',
  },
});