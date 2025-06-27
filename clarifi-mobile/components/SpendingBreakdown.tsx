import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  ChevronRight,
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Zap,
  DollarSign
} from 'lucide-react-native';
import { colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  budget?: number;
}

interface SpendingBreakdownProps {
  data: SpendingCategory[];
}

const getCategoryIcon = (category: string) => {
  const iconMap: { [key: string]: any } = {
    'Food & Dining': Utensils,
    'Transportation': Car,
    'Shopping': ShoppingBag,
    'Bills & Utilities': Home,
    'Entertainment': Zap,
    'Other': DollarSign,
    'Groceries': Utensils,
    'Dining Out': Utensils,
    'Utilities': Home,
  };
  
  return iconMap[category] || DollarSign;
};

const CategoryItem: React.FC<{
  item: SpendingCategory;
  index: number;
  onPress: (category: string) => void;
}> = ({ item, index, onPress }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);
  
  // Mock budget data - in real app this would come from API
  const budget = item.budget || item.amount * 1.2; // Default budget 20% higher than spent
  const isOverBudget = item.amount > budget;
  const budgetUsagePercent = Math.min((item.amount / budget) * 100, 100);
  
  const IconComponent = getCategoryIcon(item.category);

  useEffect(() => {
    // Staggered animation for each category
    Animated.sequence([
      Animated.delay(index * 150),
      Animated.timing(progressAnim, {
        toValue: item.percentage,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  }, [item.percentage, index]);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    onPress(item.category);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.categoryItem,
          {
            transform: [{ scale: scaleAnim }],
            borderLeftColor: item.color,
          },
        ]}
      >
        {/* Category Header */}
        <View style={styles.categoryHeader}>
          <View style={styles.categoryTitleRow}>
            <View style={[styles.categoryIcon, { backgroundColor: item.color + '15' }]}>
              <IconComponent size={20} color={item.color} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{item.category}</Text>
              <Text style={styles.budgetInfo}>
                ${item.amount.toLocaleString()} of ${budget.toLocaleString()} budget
              </Text>
            </View>
          </View>
          
          <View style={styles.categoryActions}>
            {isOverBudget && (
              <View style={styles.warningBadge}>
                <AlertTriangle size={14} color={colors.error} />
              </View>
            )}
            <Text style={styles.categoryAmount}>${item.amount.toLocaleString()}</Text>
            <ChevronRight size={16} color={colors.neutral.medium} />
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  backgroundColor: item.color,
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.percentageText}>{item.percentage.toFixed(1)}%</Text>
        </View>

        {/* Budget Progress */}
        <View style={styles.budgetSection}>
          <View style={styles.budgetTrack}>
            <Animated.View
              style={[
                styles.budgetBar,
                {
                  backgroundColor: isOverBudget ? colors.error : colors.success,
                  width: `${Math.min(budgetUsagePercent, 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[
            styles.budgetText,
            { color: isOverBudget ? colors.error : colors.success }
          ]}>
            {budgetUsagePercent.toFixed(0)}% of budget
          </Text>
        </View>

        {/* Over Budget Warning */}
        {isOverBudget && (
          <View style={styles.warningSection}>
            <AlertTriangle size={16} color={colors.error} />
            <Text style={styles.warningText}>
              ${(item.amount - budget).toLocaleString()} over budget
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const SpendingBreakdown: React.FC<SpendingBreakdownProps> = ({ data }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
    // Navigate to category details
    console.log(`Navigate to ${category} details`);
  };

  const totalBudget = data.reduce((sum, item) => sum + (item.budget || item.amount * 1.2), 0);
  const totalSpent = data.reduce((sum, item) => sum + item.amount, 0);
  const overBudgetCategories = data.filter(item => item.amount > (item.budget || item.amount * 1.2));

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      <View style={styles.summaryHeader}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryValue}>${totalSpent.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Budget</Text>
          <Text style={styles.summaryValue}>${totalBudget.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Over Budget</Text>
          <Text style={[styles.summaryValue, { color: overBudgetCategories.length > 0 ? colors.error : colors.success }]}>
            {overBudgetCategories.length}
          </Text>
        </View>
      </View>

      {/* Categories List */}
      <View style={styles.categoriesList}>
        {data.map((item, index) => (
          <CategoryItem
            key={item.category}
            item={item}
            index={index}
            onPress={handleCategoryPress}
          />
        ))}
      </View>

      {/* Budget Tips */}
      {overBudgetCategories.length > 0 && (
        <View style={styles.tipsSection}>
          <View style={styles.tipHeader}>
            <AlertTriangle size={16} color={colors.warning} />
            <Text style={styles.tipTitle}>Budget Insights</Text>
          </View>
          <Text style={styles.tipText}>
            You're over budget in {overBudgetCategories.length} {overBudgetCategories.length === 1 ? 'category' : 'categories'}. 
            Consider reviewing your {overBudgetCategories[0].category.toLowerCase()} spending.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    backgroundColor: colors.pureWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.neutral.medium,
    fontWeight: '400',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 16,
    color: colors.midnightInk,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoriesList: {
    gap: 12,
  },
  categoryItem: {
    backgroundColor: colors.pureWhite,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.midnightInk,
    marginBottom: 2,
  },
  budgetInfo: {
    fontSize: 12,
    color: colors.neutral.medium,
    fontWeight: '400',
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningBadge: {
    padding: 4,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.midnightInk,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.neutral.light,
    borderRadius: 4,
    marginRight: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.midnightInk,
    minWidth: 40,
    textAlign: 'right',
  },
  budgetSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.neutral.light,
    borderRadius: 2,
    marginRight: 12,
  },
  budgetBar: {
    height: '100%',
    borderRadius: 2,
  },
  budgetText: {
    fontSize: 10,
    fontWeight: '500',
    minWidth: 80,
    textAlign: 'right',
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBackground,
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '500',
    marginLeft: 8,
  },
  tipsSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.midnightInk,
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: colors.neutral.dark,
    lineHeight: 20,
  },
});