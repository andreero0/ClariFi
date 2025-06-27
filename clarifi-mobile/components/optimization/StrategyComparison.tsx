import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Mountain,
  Snowflake,
  BarChart3,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  Star,
  Award,
  CheckCircle,
  Zap,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const { width } = Dimensions.get('window');

interface Strategy {
  id: 'avalanche' | 'snowball' | 'score';
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  recommended: boolean;
  pros: string[];
  cons: string[];
  bestFor: string;
  timeline: string;
  interestSavings: number;
  creditImpact: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  monthsToFreedom: number;
}

interface ComparisonMetric {
  label: string;
  avalanche: string | number;
  snowball: string | number;
  score: string | number;
  unit?: string;
}

const StrategyComparison: React.FC = () => {
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>('score');
  const [selectedView, setSelectedView] = useState<'cards' | 'comparison'>('cards');
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const strategies: Strategy[] = [
    {
      id: 'avalanche',
      name: 'Debt Avalanche',
      description: 'Pay highest interest rates first to minimize total interest paid',
      icon: <Mountain size={32} color={colors.pureWhite} />,
      color: colors.clarityBlue,
      recommended: false,
      pros: [
        'Saves the most money in interest',
        'Mathematically optimal approach',
        'Faster debt elimination',
        'Best long-term financial outcome'
      ],
      cons: [
        'Can feel slow at first',
        'Requires discipline',
        'Less immediate gratification',
        'Higher complexity'
      ],
      bestFor: 'People focused on mathematical optimization and long-term savings',
      timeline: '18-24 months',
      interestSavings: 3250,
      creditImpact: 35,
      difficulty: 'Medium',
      monthsToFreedom: 22,
    },
    {
      id: 'snowball',
      name: 'Debt Snowball',
      description: 'Pay smallest balances first for psychological momentum',
      icon: <Snowflake size={32} color={colors.pureWhite} />,
      color: colors.wisdomPurple,
      recommended: false,
      pros: [
        'Quick early wins boost motivation',
        'Simple to understand',
        'Builds momentum',
        'Great for beginners'
      ],
      cons: [
        'Pays more interest overall',
        'Not mathematically optimal',
        'Slower financial progress',
        'Ignores interest rates'
      ],
      bestFor: 'People who need motivation and prefer psychological wins',
      timeline: '20-26 months',
      interestSavings: 2800,
      creditImpact: 30,
      difficulty: 'Easy',
      monthsToFreedom: 24,
    },
    {
      id: 'score',
      name: 'Credit Score Optimization',
      description: 'Optimize credit utilization for maximum score improvement',
      icon: <BarChart3 size={32} color={colors.pureWhite} />,
      color: colors.growthGreen,
      recommended: true,
      pros: [
        'Fastest credit score improvement',
        'Reduces utilization quickly',
        'Improves borrowing terms',
        'Balanced approach'
      ],
      cons: [
        'May not minimize total interest',
        'Requires ongoing monitoring',
        'More complex calculations',
        'Balances multiple factors'
      ],
      bestFor: 'People planning major purchases or wanting better credit terms',
      timeline: '16-20 months',
      interestSavings: 2940,
      creditImpact: 45,
      difficulty: 'Medium',
      monthsToFreedom: 20,
    },
  ];

  const comparisonMetrics: ComparisonMetric[] = [
    {
      label: 'Total Interest Savings',
      avalanche: 3250,
      snowball: 2800,
      score: 2940,
      unit: '$',
    },
    {
      label: 'Credit Score Impact',
      avalanche: 35,
      snowball: 30,
      score: 45,
      unit: 'pts',
    },
    {
      label: 'Months to Debt Freedom',
      avalanche: 22,
      snowball: 24,
      score: 20,
    },
    {
      label: 'Difficulty Level',
      avalanche: 'Medium',
      snowball: 'Easy',
      score: 'Medium',
    },
    {
      label: 'Best For',
      avalanche: 'Math-focused',
      snowball: 'Motivation',
      score: 'Credit goals',
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return colors.growthGreen;
      case 'Medium': return colors.warning;
      case 'Hard': return colors.errorRed;
      default: return colors.neutralGray;
    }
  };

  const renderViewToggle = () => (
    <Animated.View style={[styles.viewToggle, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          selectedView === 'cards' && styles.activeToggleButton,
        ]}
        onPress={() => setSelectedView('cards')}
      >
        <Text style={[
          styles.toggleText,
          selectedView === 'cards' && styles.activeToggleText,
        ]}>
          Strategy Cards
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.toggleButton,
          selectedView === 'comparison' && styles.activeToggleButton,
        ]}
        onPress={() => setSelectedView('comparison')}
      >
        <Text style={[
          styles.toggleText,
          selectedView === 'comparison' && styles.activeToggleText,
        ]}>
          Side-by-Side
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStrategyCard = (strategy: Strategy) => {
    const isExpanded = expandedStrategy === strategy.id;
    
    return (
      <Animated.View 
        key={strategy.id}
        style={[
          styles.strategyCard,
          isExpanded && styles.expandedCard,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <TouchableOpacity
          onPress={() => setExpandedStrategy(isExpanded ? null : strategy.id)}
          activeOpacity={0.8}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={[strategy.color, strategy.color + '80']}
              style={styles.cardHeaderGradient}
            >
              {strategy.recommended && (
                <View style={styles.recommendedBadge}>
                  <Star size={12} color={colors.pureWhite} />
                  <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </View>
              )}
              
              <View style={styles.strategyIconContainer}>
                {strategy.icon}
              </View>
              
              <Text style={styles.strategyName}>{strategy.name}</Text>
              <Text style={styles.strategyDescription}>{strategy.description}</Text>
              
              <View style={styles.cardHeaderMetrics}>
                <View style={styles.headerMetric}>
                  <DollarSign size={16} color={colors.pureWhite} />
                  <Text style={styles.headerMetricText}>
                    {formatCurrency(strategy.interestSavings)} saved
                  </Text>
                </View>
                
                <View style={styles.headerMetric}>
                  <TrendingUp size={16} color={colors.pureWhite} />
                  <Text style={styles.headerMetricText}>
                    +{strategy.creditImpact} credit score
                  </Text>
                </View>
              </View>
              
              <View style={styles.expandIcon}>
                {isExpanded ? (
                  <ChevronUp size={24} color={colors.pureWhite} />
                ) : (
                  <ChevronDown size={24} color={colors.pureWhite} />
                )}
              </View>
            </LinearGradient>
          </View>
          
          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {/* Quick Stats */}
              <View style={styles.quickStats}>
                <View style={styles.statItem}>
                  <Clock size={20} color={colors.clarityBlue} />
                  <Text style={styles.statLabel}>Timeline</Text>
                  <Text style={styles.statValue}>{strategy.timeline}</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Target size={20} color={getDifficultyColor(strategy.difficulty)} />
                  <Text style={styles.statLabel}>Difficulty</Text>
                  <Text style={[styles.statValue, { color: getDifficultyColor(strategy.difficulty) }]}>
                    {strategy.difficulty}
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Award size={20} color={colors.growthGreen} />
                  <Text style={styles.statLabel}>Debt Freedom</Text>
                  <Text style={styles.statValue}>{strategy.monthsToFreedom} months</Text>
                </View>
              </View>
              
              {/* Best For */}
              <View style={styles.bestForSection}>
                <Text style={styles.sectionTitle}>Best For</Text>
                <Text style={styles.bestForText}>{strategy.bestFor}</Text>
              </View>
              
              {/* Pros */}
              <View style={styles.prosSection}>
                <Text style={styles.sectionTitle}>Pros</Text>
                {strategy.pros.map((pro, index) => (
                  <View key={index} style={styles.proItem}>
                    <CheckCircle size={16} color={colors.growthGreen} />
                    <Text style={styles.proText}>{pro}</Text>
                  </View>
                ))}
              </View>
              
              {/* Cons */}
              <View style={styles.consSection}>
                <Text style={styles.sectionTitle}>Cons</Text>
                {strategy.cons.map((con, index) => (
                  <View key={index} style={styles.conItem}>
                    <View style={styles.conDot} />
                    <Text style={styles.conText}>{con}</Text>
                  </View>
                ))}
              </View>
              
              {/* Select Button */}
              <TouchableOpacity style={styles.selectButton}>
                <LinearGradient
                  colors={[strategy.color, strategy.color + '80']}
                  style={styles.selectButtonGradient}
                >
                  <Zap size={20} color={colors.pureWhite} />
                  <Text style={styles.selectButtonText}>Choose This Strategy</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderComparisonTable = () => (
    <Animated.View style={[styles.comparisonTable, { opacity: fadeAnim }]}>
      <View style={styles.tableHeader}>
        <View style={styles.metricColumn}>
          <Text style={styles.tableHeaderText}>Metric</Text>
        </View>
        
        {strategies.map(strategy => (
          <View key={strategy.id} style={styles.strategyColumn}>
            <LinearGradient
              colors={[strategy.color, strategy.color + '80']}
              style={styles.strategyHeaderGradient}
            >
              <View style={styles.strategyHeaderIcon}>
                {React.cloneElement(strategy.icon, { size: 20 })}
              </View>
              <Text style={styles.strategyHeaderText}>{strategy.name}</Text>
              {strategy.recommended && (
                <View style={styles.tableRecommendedBadge}>
                  <Star size={8} color={colors.pureWhite} />
                </View>
              )}
            </LinearGradient>
          </View>
        ))}
      </View>
      
      {comparisonMetrics.map((metric, index) => (
        <View key={index} style={styles.tableRow}>
          <View style={styles.metricColumn}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
          
          <View style={styles.strategyColumn}>
            <Text style={styles.metricValue}>
              {metric.unit === '$' ? formatCurrency(metric.avalanche as number) : metric.avalanche}
              {metric.unit && metric.unit !== '$' ? ` ${metric.unit}` : ''}
            </Text>
          </View>
          
          <View style={styles.strategyColumn}>
            <Text style={styles.metricValue}>
              {metric.unit === '$' ? formatCurrency(metric.snowball as number) : metric.snowball}
              {metric.unit && metric.unit !== '$' ? ` ${metric.unit}` : ''}
            </Text>
          </View>
          
          <View style={styles.strategyColumn}>
            <Text style={[
              styles.metricValue,
              { color: colors.growthGreen, fontWeight: '600' } // Highlight recommended strategy
            ]}>
              {metric.unit === '$' ? formatCurrency(metric.score as number) : metric.score}
              {metric.unit && metric.unit !== '$' ? ` ${metric.unit}` : ''}
            </Text>
          </View>
        </View>
      ))}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>Strategy Comparison</Text>
          <Text style={styles.subtitle}>
            Compare debt repayment strategies to find the best approach for your goals
          </Text>
        </Animated.View>

        {/* View Toggle */}
        {renderViewToggle()}

        {/* Content */}
        {selectedView === 'cards' ? (
          <View style={styles.strategyCards}>
            {strategies.map(renderStrategyCard)}
          </View>
        ) : (
          renderComparisonTable()
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...textStyles.h1,
    color: colors.midnightInk,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.neutralGray,
    textAlign: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.cloudGray,
    borderRadius: 12,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeToggleButton: {
    backgroundColor: colors.pureWhite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleText: {
    ...textStyles.body,
    color: colors.neutralGray,
  },
  activeToggleText: {
    color: colors.clarityBlue,
    fontWeight: '600',
  },
  strategyCards: {
    paddingHorizontal: spacing.lg,
  },
  strategyCard: {
    backgroundColor: colors.pureWhite,
    borderRadius: 20,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  expandedCard: {
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  cardHeader: {
    position: 'relative',
  },
  cardHeaderGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  recommendedBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pureWhite + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  recommendedText: {
    fontSize: 10,
    color: colors.pureWhite,
    fontWeight: '700',
  },
  strategyIconContainer: {
    marginBottom: spacing.md,
  },
  strategyName: {
    ...textStyles.h2,
    color: colors.pureWhite,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  strategyDescription: {
    ...textStyles.body,
    color: colors.pureWhite,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: spacing.lg,
  },
  cardHeaderMetrics: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  headerMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerMetricText: {
    ...textStyles.caption,
    color: colors.pureWhite,
    fontWeight: '600',
  },
  expandIcon: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
  },
  expandedContent: {
    padding: spacing.lg,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
  },
  bestForSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginBottom: spacing.sm,
  },
  bestForText: {
    ...textStyles.body,
    color: colors.neutralGray,
    fontStyle: 'italic',
  },
  prosSection: {
    marginBottom: spacing.lg,
  },
  proItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  proText: {
    ...textStyles.body,
    color: colors.midnightInk,
    flex: 1,
  },
  consSection: {
    marginBottom: spacing.xl,
  },
  conItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  conDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neutralGray,
  },
  conText: {
    ...textStyles.body,
    color: colors.neutralGray,
    flex: 1,
  },
  selectButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  selectButtonText: {
    ...textStyles.button,
    color: colors.pureWhite,
    fontWeight: '600',
  },
  comparisonTable: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  tableHeader: {
    flexDirection: 'row',
  },
  metricColumn: {
    flex: 1.2,
    padding: spacing.md,
    justifyContent: 'center',
  },
  strategyColumn: {
    flex: 1,
    alignItems: 'center',
  },
  tableHeaderText: {
    ...textStyles.h3,
    color: colors.midnightInk,
  },
  strategyHeaderGradient: {
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  strategyHeaderIcon: {
    marginBottom: spacing.xs,
  },
  strategyHeaderText: {
    ...textStyles.caption,
    color: colors.pureWhite,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRecommendedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    backgroundColor: colors.pureWhite + '30',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  metricLabel: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '500',
  },
  metricValue: {
    ...textStyles.body,
    color: colors.neutralGray,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

export default StrategyComparison;