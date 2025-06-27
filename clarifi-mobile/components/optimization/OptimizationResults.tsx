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
  CheckCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  Target,
  Clock,
  Star,
  Sparkles,
  ArrowRight,
  CreditCard,
  PiggyBank,
  Award,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const { width } = Dimensions.get('window');

interface ActionStep {
  id: string;
  title: string;
  description: string;
  amount?: number;
  cardName?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface SuccessMetric {
  id: string;
  icon: React.ReactNode;
  value: string;
  label: string;
  change: string;
  positive: boolean;
  color: string;
}

const OptimizationResults: React.FC = () => {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

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
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }),
    ]).start();

    // Sparkle animation
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
    sparkleAnimation.start();

    return () => sparkleAnimation.stop();
  }, []);

  const successMetrics: SuccessMetric[] = [
    {
      id: '1',
      icon: <TrendingUp size={24} color={colors.pureWhite} />,
      value: '+45',
      label: 'Credit Score Points',
      change: '+18% improvement',
      positive: true,
      color: colors.clarityBlue,
    },
    {
      id: '2',
      icon: <DollarSign size={24} color={colors.pureWhite} />,
      value: '$2,940',
      label: 'Annual Interest Savings',
      change: '+$245/month',
      positive: true,
      color: colors.growthGreen,
    },
    {
      id: '3',
      icon: <Clock size={24} color={colors.pureWhite} />,
      value: '14',
      label: 'Months Earlier',
      change: 'Debt-free timeline',
      positive: true,
      color: colors.wisdomPurple,
    },
    {
      id: '4',
      icon: <Target size={24} color={colors.pureWhite} />,
      value: '12%',
      label: 'Avg Utilization',
      change: 'Down from 40%',
      positive: true,
      color: colors.success,
    },
  ];

  const actionSteps: ActionStep[] = [
    {
      id: '1',
      title: 'Pay Down TD Cashback Visa',
      description: 'Make $400 payment to reduce utilization from 48% to 32%',
      amount: 400,
      cardName: 'TD Cashback Visa',
      completed: false,
      priority: 'high',
    },
    {
      id: '2',
      title: 'Pay Down RBC Rewards Mastercard',
      description: 'Make $300 payment to reduce utilization from 40% to 30%',
      amount: 300,
      cardName: 'RBC Rewards Mastercard',
      completed: false,
      priority: 'high',
    },
    {
      id: '3',
      title: 'Maintain Scotiabank Gold Amex',
      description: 'Keep utilization at 32% with minimum payments',
      amount: 30,
      cardName: 'Scotiabank Gold Amex',
      completed: false,
      priority: 'medium',
    },
    {
      id: '4',
      title: 'Set Up Automatic Payments',
      description: 'Enable autopay for all cards to maintain optimal utilization',
      completed: false,
      priority: 'medium',
    },
    {
      id: '5',
      title: 'Monitor Credit Score',
      description: 'Check credit score monthly to track improvement progress',
      completed: false,
      priority: 'low',
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

  const toggleStepCompletion = (stepId: string) => {
    setCompletedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const getCompletionProgress = () => {
    return (completedSteps.length / actionSteps.length) * 100;
  };

  const renderSuccessHeader = () => {
    const sparkleRotation = sparkleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View style={[styles.successHeader, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient
          colors={[colors.growthGreen, colors.success]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.successHeaderGradient}
        >
          <Animated.View
            style={[
              styles.successIcon,
              { transform: [{ rotate: sparkleRotation }] }
            ]}
          >
            <Sparkles size={32} color={colors.pureWhite} />
          </Animated.View>
          <Text style={styles.successTitle}>Optimization Complete!</Text>
          <Text style={styles.successSubtitle}>
            Your personalized credit optimization plan is ready
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderSuccessMetrics = () => (
    <Animated.View style={[styles.metricsContainer, { opacity: fadeAnim }]}>
      <Text style={styles.sectionTitle}>Success Metrics</Text>
      
      <View style={styles.metricsGrid}>
        {successMetrics.map((metric, index) => (
          <Animated.View
            key={metric.id}
            style={[
              styles.metricCard,
              {
                transform: [{
                  translateX: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  })
                }],
                opacity: progressAnim,
              }
            ]}
          >
            <LinearGradient
              colors={[metric.color, metric.color + '80']}
              style={styles.metricIconContainer}
            >
              {metric.icon}
            </LinearGradient>
            
            <View style={styles.metricContent}>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={[
                styles.metricChange,
                { color: metric.positive ? colors.growthGreen : colors.errorRed }
              ]}>
                {metric.change}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  const renderProgressOverview = () => {
    const progress = getCompletionProgress();
    
    return (
      <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
        <View style={styles.progressHeader}>
          <Text style={styles.sectionTitle}>Action Plan Progress</Text>
          <Text style={styles.progressText}>
            {completedSteps.length} of {actionSteps.length} completed
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <Animated.View 
            style={[
              styles.progressBar,
              { 
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', `${progress}%`],
                })
              }
            ]} 
          />
        </View>
        
        <Text style={styles.progressPercentage}>{Math.round(progress)}% Complete</Text>
      </Animated.View>
    );
  };

  const renderActionPlan = () => (
    <Animated.View style={[styles.actionPlanContainer, { opacity: fadeAnim }]}>
      <Text style={styles.sectionTitle}>Step-by-Step Action Plan</Text>
      <Text style={styles.sectionDescription}>
        Follow these steps to achieve your optimization goals
      </Text>
      
      {actionSteps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const priorityColor = step.priority === 'high' ? colors.errorRed : 
                            step.priority === 'medium' ? colors.warning : colors.neutralGray;
        
        return (
          <TouchableOpacity
            key={step.id}
            style={[
              styles.actionStep,
              isCompleted && styles.completedStep,
            ]}
            onPress={() => toggleStepCompletion(step.id)}
            activeOpacity={0.7}
          >
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                {isCompleted ? (
                  <CheckCircle size={24} color={colors.growthGreen} />
                ) : (
                  <View style={[styles.stepNumberCircle, { borderColor: priorityColor }]}>
                    <Text style={[styles.stepNumberText, { color: priorityColor }]}>
                      {index + 1}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.stepContent}>
                <Text style={[
                  styles.stepTitle,
                  isCompleted && styles.completedStepTitle,
                ]}>
                  {step.title}
                </Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
                
                {step.amount && (
                  <View style={styles.stepAmount}>
                    <DollarSign size={16} color={colors.clarityBlue} />
                    <Text style={styles.stepAmountText}>{formatCurrency(step.amount)}</Text>
                  </View>
                )}
                
                <View style={styles.stepMeta}>
                  <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                    <Text style={[styles.priorityText, { color: priorityColor }]}>
                      {step.priority.toUpperCase()} PRIORITY
                    </Text>
                  </View>
                  
                  {step.cardName && (
                    <View style={styles.cardBadge}>
                      <CreditCard size={14} color={colors.neutralGray} />
                      <Text style={styles.cardBadgeText}>{step.cardName}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );

  const renderNextSteps = () => (
    <Animated.View style={[styles.nextStepsContainer, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={[colors.clarityBlue + '10', colors.skyTrust + '10']}
        style={styles.nextStepsGradient}
      >
        <View style={styles.nextStepsHeader}>
          <Award size={24} color={colors.clarityBlue} />
          <Text style={styles.nextStepsTitle}>What's Next?</Text>
        </View>
        
        <View style={styles.nextStepsList}>
          <View style={styles.nextStepItem}>
            <ArrowRight size={16} color={colors.clarityBlue} />
            <Text style={styles.nextStepText}>
              Implement your action plan over the next 30 days
            </Text>
          </View>
          
          <View style={styles.nextStepItem}>
            <ArrowRight size={16} color={colors.clarityBlue} />
            <Text style={styles.nextStepText}>
              Monitor your credit utilization weekly
            </Text>
          </View>
          
          <View style={styles.nextStepItem}>
            <ArrowRight size={16} color={colors.clarityBlue} />
            <Text style={styles.nextStepText}>
              Check your credit score improvement in 60 days
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.scheduleButton}>
          <Calendar size={20} color={colors.clarityBlue} />
          <Text style={styles.scheduleButtonText}>Schedule Reminders</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        {renderSuccessHeader()}

        {/* Success Metrics */}
        {renderSuccessMetrics()}

        {/* Progress Overview */}
        {renderProgressOverview()}

        {/* Action Plan */}
        {renderActionPlan()}

        {/* Next Steps */}
        {renderNextSteps()}

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
  successHeader: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: 20,
    overflow: 'hidden',
  },
  successHeaderGradient: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  successIcon: {
    marginBottom: spacing.md,
  },
  successTitle: {
    ...textStyles.h1,
    color: colors.pureWhite,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    ...textStyles.body,
    color: colors.pureWhite,
    textAlign: 'center',
    opacity: 0.9,
  },
  metricsContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.h2,
    color: colors.midnightInk,
    marginBottom: spacing.md,
  },
  sectionDescription: {
    ...textStyles.body,
    color: colors.neutralGray,
    marginBottom: spacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.pureWhite,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  metricContent: {
    alignItems: 'flex-start',
  },
  metricValue: {
    ...textStyles.h2,
    color: colors.midnightInk,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  metricLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
    marginBottom: spacing.xs,
  },
  metricChange: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  progressContainer: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressText: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.cloudGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.growthGreen,
    borderRadius: 4,
  },
  progressPercentage: {
    ...textStyles.caption,
    color: colors.growthGreen,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionPlanContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  actionStep: {
    backgroundColor: colors.pureWhite,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  completedStep: {
    backgroundColor: colors.growthGreen + '10',
    borderWidth: 1,
    borderColor: colors.growthGreen + '30',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  stepNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  completedStepTitle: {
    textDecorationLine: 'line-through',
    color: colors.neutralGray,
  },
  stepDescription: {
    ...textStyles.caption,
    color: colors.neutralGray,
    marginBottom: spacing.sm,
  },
  stepAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  stepAmountText: {
    ...textStyles.body,
    color: colors.clarityBlue,
    fontWeight: '600',
  },
  stepMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardBadgeText: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  nextStepsContainer: {
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextStepsGradient: {
    padding: spacing.lg,
  },
  nextStepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  nextStepsTitle: {
    ...textStyles.h3,
    color: colors.clarityBlue,
  },
  nextStepsList: {
    marginBottom: spacing.lg,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  nextStepText: {
    ...textStyles.body,
    color: colors.midnightInk,
    flex: 1,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pureWhite,
    borderRadius: 12,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  scheduleButtonText: {
    ...textStyles.button,
    color: colors.clarityBlue,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

export default OptimizationResults;