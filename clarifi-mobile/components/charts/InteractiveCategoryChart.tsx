import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  PanResponder,
} from 'react-native';
import Svg, { 
  G, 
  Path, 
  Circle, 
  Text as SvgText, 
  Defs, 
  LinearGradient, 
  Stop,
} from 'react-native-svg';
import { formatCurrency } from '../../utils/formatting/currency';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { TrendingUp, TrendingDown, Minus, Settings } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CHART_SIZE = Math.min(width - spacing.lg * 4, 280);
const RADIUS = CHART_SIZE / 2 - 40;
const CENTER = CHART_SIZE / 2;

interface CategoryData {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  budget?: number;
  color: string;
  icon: string;
  trend: 'up' | 'down' | 'stable';
}

interface InteractiveCategoryChartProps {
  categories: CategoryData[];
  onCategoryPress?: (category: CategoryData) => void;
  showBudgets?: boolean;
}

interface PieSlice {
  data: CategoryData;
  startAngle: number;
  endAngle: number;
  path: string;
  centerX: number;
  centerY: number;
}

export const InteractiveCategoryChart: React.FC<InteractiveCategoryChartProps> = ({
  categories,
  onCategoryPress,
  showBudgets = true,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // Animation values
  const animatedValues = useRef(
    categories.map(() => new Animated.Value(0))
  ).current;
  const scaleValues = useRef(
    categories.map(() => new Animated.Value(1))
  ).current;
  const selectedScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate slices in sequence
    const animations = animatedValues.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 800,
        delay: index * 100,
        useNativeDriver: false,
      })
    );

    Animated.stagger(50, animations).start();
  }, [categories]);

  // Calculate pie slices
  const totalAmount = categories.reduce((sum, cat) => sum + cat.amount, 0);
  const slices: PieSlice[] = [];
  let currentAngle = -Math.PI / 2; // Start at top

  categories.forEach((category, index) => {
    const percentage = category.amount / totalAmount;
    const angle = percentage * 2 * Math.PI;
    const endAngle = currentAngle + angle;

    // Calculate path for pie slice
    const x1 = CENTER + RADIUS * Math.cos(currentAngle);
    const y1 = CENTER + RADIUS * Math.sin(currentAngle);
    const x2 = CENTER + RADIUS * Math.cos(endAngle);
    const y2 = CENTER + RADIUS * Math.sin(endAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;
    const path = [
      `M ${CENTER} ${CENTER}`,
      `L ${x1} ${y1}`,
      `A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    // Calculate center point for slice (for interaction detection)
    const midAngle = (currentAngle + endAngle) / 2;
    const centerX = CENTER + (RADIUS * 0.7) * Math.cos(midAngle);
    const centerY = CENTER + (RADIUS * 0.7) * Math.sin(midAngle);

    slices.push({
      data: category,
      startAngle: currentAngle,
      endAngle,
      path,
      centerX,
      centerY,
    });

    currentAngle = endAngle;
  });

  // Pan responder for touch interactions
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const distance = Math.sqrt(
        Math.pow(locationX - CENTER, 2) + Math.pow(locationY - CENTER, 2)
      );
      
      if (distance <= RADIUS) {
        const angle = Math.atan2(locationY - CENTER, locationX - CENTER);
        const normalizedAngle = angle < -Math.PI / 2 ? angle + 2 * Math.PI : angle;
        
        const sliceIndex = slices.findIndex(slice => {
          let startAngle = slice.startAngle;
          let endAngle = slice.endAngle;
          
          // Normalize angles
          if (startAngle < -Math.PI / 2) startAngle += 2 * Math.PI;
          if (endAngle < -Math.PI / 2) endAngle += 2 * Math.PI;
          
          return normalizedAngle >= startAngle && normalizedAngle <= endAngle;
        });
        
        if (sliceIndex >= 0) {
          setActiveIndex(sliceIndex);
          setSelectedIndex(sliceIndex);
          
          // Animate selection
          Animated.spring(selectedScale, {
            toValue: 1.05,
            useNativeDriver: true,
          }).start();
        }
      }
    },
    
    onPanResponderRelease: () => {
      if (selectedIndex !== null && onCategoryPress) {
        onCategoryPress(categories[selectedIndex]);
      }
      
      setActiveIndex(null);
      Animated.spring(selectedScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    },
  });

  const renderChart = () => (
    <View style={styles.chartContainer} {...panResponder.panHandlers}>
      <Svg width={CHART_SIZE} height={CHART_SIZE}>
        <Defs>
          {categories.map((category, index) => (
            <LinearGradient
              key={`gradient-${index}`}
              id={`gradient-${index}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor={category.color} stopOpacity="1" />
              <Stop offset="100%" stopColor={category.color} stopOpacity="0.7" />
            </LinearGradient>
          ))}
        </Defs>
        
        {slices.map((slice, index) => {
          const isSelected = index === selectedIndex;
          const isActive = index === activeIndex;
          const scale = isSelected ? 1.05 : 1;
          
          return (
            <G key={index}>
              <Path
                d={slice.path}
                fill={`url(#gradient-${index})`}
                stroke={colors.surface}
                strokeWidth={2}
                opacity={isActive ? 1 : 0.9}
                transform={`scale(${scale}) translate(${(1 - scale) * CENTER}, ${(1 - scale) * CENTER})`}
              />
              
              {/* Percentage label */}
              {slice.data.percentage > 5 && (
                <SvgText
                  x={slice.centerX}
                  y={slice.centerY}
                  fontSize="12"
                  fontWeight="600"
                  fill={colors.surface}
                  textAnchor="middle"
                  dy="4"
                >
                  {slice.data.percentage.toFixed(0)}%
                </SvgText>
              )}
            </G>
          );
        })}
        
        {/* Center hole */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS * 0.4}
          fill={colors.surface}
        />
        
        {/* Center content */}
        <SvgText
          x={CENTER}
          y={CENTER - 10}
          fontSize="14"
          fontWeight="600"
          fill={colors.textSecondary}
          textAnchor="middle"
        >
          Total Spending
        </SvgText>
        <SvgText
          x={CENTER}
          y={CENTER + 10}
          fontSize="18"
          fontWeight="700"
          fill={colors.textPrimary}
          textAnchor="middle"
        >
          {formatCurrency(totalAmount)}
        </SvgText>
      </Svg>
    </View>
  );

  const renderLegend = () => (
    <View style={styles.legend}>
      {categories.map((category, index) => {
        const isSelected = index === selectedIndex;
        const budgetUsage = category.budget ? (category.amount / category.budget) * 100 : null;
        const isOverBudget = budgetUsage && budgetUsage > 100;
        
        const TrendIcon = category.trend === 'up' ? TrendingUp :
                         category.trend === 'down' ? TrendingDown : Minus;
        
        return (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.legendItem,
              isSelected && styles.legendItemSelected,
            ]}
            onPress={() => {
              setSelectedIndex(index === selectedIndex ? null : index);
              if (onCategoryPress) {
                onCategoryPress(category);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.legendLeft}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: category.color },
                ]}
              />
              <View style={styles.legendContent}>
                <View style={styles.legendHeader}>
                  <Text style={styles.legendName}>{category.name}</Text>
                  <View style={styles.trendContainer}>
                    <TrendIcon
                      size={12}
                      color={
                        category.trend === 'up' ? colors.error :
                        category.trend === 'down' ? colors.growth :
                        colors.textSecondary
                      }
                    />
                  </View>
                </View>
                
                <View style={styles.legendDetails}>
                  <Text style={styles.legendAmount}>
                    {formatCurrency(category.amount)}
                  </Text>
                  <Text style={styles.legendPercentage}>
                    {category.percentage.toFixed(1)}%
                  </Text>
                </View>
                
                {showBudgets && category.budget && (
                  <View style={styles.budgetContainer}>
                    <View style={styles.budgetBar}>
                      <View
                        style={[
                          styles.budgetProgress,
                          {
                            width: `${Math.min(budgetUsage!, 100)}%`,
                            backgroundColor: isOverBudget ? colors.error : colors.growth,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.budgetText,
                        { color: isOverBudget ? colors.error : colors.textSecondary },
                      ]}
                    >
                      {budgetUsage!.toFixed(0)}% of {formatCurrency(category.budget)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.categorySettings}
              onPress={() => {
                // Navigate to category settings
              }}
            >
              <Settings size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const selectedCategory = selectedIndex !== null ? categories[selectedIndex] : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Spending by Category</Text>
        <TouchableOpacity style={styles.expandButton}>
          <Settings size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {renderChart()}
      
      {selectedCategory && (
        <Animated.View
          style={[
            styles.selectedDetails,
            {
              opacity: selectedScale.interpolate({
                inputRange: [1, 1.05],
                outputRange: [0, 1],
              }),
            },
          ]}
        >
          <Text style={styles.selectedName}>{selectedCategory.name}</Text>
          <Text style={styles.selectedAmount}>
            {formatCurrency(selectedCategory.amount)}
          </Text>
          <Text style={styles.selectedPercentage}>
            {selectedCategory.percentage.toFixed(1)}% of total spending
          </Text>
        </Animated.View>
      )}
      
      {renderLegend()}
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
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...textStyles.h3,
    color: colors.textPrimary,
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
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  selectedDetails: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary + '08',
    marginHorizontal: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  selectedName: {
    ...textStyles.h3,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  selectedAmount: {
    ...textStyles.h2,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  selectedPercentage: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
  },
  legend: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  legendItemSelected: {
    backgroundColor: colors.primary + '08',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  legendContent: {
    flex: 1,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  legendName: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  trendContainer: {
    marginLeft: spacing.sm,
  },
  legendDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  legendAmount: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  legendPercentage: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
  budgetContainer: {
    marginTop: spacing.xs,
  },
  budgetBar: {
    height: 4,
    backgroundColor: colors.neutral?.lightest || '#f8f9fa',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  budgetProgress: {
    height: '100%',
    borderRadius: 2,
  },
  budgetText: {
    ...textStyles.caption,
    fontSize: 10,
  },
  categorySettings: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral?.lightest || '#f8f9fa',
  },
});