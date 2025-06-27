import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

interface CategoryData {
  category?: string;
  name?: string; // Support both formats
  amount: number;
  percentage: number;
  color: string;
  budget?: number;
  icon?: string;
  transactions: number;
  trend?: 'up' | 'down' | 'neutral';
  trendPercentage?: number;
}

interface CategoryBreakdownProps {
  categories: CategoryData[];
  onCategoryPress?: (category: CategoryData) => void;
  onSeeAllPress?: () => void;
  showTrends?: boolean;
  maxVisible?: number;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  categories,
  onCategoryPress,
  onSeeAllPress,
  showTrends = true,
  maxVisible = 5,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Helper function to get category name
  const getCategoryName = (category: CategoryData) => category.category || category.name || 'Unknown';
  
  // Helper function to get icon name
  const getIconName = (category: CategoryData) => {
    const categoryName = getCategoryName(category);
    switch (categoryName.toLowerCase()) {
      case 'food & dining':
      case 'food':
        return 'restaurant';
      case 'transportation':
        return 'car';
      case 'shopping':
        return 'bag';
      case 'entertainment':
        return 'game-controller';
      case 'healthcare':
        return 'medical';
      case 'utilities':
        return 'home';
      default:
        return 'bag';
    }
  };
  
  // Enhanced animations
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const pieChartRotation = useRef(new Animated.Value(0)).current;
  
  // Use useMemo for stable, fresh animation creation
  const categoryAnimations = useMemo(() => 
    categories.map(() => ({
      scale: new Animated.Value(0.8),
      opacity: new Animated.Value(0),
      slideIn: new Animated.Value(50),
    })), 
    [categories.length]
  );

  useEffect(() => {
    // Reset animation values to initial state
    containerOpacity.setValue(0);
    pieChartRotation.setValue(0);
    
    // Only reset if we have animations
    if (categoryAnimations.length > 0) {
      categoryAnimations.forEach(anim => {
        if (anim) {
          anim.scale.setValue(0.8);
          anim.opacity.setValue(0);
          anim.slideIn.setValue(50);
        }
      });

      // Start container fade in
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        // After container fades in, start other animations
        // Start pie chart rotation separately
        Animated.loop(
          Animated.timing(pieChartRotation, {
            toValue: 1,
            duration: 20000,
            useNativeDriver: true,
          })
        ).start();

        // Stagger category animations
        const visibleAnims = categoryAnimations.slice(0, Math.min(categories.length, maxVisible));
        Animated.stagger(100,
          visibleAnims.map(anim =>
            Animated.parallel([
              Animated.spring(anim.scale, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
              }),
              Animated.timing(anim.opacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.spring(anim.slideIn, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
              }),
            ])
          )
        ).start();
      });
    }
  }, [categories.length, maxVisible]);


  const handleCategoryPress = (category: CategoryData, index: number) => {
    // Micro-interaction animation with bounds checking
    const anim = categoryAnimations[index];
    if (anim && index < categoryAnimations.length) {
      Animated.sequence([
        Animated.timing(anim.scale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(anim.scale, {
          toValue: 1,
          friction: 6,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Toggle expanded state
    const categoryName = getCategoryName(category);
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);

    onCategoryPress?.(category);
  };

  const renderPieChart = () => {
    const total = categories.reduce((sum, cat) => sum + cat.percentage, 0);
    let currentAngle = 0;
    
    return (
      <View style={styles.pieChartContainer}>
        <Animated.View 
          style={[
            styles.pieChart,
            {
              transform: [{
                rotate: pieChartRotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }
          ]}
        >
          {categories.slice(0, 5).map((category, index) => {
            const angle = (category.percentage / 100) * 360;
            const startAngle = currentAngle;
            currentAngle += angle;
            
            return (
              <View
                key={`pie-${getCategoryName(category)}-${index}`}
                style={[
                  styles.pieSlice,
                  {
                    transform: [
                      { rotate: `${startAngle}deg` },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={[category.color + 'E0', category.color]}
                  style={[
                    styles.pieSliceGradient,
                    {
                      transform: [
                        { rotate: `${angle}deg` },
                      ],
                    },
                  ]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                />
              </View>
            );
          })}
        </Animated.View>
        
        {/* Center circle with total */}
        <View style={styles.centerCircle}>
          <Text style={styles.centerAmount}>
            ${categories.reduce((sum, cat) => sum + cat.amount, 0).toLocaleString()}
          </Text>
          <Text style={styles.centerLabel}>Total</Text>
        </View>
      </View>
    );
  };

  const renderCategoryItem = (category: CategoryData, index: number) => {
    const categoryName = getCategoryName(category);
    const isExpanded = expandedCategories.has(categoryName);
    const animation = categoryAnimations[index];
    const budgetUsed = category.budget ? (category.amount / category.budget) * 100 : 0;
    
    const iconName = getIconName(category);
    
    return (
      <Animated.View
        key={`category-${categoryName}-${index}`}
        style={[
          styles.categoryItemWrapper,
          animation && {
            opacity: animation.opacity,
            transform: [
              { scale: animation.scale },
              { translateX: animation.slideIn },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.categoryItem}
          onPress={() => handleCategoryPress(category, index)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[
              colors.pureWhite,
              colors.surface + 'F8',
              colors.pureWhite,
            ]}
            style={styles.categoryItemGradient}
          >
            {/* Main content */}
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIcon}>
                <LinearGradient
                  colors={[category.color + '20', category.color + '10']}
                  style={styles.iconContainer}
                >
                  <Ionicons name={iconName as any} size={20} color={category.color} />
                </LinearGradient>
              </View>
              
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{categoryName}</Text>
                <Text style={styles.transactionCount}>
                  {category.transactions} transaction{category.transactions !== 1 ? 's' : ''}
                </Text>
              </View>
              
              <View style={styles.categoryStats}>
                <Text style={[styles.categoryAmount, { color: category.color }]}>
                  ${category.amount.toLocaleString()}
                </Text>
                <View style={styles.percentageRow}>
                  <Text style={styles.categoryPercentage}>
                    {category.percentage.toFixed(1)}%
                  </Text>
                  {showTrends && category.trend && category.trendPercentage !== undefined && (
                    <View style={[
                      styles.trendBadge,
                                             {
                         backgroundColor: category.trend === 'up' 
                           ? colors.error + '15' 
                           : category.trend === 'down'
                           ? colors.growth + '15'
                           : colors.textSecondary + '15'
                       }
                    ]}>
                      <Ionicons 
                        name={category.trend === 'down' ? 'trending-down' : 'trending-up'} 
                        size={10} 
                                                 color={
                           category.trend === 'up' 
                             ? colors.error 
                             : category.trend === 'down'
                             ? colors.growth
                             : colors.textSecondary
                         }
                      />
                      <Text style={[
                        styles.trendText,
                                                 {
                           color: category.trend === 'up' 
                             ? colors.error 
                             : category.trend === 'down'
                             ? colors.growth
                             : colors.textSecondary
                         }
                      ]}>
                        {category.trendPercentage.toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              
              <TouchableOpacity style={styles.expandButton}>
                <Ionicons 
                  name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={16} 
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: `${category.percentage}%`,
                      backgroundColor: category.color,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Budget comparison (if expanded) */}
            {isExpanded && category.budget && (
              <View style={styles.expandedContent}>
                <View style={styles.budgetComparison}>
                  <Text style={styles.budgetLabel}>Budget Usage</Text>
                  <View style={styles.budgetProgress}>
                    <View style={styles.budgetTrack}>
                      <View
                        style={[
                          styles.budgetFill,
                          {
                            width: `${Math.min(budgetUsed, 100)}%`,
                                                         backgroundColor: budgetUsed > 90 
                               ? colors.error 
                               : budgetUsed > 75 
                               ? colors.wisdom 
                               : colors.growth,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.budgetText}>
                      ${category.amount.toLocaleString()} / ${category.budget.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const visibleCategories = categories.slice(0, maxVisible);
  const hasMore = categories.length > maxVisible;

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: containerOpacity }
      ]}
    >
      <LinearGradient
        colors={[
          colors.pureWhite,
          colors.surface + 'F8',
          colors.pureWhite,
        ]}
        style={styles.cardGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Spending by Category</Text>
            <Text style={styles.subtitle}>
              Your top spending categories this month
            </Text>
          </View>
          
          {hasMore && (
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={onSeeAllPress}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Pie Chart */}
          {renderPieChart()}
          
          {/* Category List */}
          <View style={styles.categoryList}>
            {visibleCategories.map((category, index) => 
              renderCategoryItem(category, index)
            )}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 16,
  },
  cardGradient: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    ...textStyles.h3,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  seeAllText: {
    ...textStyles.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  pieChartContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
    overflow: 'hidden',
  },
  pieSlice: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    top: '50%',
    left: '50%',
    transformOrigin: '0 0',
  },
  pieSliceGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  centerCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.pureWhite,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  centerAmount: {
    ...textStyles.bodyRegular,
    fontWeight: '700',
    color: colors.textPrimary,
    fontSize: 12,
  },
  centerLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },
  categoryList: {
    flex: 1,
    gap: 12,
  },
  categoryItemWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryItemGradient: {
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    marginRight: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...textStyles.bodyRegular,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  transactionCount: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  categoryStats: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  categoryAmount: {
    ...textStyles.bodyRegular,
    fontWeight: '700',
    marginBottom: 2,
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryPercentage: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  trendText: {
    ...textStyles.caption,
    fontWeight: '600',
    fontSize: 9,
  },
  expandButton: {
    padding: 4,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  budgetComparison: {
    gap: 8,
  },
  budgetLabel: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  budgetProgress: {
    gap: 8,
  },
  budgetTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'right',
  },
});
