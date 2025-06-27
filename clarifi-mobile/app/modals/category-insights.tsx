import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  X,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import Svg, {
  Line,
  Circle,
  Path,
  G,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { formatCurrency } from '../../utils/formatting/currency';
import SpendingAnalyticsService from '../../services/ai/spendingAnalytics';

const { width } = Dimensions.get('window');

interface CategoryData {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
  transactions: number;
}

interface InsightCard {
  id: string;
  type: 'increase' | 'decrease' | 'suggestion' | 'warning';
  icon: string;
  title: string;
  description: string;
}

interface TrendData {
  month: string;
  amount: number;
  date: string;
}

interface CategoryTrendData {
  categoryId: string;
  monthlyData: TrendData[];
  visible: boolean;
}

// PRD: Category Insights Screen - Category Breakdown View State
const CategoryInsightsModal = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'breakdown' | 'trends'>(
    'breakdown'
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [trendsData, setTrendsData] = useState<CategoryTrendData[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<{
    categoryId: string;
    monthIndex: number;
  } | null>(null);
  const [unusualSpendingAlerts, setUnusualSpendingAlerts] = useState<any[]>([]);
  const [spendingAnalytics] = useState(SpendingAnalyticsService.getInstance());

  // Animation values
  const donutAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
  const barAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
  const insightAnimations = useRef<{ [key: string]: Animated.Value }>(
    {}
  ).current;

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    const mockCategories: CategoryData[] = [
      {
        id: 'food-dining',
        name: 'Food & Dining',
        amount: 487.5,
        percentage: 32.5,
        color: '#FF6B6B',
        icon: '🍔',
        transactions: 23,
      },
      {
        id: 'transport',
        name: 'Transport',
        amount: 298.75,
        percentage: 19.9,
        color: '#4ECDC4',
        icon: '🚗',
        transactions: 12,
      },
      {
        id: 'groceries',
        name: 'Groceries',
        amount: 234.2,
        percentage: 15.6,
        color: '#45B7D1',
        icon: '🛒',
        transactions: 8,
      },
      {
        id: 'entertainment',
        name: 'Entertainment',
        amount: 178.9,
        percentage: 11.9,
        color: '#96CEB4',
        icon: '🎬',
        transactions: 7,
      },
      {
        id: 'bills',
        name: 'Bills',
        amount: 302.65,
        percentage: 20.1,
        color: '#FECA57',
        icon: '📱',
        transactions: 5,
      },
    ];

    const mockInsights: InsightCard[] = [
      {
        id: '1',
        type: 'increase',
        icon: '📈',
        title: 'Transport spending up 23%',
        description:
          'You spent $67 more on transport this month compared to last month.',
      },
      {
        id: '2',
        type: 'decrease',
        icon: '📉',
        title: 'Entertainment down 15%',
        description:
          'Great job reducing entertainment expenses by $42 this month!',
      },
      {
        id: '3',
        type: 'suggestion',
        icon: '💡',
        title: 'Consider setting a dining budget',
        description:
          'You spent 40% more on dining this month. A budget could help track this.',
      },
    ];

    // PRD: Generate 6-month trends data for line graphs
    const generateTrendsData = () => {
      const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const fullMonths = ['July', 'August', 'September', 'October', 'November', 'December'];
      
      return mockCategories.map(category => ({
        categoryId: category.id,
        visible: true,
        monthlyData: months.map((month, index) => {
          // Generate realistic trend data with some seasonality
          const baseAmount = category.amount;
          const seasonalVariation = Math.sin((index / 6) * Math.PI * 2) * 0.3;
          const randomVariation = (Math.random() - 0.5) * 0.4;
          const trendFactor = 1 + seasonalVariation + randomVariation;
          
          return {
            month,
            date: fullMonths[index],
            amount: Math.max(50, baseAmount * trendFactor * (0.7 + index * 0.05)),
          };
        }),
      }));
    };

    const mockTrendsData = generateTrendsData();

    // PRD: AI-powered unusual spending detection
    const mockSpendingData = spendingAnalytics.generateMockSpendingData();
    const spendingPatterns = spendingAnalytics.analyzeSpendingPatterns(mockSpendingData);
    const alerts = spendingAnalytics.generateUnusualSpendingAlerts(spendingPatterns, mockSpendingData);

    setCategoryData(mockCategories);
    setInsights(mockInsights);
    setTrendsData(mockTrendsData);
    setUnusualSpendingAlerts(alerts);

    // Initialize animations
    mockCategories.forEach((category, index) => {
      donutAnimations[category.id] = new Animated.Value(0);
      barAnimations[category.id] = new Animated.Value(0);
    });

    mockInsights.forEach((insight, index) => {
      insightAnimations[insight.id] = new Animated.Value(0);
    });

    // Start animations
    startAnimations();
  };

  const startAnimations = () => {
    if (selectedTab === 'breakdown') {
      // PRD: Segments animate in clockwise (400ms each)
      const donutSequence = categoryData.map((category, index) =>
        Animated.timing(donutAnimations[category.id], {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: false,
        })
      );

      // PRD: Horizontal bar chart with animated fill
      const barSequence = categoryData.map((category, index) =>
        Animated.timing(barAnimations[category.id], {
          toValue: 1,
          duration: 600,
          delay: 200 + index * 150,
          useNativeDriver: false,
        })
      );

      Animated.parallel([
        Animated.stagger(100, donutSequence),
        Animated.stagger(150, barSequence),
      ]).start();
    }

    // PRD: Each insight has subtle slide-up animation on scroll
    const insightSequence = insights.map((insight, index) =>
      Animated.timing(insightAnimations[insight.id], {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      })
    );

    Animated.stagger(100, insightSequence).start();
  };

  useEffect(() => {
    startAnimations();
  }, [selectedTab]);

  const handleCategoryTap = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    // In real app, this would filter transactions
  };

  const renderDonutChart = () => {
    const radius = 80;
    const strokeWidth = 20;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercentage = 0;

    return (
      <View style={styles.donutContainer}>
        <View style={styles.donutChart}>
          {/* Background circle */}
          <View
            style={[
              styles.donutBackground,
              {
                width: (radius + strokeWidth) * 2,
                height: (radius + strokeWidth) * 2,
                borderRadius: radius + strokeWidth,
                borderWidth: strokeWidth,
              },
            ]}
          />

          {/* Category segments */}
          {categoryData.map((category, index) => {
            const strokeDasharray = `${(category.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset =
              (-cumulativePercentage * circumference) / 100;
            cumulativePercentage += category.percentage;

            return (
              <Animated.View
                key={category.id}
                style={[
                  styles.donutSegment,
                  {
                    width: (radius + strokeWidth) * 2,
                    height: (radius + strokeWidth) * 2,
                    borderRadius: radius + strokeWidth,
                    borderWidth: strokeWidth,
                    borderColor: category.color,
                    opacity: donutAnimations[category.id],
                    transform: [
                      {
                        rotate: donutAnimations[category.id].interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  },
                ]}
              />
            );
          })}

          {/* Center content */}
          <View style={styles.donutCenter}>
            <Text style={styles.donutCenterTitle}>Total</Text>
            <Text style={styles.donutCenterAmount}>
              {formatCurrency(
                categoryData.reduce((sum, cat) => sum + cat.amount, 0)
              )}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLegend = () => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.legendContainer}
        contentContainerStyle={styles.legendContent}
      >
        {categoryData.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.legendItem,
              selectedCategory === category.id && styles.selectedLegendItem,
            ]}
            onPress={() => handleCategoryTap(category.id)}
          >
            <View
              style={[styles.legendDot, { backgroundColor: category.color }]}
            />
            <View style={styles.legendText}>
              <Text style={styles.legendName}>{category.name}</Text>
              <Text style={styles.legendAmount}>
                {formatCurrency(category.amount)} ({category.percentage}%)
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderTopCategories = () => {
    const topCategories = [...categoryData]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return (
      <View style={styles.topCategoriesContainer}>
        <Text style={styles.sectionTitle}>Top Categories</Text>
        {topCategories.map((category, index) => (
          <View key={category.id} style={styles.topCategoryItem}>
            <View style={styles.topCategoryInfo}>
              <Text style={styles.topCategoryIcon}>{category.icon}</Text>
              <View style={styles.topCategoryDetails}>
                <Text style={styles.topCategoryName}>{category.name}</Text>
                <Text style={styles.topCategoryTransactions}>
                  {category.transactions} transactions
                </Text>
              </View>
            </View>

            <View style={styles.topCategoryBar}>
              <Animated.View
                style={[
                  styles.topCategoryBarFill,
                  {
                    backgroundColor: category.color,
                    width:
                      barAnimations[category.id]?.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${category.percentage}%`],
                      }) || '0%',
                  },
                ]}
              />
            </View>

            <Text style={styles.topCategoryAmount}>
              {formatCurrency(category.amount)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderUnusualSpending = () => {
    // PRD: AI-powered "Unusual Spending" card if detected
    if (!unusualSpendingAlerts || unusualSpendingAlerts.length === 0) return null;

    // Show the highest severity alert
    const primaryAlert = unusualSpendingAlerts[0];
    
    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'high': return colors.error;
        case 'medium': return colors.warning;
        case 'low': return colors.primary;
        default: return colors.warning;
      }
    };

    const getSeverityIcon = (type: string) => {
      switch (type) {
        case 'spending_spike': return <TrendingUp size={20} color={getSeverityColor(primaryAlert.severity)} />;
        case 'budget_exceeded': return <AlertTriangle size={20} color={getSeverityColor(primaryAlert.severity)} />;
        case 'unusual_pattern': return <Lightbulb size={20} color={getSeverityColor(primaryAlert.severity)} />;
        case 'trend_change': return <TrendingUp size={20} color={getSeverityColor(primaryAlert.severity)} />;
        default: return <AlertTriangle size={20} color={getSeverityColor(primaryAlert.severity)} />;
      }
    };

    return (
      <View style={[styles.unusualSpendingCard, {
        borderColor: getSeverityColor(primaryAlert.severity),
        backgroundColor: getSeverityColor(primaryAlert.severity) + '10',
      }]}>
        <View style={styles.unusualSpendingHeader}>
          {getSeverityIcon(primaryAlert.type)}
          <Text style={[styles.unusualSpendingTitle, {
            color: getSeverityColor(primaryAlert.severity)
          }]}>
            {primaryAlert.title}
          </Text>
          <View style={[styles.severityBadge, {
            backgroundColor: getSeverityColor(primaryAlert.severity) + '20',
          }]}>
            <Text style={[styles.severityText, {
              color: getSeverityColor(primaryAlert.severity)
            }]}>
              {primaryAlert.severity.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.unusualSpendingDescription}>
          {primaryAlert.description}
        </Text>

        {/* Show confidence score */}
        <Text style={styles.confidenceText}>
          Confidence: {Math.round(primaryAlert.confidence * 100)}%
        </Text>

        {/* Action suggestions */}
        {primaryAlert.actionSuggestions && primaryAlert.actionSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Suggestions:</Text>
            {primaryAlert.actionSuggestions.slice(0, 2).map((suggestion: string, index: number) => (
              <Text key={index} style={styles.suggestionItem}>
                • {suggestion}
              </Text>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.viewDetailsButton}>
          <Text style={[styles.viewDetailsText, {
            color: getSeverityColor(primaryAlert.severity)
          }]}>
            View All Alerts ({unusualSpendingAlerts.length})
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderInsightCard = (insight: InsightCard, index: number) => {
    const getInsightIcon = () => {
      switch (insight.type) {
        case 'increase':
          return <TrendingUp size={20} color={colors.error} />;
        case 'decrease':
          return <TrendingDown size={20} color={colors.growth} />;
        case 'suggestion':
          return <Lightbulb size={20} color={colors.wisdom} />;
        case 'warning':
          return <AlertTriangle size={20} color={colors.warning} />;
        default:
          return <Text style={styles.insightEmoji}>{insight.icon}</Text>;
      }
    };

    return (
      <Animated.View
        key={insight.id}
        style={[
          styles.insightCard,
          {
            opacity: insightAnimations[insight.id],
            transform: [
              {
                translateY:
                  insightAnimations[insight.id]?.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }) || 0,
              },
            ],
          },
        ]}
      >
        <View style={styles.insightHeader}>
          {getInsightIcon()}
          <Text style={styles.insightTitle}>{insight.title}</Text>
        </View>
        <Text style={styles.insightDescription}>{insight.description}</Text>
      </Animated.View>
    );
  };

  const renderBreakdownView = () => {
    return (
      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* PRD: Animated donut chart centered top */}
        {renderDonutChart()}

        {/* PRD: Legend below chart with horizontal scroll */}
        {renderLegend()}

        {/* PRD: "Top Categories" section */}
        {renderTopCategories()}

        {/* PRD: "Unusual Spending" card if detected */}
        {renderUnusualSpending()}

        {/* PRD: Insight cards with slide-up animation */}
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>Insights</Text>
          {insights.map((insight, index) => renderInsightCard(insight, index))}
        </View>
      </ScrollView>
    );
  };

  const toggleCategoryVisibility = (categoryId: string) => {
    setTrendsData(prev =>
      prev.map(trend =>
        trend.categoryId === categoryId
          ? { ...trend, visible: !trend.visible }
          : trend
      )
    );
  };

  const renderTrendsChart = () => {
    const chartWidth = width - 48;
    const chartHeight = 250;
    const padding = 40;
    const plotWidth = chartWidth - padding * 2;
    const plotHeight = chartHeight - padding * 2;

    const visibleTrends = trendsData.filter(trend => trend.visible);
    if (visibleTrends.length === 0) return null;

    // Calculate bounds across all visible categories
    const allValues = visibleTrends.flatMap(trend =>
      trend.monthlyData.map(d => d.amount)
    );
    const maxAmount = Math.max(...allValues);
    const minAmount = Math.min(...allValues);
    const range = maxAmount - minAmount;
    const adjustedMax = maxAmount + range * 0.1;
    const adjustedMin = Math.max(0, minAmount - range * 0.1);

    // Generate paths for each category
    const generateCategoryPath = (trendData: CategoryTrendData) => {
      let path = '';
      trendData.monthlyData.forEach((point, index) => {
        const x = padding + (index / (trendData.monthlyData.length - 1)) * plotWidth;
        const y =
          padding +
          plotHeight -
          ((point.amount - adjustedMin) / (adjustedMax - adjustedMin)) * plotHeight;

        if (index === 0) {
          path += `M ${x} ${y}`;
        } else {
          path += ` L ${x} ${y}`;
        }
      });
      return path;
    };

    // Generate grid lines
    const generateGridLines = () => {
      const gridLines = [];
      const gridCount = 4;

      for (let i = 0; i <= gridCount; i++) {
        const y = padding + (i / gridCount) * plotHeight;
        const value = adjustedMax - (i / gridCount) * (adjustedMax - adjustedMin);

        gridLines.push(
          <G key={`h-grid-${i}`}>
            <Line
              x1={padding}
              y1={y}
              x2={padding + plotWidth}
              y2={y}
              stroke={colors.neutral.light}
              strokeWidth={1}
              strokeDasharray="2,2"
            />
            <SvgText
              x={padding - 8}
              y={y + 4}
              fontSize="10"
              fill={colors.textSecondary}
              textAnchor="end"
            >
              {formatCurrency(value, { showSymbol: false, showCents: false })}
            </SvgText>
          </G>
        );
      }
      return gridLines;
    };

    return (
      <View style={styles.trendsChartContainer}>
        <Text style={styles.sectionTitle}>6-Month Spending Trends</Text>
        
        <Svg width={chartWidth} height={chartHeight}>
          {/* Grid lines */}
          {generateGridLines()}

          {/* Category trend lines */}
          {visibleTrends.map((trend, index) => {
            const category = categoryData.find(c => c.id === trend.categoryId);
            if (!category) return null;

            return (
              <G key={trend.categoryId}>
                {/* PRD: Smooth bezier curves */}
                <Path
                  d={generateCategoryPath(trend)}
                  stroke={category.color}
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points for touch interaction */}
                {trend.monthlyData.map((point, pointIndex) => {
                  const x = padding + (pointIndex / (trend.monthlyData.length - 1)) * plotWidth;
                  const y =
                    padding +
                    plotHeight -
                    ((point.amount - adjustedMin) / (adjustedMax - adjustedMin)) * plotHeight;
                  
                  const isSelected = selectedPoint?.categoryId === trend.categoryId && 
                                   selectedPoint?.monthIndex === pointIndex;

                  return (
                    <Circle
                      key={`${trend.categoryId}-${pointIndex}`}
                      cx={x}
                      cy={y}
                      r={isSelected ? 6 : 4}
                      fill={category.color}
                      opacity={isSelected ? 1 : 0.8}
                      onPress={() =>
                        setSelectedPoint(
                          isSelected 
                            ? null 
                            : { categoryId: trend.categoryId, monthIndex: pointIndex }
                        )
                      }
                    />
                  );
                })}
              </G>
            );
          })}

          {/* X-axis labels */}
          {trendsData[0]?.monthlyData.map((point, index) => {
            const x = padding + (index / (trendsData[0].monthlyData.length - 1)) * plotWidth;
            const y = chartHeight - padding + 20;

            return (
              <SvgText
                key={`label-${index}`}
                x={x}
                y={y}
                fontSize="10"
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {point.month}
              </SvgText>
            );
          })}
        </Svg>

        {/* PRD: Touch to see exact values */}
        {selectedPoint && (
          <View style={styles.selectedPointInfo}>
            <Text style={styles.selectedPointMonth}>
              {trendsData.find(t => t.categoryId === selectedPoint.categoryId)
                ?.monthlyData[selectedPoint.monthIndex]?.date}
            </Text>
            <Text style={styles.selectedPointValue}>
              {formatCurrency(
                trendsData.find(t => t.categoryId === selectedPoint.categoryId)
                  ?.monthlyData[selectedPoint.monthIndex]?.amount || 0
              )}
            </Text>
            <Text style={styles.selectedPointCategory}>
              {categoryData.find(c => c.id === selectedPoint.categoryId)?.name}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCategoryToggles = () => {
    return (
      <View style={styles.categoryTogglesContainer}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <Text style={styles.togglesSubtitle}>Tap to show/hide on chart</Text>
        
        <View style={styles.togglesList}>
          {trendsData.map(trend => {
            const category = categoryData.find(c => c.id === trend.categoryId);
            if (!category) return null;

            return (
              <TouchableOpacity
                key={trend.categoryId}
                style={[
                  styles.categoryToggle,
                  !trend.visible && styles.categoryToggleDisabled,
                ]}
                onPress={() => toggleCategoryVisibility(trend.categoryId)}
              >
                <View style={styles.categoryToggleContent}>
                  <View
                    style={[
                      styles.categoryToggleDot,
                      { backgroundColor: category.color },
                      !trend.visible && styles.categoryToggleDotDisabled,
                    ]}
                  />
                  <Text
                    style={[
                      styles.categoryToggleName,
                      !trend.visible && styles.categoryToggleTextDisabled,
                    ]}
                  >
                    {category.name}
                  </Text>
                </View>
                
                {trend.visible ? (
                  <Eye size={16} color={colors.primary} />
                ) : (
                  <EyeOff size={16} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTrendInsights = () => {
    const trendInsights = [
      {
        id: 'trend-1',
        type: 'increase' as const,
        icon: '📈',
        title: 'Transport spending up 23%',
        description: 'Your transport costs have been rising steadily over the past 3 months.',
      },
      {
        id: 'trend-2', 
        type: 'decrease' as const,
        icon: '📉',
        title: 'Entertainment down 15%',
        description: 'Great progress! Entertainment spending has decreased consistently.',
      },
      {
        id: 'trend-3',
        type: 'suggestion' as const,
        icon: '💡',
        title: 'Consider setting a dining budget',
        description: 'Dining shows high variability. A budget could help stabilize spending.',
      },
    ];

    return (
      <View style={styles.trendInsightsContainer}>
        <Text style={styles.sectionTitle}>Trend Analysis</Text>
        {trendInsights.map((insight) => (
          <View key={insight.id} style={styles.trendInsightCard}>
            <View style={styles.insightHeader}>
              {insight.type === 'increase' && <TrendingUp size={20} color={colors.error} />}
              {insight.type === 'decrease' && <TrendingDown size={20} color={colors.growth} />}
              {insight.type === 'suggestion' && <Lightbulb size={20} color={colors.wisdom} />}
              <Text style={styles.insightTitle}>{insight.title}</Text>
            </View>
            <Text style={styles.insightDescription}>{insight.description}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTrendsView = () => {
    return (
      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* PRD: Line graph showing category spending over 6 months */}
        {renderTrendsChart()}

        {/* PRD: Category toggles below to show/hide lines */}
        {renderCategoryToggles()}

        {/* PRD: Insight cards with trend analysis */}
        {renderTrendInsights()}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Category Insights</Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* PRD: Tab toggle: "This Month" / "Over Time" */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'breakdown' && styles.activeTab]}
          onPress={() => setSelectedTab('breakdown')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'breakdown' && styles.activeTabText,
            ]}
          >
            This Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'trends' && styles.activeTab]}
          onPress={() => setSelectedTab('trends')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'trends' && styles.activeTabText,
            ]}
          >
            Over Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {selectedTab === 'breakdown' ? renderBreakdownView() : renderTrendsView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.light,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    ...textStyles.h2,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40, // Match close button width
  },
  // PRD: Tab toggle
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.lightest,
    borderRadius: 12,
    margin: 24,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.surface,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  // PRD: Donut chart
  donutContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  donutChart: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutBackground: {
    position: 'absolute',
    borderColor: colors.neutral.lightest,
  },
  donutSegment: {
    position: 'absolute',
    borderColor: 'transparent',
  },
  donutCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterTitle: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  donutCenterAmount: {
    ...textStyles.h2,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  // PRD: Legend with horizontal scroll
  legendContainer: {
    maxHeight: 80,
    marginBottom: 32,
  },
  legendContent: {
    paddingHorizontal: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.neutral.light,
    minWidth: 120,
  },
  selectedLegendItem: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
  },
  legendName: {
    ...textStyles.bodySmall,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  legendAmount: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  // PRD: Top Categories section
  topCategoriesContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  topCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightest,
  },
  topCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topCategoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  topCategoryDetails: {
    flex: 1,
  },
  topCategoryName: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  topCategoryTransactions: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  // PRD: Horizontal bar chart with animated fill
  topCategoryBar: {
    width: 60,
    height: 6,
    backgroundColor: colors.neutral.lightest,
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  topCategoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  topCategoryAmount: {
    ...textStyles.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  // PRD: AI-powered Unusual Spending card
  unusualSpendingCard: {
    backgroundColor: `${colors.warning}10`,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  unusualSpendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  unusualSpendingTitle: {
    ...textStyles.bodyRegular,
    color: colors.warning,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  severityText: {
    ...textStyles.caption,
    fontWeight: '700',
    fontSize: 10,
  },
  unusualSpendingDescription: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    marginBottom: 12,
    lineHeight: 20,
  },
  confidenceText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  suggestionsTitle: {
    ...textStyles.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestionItem: {
    ...textStyles.caption,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 4,
  },
  viewDetailsButton: {
    alignSelf: 'flex-start',
  },
  viewDetailsText: {
    ...textStyles.bodyRegular,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Insights section
  insightsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  insightCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral.light,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  insightTitle: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    fontWeight: '600',
    marginLeft: 8,
  },
  insightDescription: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // PRD: Category Trends View State
  trendsChartContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  selectedPointInfo: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  selectedPointMonth: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  selectedPointValue: {
    ...textStyles.h2,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  selectedPointCategory: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  categoryTogglesContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  togglesSubtitle: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: 16,
    marginTop: 4,
  },
  togglesList: {
    gap: 8,
  },
  categoryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutral.light,
  },
  categoryToggleDisabled: {
    opacity: 0.5,
    borderColor: colors.neutral.lightest,
  },
  categoryToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryToggleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryToggleDotDisabled: {
    backgroundColor: colors.neutral.light + ' !important',
  },
  categoryToggleName: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  categoryToggleTextDisabled: {
    color: colors.textSecondary,
  },
  trendInsightsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  trendInsightCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral.light,
  },
  // Trends placeholder (fallback)
  trendsPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  trendsPlaceholderText: {
    ...textStyles.h3,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  trendsSubtext: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default CategoryInsightsModal;
