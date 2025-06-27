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
  Sparkles,
  TrendingUp,
  DollarSign,
  CreditCard,
  Bot,
  GripVertical,
  Mountain,
  Snowflake,
  BarChart3,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const { width } = Dimensions.get('window');

interface CreditCard {
  id: string;
  name: string;
  balance: number;
  limit: number;
  interestRate: number;
  minimumPayment: number;
  utilization: number;
  priority: number;
}

interface OptimizationStrategy {
  id: 'avalanche' | 'snowball' | 'score';
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  recommended: boolean;
}

const OptimizationDashboard: React.FC = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<'avalanche' | 'snowball' | 'score'>('score');
  const [optimizationScore, setOptimizationScore] = useState(73);
  const [cards, setCards] = useState<CreditCard[]>([
    {
      id: '1',
      name: 'TD Cashback Visa',
      balance: 2400,
      limit: 5000,
      interestRate: 19.99,
      minimumPayment: 75,
      utilization: 48,
      priority: 1,
    },
    {
      id: '2',
      name: 'RBC Rewards Mastercard',
      balance: 1200,
      limit: 3000,
      interestRate: 22.99,
      minimumPayment: 40,
      utilization: 40,
      priority: 2,
    },
    {
      id: '3',
      name: 'Scotiabank Gold Amex',
      balance: 800,
      limit: 2500,
      interestRate: 20.99,
      minimumPayment: 30,
      utilization: 32,
      priority: 3,
    },
  ]);

  // Animation refs
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Sparkle animation
  useEffect(() => {
    const sparkleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    const scoreAnimation = Animated.timing(scoreAnim, {
      toValue: optimizationScore / 100,
      duration: 1500,
      useNativeDriver: false,
    });

    const fadeAnimation = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    });

    sparkleAnimation.start();
    scoreAnimation.start();
    fadeAnimation.start();

    return () => {
      sparkleAnimation.stop();
    };
  }, [optimizationScore]);

  const strategies: OptimizationStrategy[] = [
    {
      id: 'avalanche',
      name: 'Debt Avalanche',
      description: 'Pay highest interest rates first',
      icon: <Mountain size={24} color={colors.pureWhite} />,
      color: colors.clarityBlue,
      recommended: false,
    },
    {
      id: 'snowball',
      name: 'Debt Snowball',
      description: 'Pay smallest balances first',
      icon: <Snowflake size={24} color={colors.pureWhite} />,
      color: colors.wisdomPurple,
      recommended: false,
    },
    {
      id: 'score',
      name: 'Credit Score',
      description: 'Optimize credit utilization',
      icon: <BarChart3 size={24} color={colors.pureWhite} />,
      color: colors.growthGreen,
      recommended: true,
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

  const renderAIInsightBadge = () => {
    const sparkleRotation = sparkleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const sparkleScale = sparkleAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.2, 1],
    });

    return (
      <Animated.View style={[styles.aiInsightBadge, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={[colors.wisdomPurple, colors.clarityBlue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiInsightGradient}
        >
          <Animated.View
            style={[
              styles.sparkleIcon,
              {
                transform: [
                  { rotate: sparkleRotation },
                  { scale: sparkleScale },
                ],
              },
            ]}
          >
            <Sparkles size={16} color={colors.pureWhite} />
          </Animated.View>
          <Text style={styles.aiInsightText}>AI-Powered Insights</Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderOptimizationScore = () => {
    const animatedScore = scoreAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, optimizationScore],
    });

    const circumference = 2 * Math.PI * 60;
    const strokeDasharray = circumference;
    const animatedStrokeDashoffset = scoreAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [circumference, circumference - (optimizationScore / 100) * circumference],
    });

    return (
      <Animated.View style={[styles.scoreContainer, { opacity: fadeAnim }]}>
        <Text style={styles.scoreTitle}>Optimization Score</Text>
        <View style={styles.circularGauge}>
          {/* Background circle */}
          <View style={styles.gaugeBackground} />
          
          {/* Animated progress */}
          <Animated.View
            style={[
              styles.gaugeProgress,
              {
                borderColor: optimizationScore >= 80 ? colors.growthGreen : 
                            optimizationScore >= 60 ? colors.warning : colors.errorRed,
                borderTopColor: optimizationScore >= 25 ? 
                  (optimizationScore >= 80 ? colors.growthGreen : 
                   optimizationScore >= 60 ? colors.warning : colors.errorRed) : 'transparent',
                borderRightColor: optimizationScore >= 50 ? 
                  (optimizationScore >= 80 ? colors.growthGreen : 
                   optimizationScore >= 60 ? colors.warning : colors.errorRed) : 'transparent',
                borderBottomColor: optimizationScore >= 75 ? 
                  (optimizationScore >= 80 ? colors.growthGreen : 
                   optimizationScore >= 60 ? colors.warning : colors.errorRed) : 'transparent',
                transform: [{ rotate: '-90deg' }],
              },
            ]}
          />
          
          <View style={styles.scoreCenter}>
            <Animated.Text style={styles.scoreNumber}>
              {animatedScore.interpolate({
                inputRange: [0, optimizationScore],
                outputRange: [0, optimizationScore],
                extrapolate: 'clamp',
              }).toString().split('.')[0]}
            </Animated.Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
        </View>
        <Text style={styles.scoreDescription}>
          {optimizationScore >= 80 ? 'Excellent optimization' : 
           optimizationScore >= 60 ? 'Good optimization' : 'Needs improvement'}
        </Text>
      </Animated.View>
    );
  };

  const renderImprovementMetrics = () => (
    <Animated.View style={[styles.metricsContainer, { opacity: fadeAnim }]}>
      <View style={styles.metricCard}>
        <DollarSign size={24} color={colors.growthGreen} />
        <Text style={styles.metricValue}>$247</Text>
        <Text style={styles.metricLabel}>Monthly Savings</Text>
      </View>
      
      <View style={styles.metricCard}>
        <TrendingUp size={24} color={colors.clarityBlue} />
        <Text style={styles.metricValue}>+32</Text>
        <Text style={styles.metricLabel}>Credit Score Points</Text>
      </View>
    </Animated.View>
  );

  const renderCardPrioritization = () => (
    <Animated.View style={[styles.prioritizationContainer, { opacity: fadeAnim }]}>
      <Text style={styles.sectionTitle}>Card Prioritization</Text>
      <Text style={styles.sectionDescription}>
        Drag to reorder based on your strategy
      </Text>
      
      {cards.map((card, index) => (
        <View key={card.id} style={styles.cardPriorityItem}>
          <View style={styles.dragHandle}>
            <GripVertical size={20} color={colors.neutralGray} />
          </View>
          
          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{card.name}</Text>
              <Text style={styles.cardBalance}>{formatCurrency(card.balance)}</Text>
            </View>
            
            <View style={styles.cardMetrics}>
              <Text style={styles.cardMetric}>
                {card.utilization}% utilized
              </Text>
              <Text style={styles.cardMetric}>
                {card.interestRate}% APR
              </Text>
            </View>
            
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>Priority #{card.priority}</Text>
            </View>
          </View>
        </View>
      ))}
    </Animated.View>
  );

  const renderStrategySelector = () => (
    <Animated.View style={[styles.strategyContainer, { opacity: fadeAnim }]}>
      <Text style={styles.sectionTitle}>Optimization Strategy</Text>
      
      <View style={styles.strategyCards}>
        {strategies.map((strategy) => (
          <TouchableOpacity
            key={strategy.id}
            style={[
              styles.strategyCard,
              selectedStrategy === strategy.id && styles.selectedStrategyCard,
            ]}
            onPress={() => setSelectedStrategy(strategy.id)}
          >
            {strategy.recommended && (
              <View style={styles.recommendedBadge}>
                <Sparkles size={12} color={colors.pureWhite} />
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
            )}
            
            <LinearGradient
              colors={selectedStrategy === strategy.id ? [strategy.color, strategy.color + '80'] : ['#F7F9FC', '#F7F9FC']}
              style={styles.strategyIconContainer}
            >
              {React.cloneElement(strategy.icon, {
                color: selectedStrategy === strategy.id ? colors.pureWhite : colors.neutralGray,
              })}
            </LinearGradient>
            
            <Text style={[
              styles.strategyName,
              selectedStrategy === strategy.id && styles.selectedStrategyName,
            ]}>
              {strategy.name}
            </Text>
            
            <Text style={styles.strategyDescription}>
              {strategy.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderOptimizeButton = () => (
    <Animated.View style={[styles.optimizeButtonContainer, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.optimizeButton}>
        <LinearGradient
          colors={[colors.clarityBlue, colors.skyTrust]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.optimizeButtonGradient}
        >
          <Bot size={24} color={colors.pureWhite} />
          <Text style={styles.optimizeButtonText}>Optimize Now</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Optimization Dashboard</Text>
          {renderAIInsightBadge()}
        </View>

        {/* Optimization Score */}
        {renderOptimizationScore()}

        {/* Improvement Metrics */}
        {renderImprovementMetrics()}

        {/* Card Prioritization */}
        {renderCardPrioritization()}

        {/* Strategy Selector */}
        {renderStrategySelector()}

        {/* Optimize Button */}
        {renderOptimizeButton()}

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
    marginBottom: spacing.md,
  },
  aiInsightBadge: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  aiInsightGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  sparkleIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiInsightText: {
    ...textStyles.caption,
    color: colors.pureWhite,
    fontWeight: '600',
  },
  scoreContainer: {
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  scoreTitle: {
    ...textStyles.h2,
    color: colors.midnightInk,
    marginBottom: spacing.lg,
  },
  circularGauge: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  gaugeBackground: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: colors.cloudGray,
  },
  gaugeProgress: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: 'transparent',
  },
  scoreCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    ...textStyles.h1,
    fontSize: 36,
    color: colors.midnightInk,
    fontWeight: '700',
  },
  scoreMax: {
    ...textStyles.body,
    color: colors.neutralGray,
  },
  scoreDescription: {
    ...textStyles.body,
    color: colors.neutralGray,
    textAlign: 'center',
  },
  metricsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.pureWhite,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  metricValue: {
    ...textStyles.h2,
    color: colors.midnightInk,
    marginVertical: spacing.xs,
  },
  metricLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
    textAlign: 'center',
  },
  prioritizationContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.h2,
    color: colors.midnightInk,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    ...textStyles.body,
    color: colors.neutralGray,
    marginBottom: spacing.lg,
  },
  cardPriorityItem: {
    flexDirection: 'row',
    backgroundColor: colors.pureWhite,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  dragHandle: {
    paddingRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardName: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
  },
  cardBalance: {
    ...textStyles.body,
    color: colors.clarityBlue,
    fontWeight: '600',
  },
  cardMetrics: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  cardMetric: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cloudGray,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    ...textStyles.caption,
    color: colors.neutralGray,
    fontWeight: '600',
  },
  strategyContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  strategyCards: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  strategyCard: {
    flex: 1,
    backgroundColor: colors.pureWhite,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  selectedStrategyCard: {
    borderWidth: 2,
    borderColor: colors.clarityBlue,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.growthGreen,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 2,
  },
  recommendedText: {
    fontSize: 10,
    color: colors.pureWhite,
    fontWeight: '600',
  },
  strategyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  strategyName: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  selectedStrategyName: {
    color: colors.clarityBlue,
  },
  strategyDescription: {
    ...textStyles.caption,
    color: colors.neutralGray,
    textAlign: 'center',
  },
  optimizeButtonContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  optimizeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.clarityBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  optimizeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  optimizeButtonText: {
    ...textStyles.button,
    color: colors.pureWhite,
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

export default OptimizationDashboard;