import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, TrendingUp, TrendingDown, MoreVertical, PieChart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { colors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface CategoryBreakdownData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  budget?: number;
  icon: any;
  transactions: number;
  trend: {
    change: number;
    isPositive: boolean;
  };
}

// Mock data - in real app this would come from API
const mockCategoryData: CategoryBreakdownData[] = [
  {
    category: 'Food & Dining',
    amount: 845,
    percentage: 32.4,
    color: '#FF6B6B',
    budget: 800,
    icon: 'Utensils',
    transactions: 28,
    trend: { change: 12.5, isPositive: false }
  },
  {
    category: 'Transportation',
    amount: 420,
    percentage: 16.1,
    color: '#4ECDC4',
    budget: 500,
    icon: 'Car',
    transactions: 15,
    trend: { change: 8.2, isPositive: true }
  },
  {
    category: 'Shopping',
    amount: 380,
    percentage: 14.6,
    color: '#45B7D1',
    budget: 400,
    icon: 'ShoppingBag',
    transactions: 22,
    trend: { change: 5.1, isPositive: false }
  },
  {
    category: 'Utilities',
    amount: 285,
    percentage: 10.9,
    color: '#96CEB4',
    budget: 300,
    icon: 'Home',
    transactions: 8,
    trend: { change: 2.3, isPositive: true }
  },
  {
    category: 'Entertainment',
    amount: 220,
    percentage: 8.4,
    color: '#FECA57',
    budget: 250,
    icon: 'Music',
    transactions: 12,
    trend: { change: 15.8, isPositive: false }
  },
  {
    category: 'Healthcare',
    amount: 165,
    percentage: 6.3,
    color: '#A8E6CF',
    budget: 200,
    icon: 'Heart',
    transactions: 6,
    trend: { change: 3.2, isPositive: true }
  },
  {
    category: 'Miscellaneous',
    amount: 285,
    percentage: 10.9,
    color: '#D1A3FF',
    budget: 300,
    icon: 'MoreHorizontal',
    transactions: 18,
    trend: { change: 7.4, isPositive: false }
  }
];

export default function CategoryBreakdownScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [data, setData] = useState(mockCategoryData);
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const totalSpent = data.reduce((sum, category) => sum + category.amount, 0);

  const renderPieChart = () => {
    const total = data.reduce((sum, cat) => sum + cat.amount, 0);
    let currentAngle = -90; // Start from top
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
    
    return (
      <View style={styles.pieChartContainer}>
        <Svg width={200} height={200} style={styles.pieChart}>
          <Defs>
            <SvgLinearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#6B5DD3" stopOpacity="1" />
              <Stop offset="100%" stopColor="#9333ea" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          
          {data.map((category, index) => {
            const percentage = (category.amount / total) * 100;
            const angle = (percentage / 100) * 360;
            const endAngle = currentAngle + angle;
            
            const x1 = centerX + radius * Math.cos((currentAngle * Math.PI) / 180);
            const y1 = centerY + radius * Math.sin((currentAngle * Math.PI) / 180);
            const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
            const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z',
            ].join(' ');
            
            currentAngle = endAngle;
            
            return (
              <Path
                key={index}
                d={pathData}
                fill={category.color}
                opacity={0.9}
              />
            );
          })}
          
          <Circle cx={centerX} cy={centerY} r="50" fill={theme.surface} />
        </Svg>
        
        <View style={styles.pieChartCenter}>
          <Text style={[styles.pieChartCenterLabel, { color: theme.textSecondary }]}>Total Spent</Text>
          <Text style={[styles.pieChartCenterValue, { color: theme.textPrimary }]}>${totalSpent.toLocaleString()}</Text>
          <Text style={[styles.pieChartCenterPeriod, { color: theme.textSecondary }]}>This {selectedPeriod}</Text>
        </View>
      </View>
    );
  };

  const renderCategoryItem = (category: CategoryBreakdownData, index: number) => {
    const budgetPercentage = category.budget ? (category.amount / category.budget) * 100 : 0;
    const isOverBudget = budgetPercentage > 100;
    
    return (
      <Animated.View
        key={category.category}
        style={[
          styles.categoryItem,
          { backgroundColor: theme.surface },
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 50],
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.categoryContent}
          onPress={() => router.push(`/category/${category.category.toLowerCase().replace(/\s+/g, '-')}`)}
        >
          <View style={styles.categoryLeft}>
            <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
              <PieChart size={24} color={category.color} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryName, { color: theme.textPrimary }]}>
                {category.category}
              </Text>
              <Text style={[styles.categoryTransactions, { color: theme.textSecondary }]}>
                {category.transactions} transactions
              </Text>
              {category.budget && (
                <View style={styles.budgetContainer}>
                  <View style={[styles.budgetBar, { backgroundColor: colors.borderColor }]}>
                    <View 
                      style={[
                        styles.budgetFill, 
                        { 
                          backgroundColor: isOverBudget ? colors.errorRed : category.color,
                          width: `${Math.min(budgetPercentage, 100)}%`
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.budgetText, { color: isOverBudget ? colors.errorRed : theme.textSecondary }]}>
                    {budgetPercentage.toFixed(0)}% of budget
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.categoryRight}>
            <Text style={[styles.categoryAmount, { color: theme.textPrimary }]}>
              ${category.amount.toLocaleString()}
            </Text>
            <Text style={[styles.categoryPercentage, { color: theme.textSecondary }]}>
              {category.percentage.toFixed(1)}%
            </Text>
            <View style={styles.trendContainer}>
              {category.trend.isPositive ? (
                <TrendingDown size={14} color={colors.errorRed} />
              ) : (
                <TrendingUp size={14} color={colors.growthGreen} />
              )}
              <Text style={[
                styles.trendText, 
                { color: category.trend.isPositive ? colors.errorRed : colors.growthGreen }
              ]}>
                {category.trend.change.toFixed(1)}%
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.clarityBlue} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Category Breakdown</Text>
        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodContainer}>
          <View style={[styles.periodSelector, { backgroundColor: colors.cloudGray }]}>
            {(['week', 'month', 'year'] as const).map((period) => {
              const isSelected = selectedPeriod === period;
              return (
                <TouchableOpacity
                  key={period}
                  style={[styles.periodButton, isSelected && styles.periodButtonActive]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={[colors.clarityBlue, colors.skyTrust]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.periodButtonGradient}
                    >
                      <Text style={[styles.periodButtonText, { color: colors.pureWhite }]}>
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <Text style={[styles.periodButtonText, { color: theme.textSecondary }]}>
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Pie Chart */}
        <Animated.View style={[styles.chartCard, { backgroundColor: theme.surface, opacity: fadeAnim }]}>
          {renderPieChart()}
        </Animated.View>

        {/* Categories List */}
        <View style={styles.categoriesContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Category Details</Text>
          {data.map((category, index) => renderCategoryItem(category, index))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  periodContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    overflow: 'hidden',
  },
  periodButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    alignItems: 'center',
  },
  pieChartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieChart: {
    transform: [{ rotate: '0deg' }],
  },
  pieChartCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieChartCenterLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  pieChartCenterValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  pieChartCenterPeriod: {
    fontSize: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  categoryItem: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryTransactions: {
    fontSize: 12,
    marginBottom: 8,
  },
  budgetContainer: {
    gap: 4,
  },
  budgetBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  budgetFill: {
    height: '100%',
    borderRadius: 2,
  },
  budgetText: {
    fontSize: 10,
    fontWeight: '500',
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});