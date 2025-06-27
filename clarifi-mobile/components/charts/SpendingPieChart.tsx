import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import { formatCurrency } from '../../utils/formatting/currency';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react-native';

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  budget: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
  icon: string;
}

interface SpendingPieChartProps {
  categories: CategoryData[];
  onCategoryPress?: (category: CategoryData) => void;
}

const { width } = Dimensions.get('window');
const CHART_SIZE = width * 0.6;
const RADIUS = CHART_SIZE / 2 - 20;
const CENTER = CHART_SIZE / 2;

export const SpendingPieChart: React.FC<SpendingPieChartProps> = ({
  categories,
  onCategoryPress,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  const total = categories.reduce((sum, cat) => sum + cat.amount, 0);

  const createPath = (
    startAngle: number,
    endAngle: number,
    isSelected: boolean = false
  ) => {
    const radius = isSelected ? RADIUS + 8 : RADIUS;
    const start = polarToCartesian(CENTER, CENTER, radius, endAngle);
    const end = polarToCartesian(CENTER, CENTER, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', CENTER, CENTER,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z'
    ].join(' ');
  };

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  let currentAngle = 0;
  const segments = categories.map((category, index) => {
    const angle = (category.amount / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const segment = {
      ...category,
      startAngle,
      endAngle,
      path: createPath(startAngle, endAngle, selectedIndex === index),
    };

    currentAngle += angle;
    return segment;
  });

  const handleSegmentPress = (category: CategoryData, index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);
    onCategoryPress?.(category);
  };

  const renderCenterContent = () => {
    const selectedCategory = selectedIndex !== null ? categories[selectedIndex] : null;
    
    return (
      <View style={styles.centerContent}>
        {selectedCategory ? (
          <>
            <Text style={styles.centerIcon}>{selectedCategory.icon}</Text>
            <Text style={styles.centerAmount}>
              {formatCurrency(selectedCategory.amount)}
            </Text>
            <Text style={styles.centerPercentage}>
              {selectedCategory.percentage.toFixed(1)}%
            </Text>
            <Text style={styles.centerName}>{selectedCategory.name}</Text>
          </>
        ) : (
          <>
            <Text style={styles.centerLabel}>Total Spent</Text>
            <Text style={styles.centerTotal}>
              {formatCurrency(total)}
            </Text>
            <Text style={styles.centerSubtext}>This Month</Text>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Spending Breakdown</Text>
          <Text style={styles.subtitle}>
            You have spent {formatCurrency(total)} this month
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <MoreHorizontal size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Pie Chart */}
      <View style={styles.chartContainer}>
        <Svg width={CHART_SIZE} height={CHART_SIZE}>
          {segments.map((segment, index) => (
            <G key={index}>
              <Path
                d={segment.path}
                fill={segment.color}
                stroke={colors.surface}
                strokeWidth={2}
                onPress={() => handleSegmentPress(segment, index)}
              />
            </G>
          ))}
        </Svg>
        {renderCenterContent()}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {categories.slice(0, 3).map((category, index) => (
          <TouchableOpacity
            key={category.name}
            style={[
              styles.legendItem,
              selectedIndex === index && styles.selectedLegendItem,
            ]}
            onPress={() => handleSegmentPress(category, index)}
            activeOpacity={0.7}
          >
            <View style={styles.legendLeft}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: category.color }
                ]}
              />
              <Text style={styles.legendIcon}>{category.icon}</Text>
              <View style={styles.legendText}>
                <Text style={styles.legendName}>{category.name}</Text>
                <Text style={styles.legendBudget}>
                  {formatCurrency(category.amount)} of {formatCurrency(category.budget)}
                </Text>
              </View>
            </View>
            <View style={styles.legendRight}>
              <Text style={styles.legendPercentage}>
                {category.percentage.toFixed(1)}%
              </Text>
              <View style={styles.trendContainer}>
                {category.trend === 'up' && (
                  <TrendingUp size={12} color={colors.error} />
                )}
                {category.trend === 'down' && (
                  <TrendingDown size={12} color={colors.growth} />
                )}
                {category.trend === 'stable' && (
                  <MoreHorizontal size={12} color={colors.textSecondary} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* View All Button */}
      <TouchableOpacity style={styles.viewAllButton}>
        <Text style={styles.viewAllText}>View All Categories</Text>
        <MoreHorizontal size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  moreButton: {
    padding: spacing.xs,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.lg,
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: CHART_SIZE * 0.5,
    height: CHART_SIZE * 0.5,
  },
  centerIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  centerAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  centerPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  centerName: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  centerLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  centerTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  centerSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  legend: {
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  selectedLegendItem: {
    backgroundColor: colors.primary + '10',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  legendIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  legendText: {
    flex: 1,
  },
  legendName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  legendBudget: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  legendPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral?.light || '#e2e8f0',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});