import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Lightbulb,
  Target,
  TrendingUp,
  Shield,
  CreditCard,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Zap,
  Leaf,
} from 'lucide-react-native';
import { useCreditCards } from '../../hooks/useCreditCards';
import { formatCreditLimit } from '../../types/creditCard';
import { useContextualTooltips } from '../../hooks/useContextualTooltips';
import { TooltipSystem } from '../../components/help/TooltipSystem';
import { SkeletonInsights } from '../../components/ui/SkeletonLoader';
import * as SPACING from '../../constants/spacing';

export default function InsightsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    cards,
    loading,
    error,
    refreshCards,
    totalCreditLimit,
    totalUtilization,
    averageUtilization,
    summaryData,
  } = useCreditCards();

  // Tooltip integration
  const {
    registerTooltipElement,
    createTooltipProps,
    activeTooltip,
    handleTooltipDismiss,
    handleLearnMore,
    checkOnboardingTooltips,
  } = useContextualTooltips('insights');

  // Refs for tooltip-enabled elements
  const creditHealthCardRef = useRef(null);
  const paymentOptimizerRef = useRef(null);
  const utilizationStatsRef = useRef(null);
  const educationCardRef = useRef(null);

  // Register tooltip elements
  React.useEffect(() => {
    const cleanup1 = registerTooltipElement(
      'credit-health-card',
      creditHealthCardRef,
      {
        autoShow: true,
        delay: 2000,
      }
    );
    const cleanup2 = registerTooltipElement(
      'payment-optimizer-button',
      paymentOptimizerRef
    );
    const cleanup3 = registerTooltipElement(
      'utilization-stats',
      utilizationStatsRef
    );
    const cleanup4 = registerTooltipElement(
      'education-content',
      educationCardRef
    );

    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
      cleanup4();
    };
  }, [registerTooltipElement]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCards();
    } catch (error) {
      console.error('Failed to refresh insights:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenPaymentOptimizer = () => {
    if (!cards || cards.length === 0) {
      Alert.alert(
        'No Credit Cards',
        'Add some credit cards first to use the payment optimizer.',
        [
          {
            text: 'Add Cards',
            onPress: () => router.push('/(tabs)/cards'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    router.push('/modals/payment-optimizer');
  };

  const getCreditHealthStatus = () => {
    if (!summaryData)
      return { status: 'unknown', message: 'Loading...', color: '#6c757d' };

    if (totalUtilization <= 10) {
      return {
        status: 'excellent',
        message:
          'Excellent credit health! Your low utilization helps maintain a high credit score.',
        color: '#00A76F',
        icon: CheckCircle,
      };
    } else if (totalUtilization <= 30) {
      return {
        status: 'good',
        message:
          'Good credit management. Consider the payment optimizer to improve further.',
        color: '#00C896',
        icon: TrendingUp,
      };
    } else if (totalUtilization <= 50) {
      return {
        status: 'fair',
        message:
          'Room for improvement. Use the payment optimizer to maximize score impact.',
        color: '#F6AD55',
        icon: Target,
      };
    } else if (totalUtilization <= 80) {
      return {
        status: 'poor',
        message:
          'High utilization is hurting your score. Urgent optimization recommended.',
        color: '#F6AD55',
        icon: AlertCircle,
      };
    } else {
      return {
        status: 'critical',
        message:
          'Critical utilization level! Immediate action needed to protect your credit score.',
        color: '#E53E3E',
        icon: AlertCircle,
      };
    }
  };

  const getOptimizationRecommendation = () => {
    if (!cards || cards.length === 0) {
      return {
        title: 'Add Credit Cards',
        description:
          'Start by adding your credit cards to get personalized optimization recommendations.',
        actionText: 'Add Cards',
        actionHandler: () => router.push('/(tabs)/cards'),
      };
    }

    if (totalUtilization <= 10) {
      return {
        title: 'Maintain Excellence',
        description:
          'Your utilization is excellent! Continue current payment habits.',
        actionText: 'View Strategy',
        actionHandler: handleOpenPaymentOptimizer,
      };
    }

    const potentialSavings = Math.floor(
      ((totalUtilization - 30) * totalCreditLimit) / 100
    );

    return {
      title: 'Optimize Payments',
      description: `Reduce utilization by ${formatCreditLimit(potentialSavings)} to improve your credit score.`,
      actionText: 'Optimize Now',
      actionHandler: handleOpenPaymentOptimizer,
    };
  };

  if (loading && !cards) {
    return (
      <SafeAreaView style={styles.container}>
        <SkeletonInsights />
      </SafeAreaView>
    );
  }

  const creditHealth = getCreditHealthStatus();
  const optimization = getOptimizationRecommendation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2B5CE6']}
            tintColor="#2B5CE6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Financial Insights</Text>
          <Text style={styles.subtitle}>
            AI-powered recommendations to optimize your credit
          </Text>
        </View>

        {/* Quick Stats */}
        {summaryData && (
          <View style={styles.quickStats}>
            <View style={[styles.statCard, styles.statCardLeft]}>
              <View style={styles.statIconContainer}>
                <CreditCard size={20} color="#6B5DD3" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{cards?.length || 0}</Text>
                <Text style={styles.statLabel}>Credit Cards</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: creditHealth.color + '15' },
                ]}
              >
                <creditHealth.icon size={20} color={creditHealth.color} />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: creditHealth.color }]}>
                  {totalUtilization.toFixed(0)}%
                </Text>
                <Text style={styles.statLabel}>Utilization</Text>
              </View>
            </View>

            <View style={[styles.statCard, styles.statCardRight]}>
              <View style={styles.statIconContainer}>
                <Shield size={20} color="#00C896" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>
                  {formatCreditLimit(summaryData.totalAvailableCredit)}
                </Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment Optimizer Card */}
        <TouchableOpacity
          style={[styles.card, styles.primaryCard]}
          onPress={optimization.actionHandler}
          activeOpacity={0.9}
        >
          <View style={styles.primaryCardHeader}>
            <View style={styles.primaryIconContainer}>
              <Zap size={24} color="#FFFFFF" />
            </View>
            <View style={styles.primaryContent}>
              <Text style={styles.primaryCardTitle}>Payment Optimizer</Text>
              <Text style={styles.primaryCardSubtitle}>
                AI-powered credit optimization
              </Text>
            </View>
            <ChevronRight size={24} color="#FFFFFF" />
          </View>

          <View style={styles.primaryCardContent}>
            <Text style={styles.optimizationTitle}>{optimization.title}</Text>
            <Text style={styles.optimizationDescription}>
              {optimization.description}
            </Text>

            <View style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                {optimization.actionText}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Credit Health Card */}
        <View style={styles.card} ref={creditHealthCardRef}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View
                style={[
                  styles.cardIconContainer,
                  { backgroundColor: creditHealth.color + '15' },
                ]}
              >
                <creditHealth.icon size={20} color={creditHealth.color} />
              </View>
              <Text style={styles.cardTitle}>Credit Health</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: creditHealth.color + '15' },
              ]}
            >
              <Text style={[styles.statusText, { color: creditHealth.color }]}>
                {creditHealth.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.healthMessage}>{creditHealth.message}</Text>

            <View style={styles.utilizationContainer}>
              <View style={styles.utilizationBar}>
                <View
                  style={[
                    styles.utilizationFill,
                    {
                      width: `${Math.min(totalUtilization, 100)}%`,
                      backgroundColor: creditHealth.color,
                    },
                  ]}
                />
              </View>
              <View style={styles.utilizationStats}>
                <View style={styles.utilizationItem}>
                  <Text style={styles.utilizationLabel}>Total Utilization</Text>
                  <Text
                    style={[
                      styles.utilizationValue,
                      { color: creditHealth.color },
                    ]}
                  >
                    {totalUtilization.toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.utilizationItem}>
                  <Text style={styles.utilizationLabel}>Average per Card</Text>
                  <Text style={styles.utilizationValue}>
                    {averageUtilization.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Canadian Credit Education */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View
                style={[
                  styles.cardIconContainer,
                  { backgroundColor: '#E53E3E15' },
                ]}
              >
                <Leaf size={20} color="#E53E3E" />
              </View>
              <Text style={styles.cardTitle}>Canadian Credit Tips</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.educationContent}>
              <View style={styles.educationTipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.educationTip}>
                  Keep total utilization under 30% for Equifax and TransUnion
                </Text>
              </View>
              <View style={styles.educationTipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.educationTip}>
                  Individual card utilization should stay below 90%
                </Text>
              </View>
              <View style={styles.educationTipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.educationTip}>
                  Pay balances before statement dates for lower reported
                  utilization
                </Text>
              </View>
              <View style={styles.educationTipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.educationTip}>
                  Consider increasing credit limits to improve utilization
                  ratios
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.educationButton}
              onPress={() => router.push('/modals/education-module')}
            >
              <Text style={styles.educationButtonText}>Learn More</Text>
              <ChevronRight size={16} color="#6B5DD3" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Tooltip System */}
      {activeTooltip && (
        <TooltipSystem
          tooltipData={activeTooltip.data}
          targetPosition={activeTooltip.position}
          visible={true}
          onDismiss={handleTooltipDismiss}
          onLearnMore={handleLearnMore}
        />
      )}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL || 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.MD || 16,
    paddingTop: SPACING.LG || 24,
    paddingBottom: SPACING.MD || 16,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1F36',
    marginBottom: SPACING.XS || 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    lineHeight: 24,
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.MD || 16,
    paddingVertical: SPACING.MD || 16,
    gap: SPACING.SM || 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.MD || 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statCardLeft: {
    marginLeft: 0,
  },
  statCardRight: {
    marginRight: 0,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#6B5DD315',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.SM || 12,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1F36',
    marginBottom: SPACING.XXS || 2,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: SPACING.MD || 16,
    marginVertical: SPACING.SM || 8,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardHeader: {
    paddingHorizontal: SPACING.LG || 20,
    paddingTop: SPACING.LG || 20,
    paddingBottom: SPACING.SM || 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.SM || 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1F36',
    letterSpacing: -0.25,
  },
  cardContent: {
    paddingHorizontal: SPACING.LG || 20,
    paddingBottom: SPACING.LG || 20,
  },
  statusBadge: {
    paddingHorizontal: SPACING.SM || 12,
    paddingVertical: SPACING.XXS || 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  primaryCard: {
    backgroundColor: '#2B5CE6',
    overflow: 'hidden',
  },
  primaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG || 20,
    paddingTop: SPACING.LG || 20,
    paddingBottom: SPACING.MD || 16,
  },
  primaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD || 16,
  },
  primaryContent: {
    flex: 1,
  },
  primaryCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: SPACING.XXS || 2,
    letterSpacing: -0.5,
  },
  primaryCardSubtitle: {
    fontSize: 14,
    color: '#FFFFFF90',
  },
  primaryCardContent: {
    paddingHorizontal: SPACING.LG || 20,
    paddingBottom: SPACING.LG || 20,
  },
  optimizationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: SPACING.SM || 8,
  },
  optimizationDescription: {
    fontSize: 14,
    color: '#FFFFFFB0',
    lineHeight: 20,
    marginBottom: SPACING.MD || 16,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF20',
    paddingHorizontal: SPACING.LG || 24,
    paddingVertical: SPACING.SM || 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF30',
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  healthMessage: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: SPACING.MD || 16,
  },
  utilizationContainer: {
    marginTop: SPACING.SM || 8,
  },
  utilizationBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.MD || 16,
  },
  utilizationFill: {
    height: '100%',
    borderRadius: 4,
  },
  utilizationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  utilizationItem: {
    alignItems: 'center',
  },
  utilizationLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: SPACING.XXS || 4,
  },
  utilizationValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1F36',
    letterSpacing: -0.5,
  },
  educationContent: {
    marginBottom: SPACING.MD || 16,
  },
  educationTipItem: {
    flexDirection: 'row',
    marginBottom: SPACING.SM || 12,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B5DD3',
    marginRight: SPACING.SM || 12,
    marginTop: 7,
  },
  educationTip: {
    flex: 1,
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  educationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B5DD315',
    paddingHorizontal: SPACING.MD || 16,
    paddingVertical: SPACING.SM || 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  educationButtonText: {
    color: '#6B5DD3',
    fontSize: 14,
    fontWeight: '600',
    marginRight: SPACING.XS || 4,
  },
  bottomSpacer: {
    height: SPACING.XL || 32,
  },
});
