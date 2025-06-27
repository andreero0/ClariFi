import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  ArrowRight,
  Clock,
  Target,
  CheckCircle,
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
  recommendedPayment: number;
}

interface PaymentAllocation {
  cardId: string;
  amount: number;
  newBalance: number;
  newUtilization: number;
  interestSavings: number;
}

const PaymentDistributionSimulator: React.FC = () => {
  const [availableFunds, setAvailableFunds] = useState('500');
  const [paymentAllocations, setPaymentAllocations] = useState<PaymentAllocation[]>([]);
  const [calculationComplete, setCalculationComplete] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const flowAnim = useRef(new Animated.Value(0)).current;

  // Mock credit card data
  const [cards] = useState<CreditCard[]>([
    {
      id: '1',
      name: 'TD Cashback Visa',
      balance: 2400,
      limit: 5000,
      interestRate: 19.99,
      minimumPayment: 75,
      utilization: 48,
      recommendedPayment: 200,
    },
    {
      id: '2',
      name: 'RBC Rewards Mastercard',
      balance: 1200,
      limit: 3000,
      interestRate: 22.99,
      minimumPayment: 40,
      utilization: 40,
      recommendedPayment: 180,
    },
    {
      id: '3',
      name: 'Scotiabank Gold Amex',
      balance: 800,
      limit: 2500,
      interestRate: 20.99,
      minimumPayment: 30,
      utilization: 32,
      recommendedPayment: 120,
    },
  ]);

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

  useEffect(() => {
    if (availableFunds && parseFloat(availableFunds) > 0) {
      calculateOptimalDistribution();
    }
  }, [availableFunds]);

  const calculateOptimalDistribution = () => {
    const funds = parseFloat(availableFunds) || 0;
    if (funds <= 0) return;

    // AI-powered optimization algorithm (simplified)
    const allocations: PaymentAllocation[] = [];
    let remainingFunds = funds;

    // First, cover all minimum payments
    const totalMinimums = cards.reduce((sum, card) => sum + card.minimumPayment, 0);
    
    if (funds < totalMinimums) {
      // Not enough for minimums - proportional allocation
      cards.forEach(card => {
        const allocation = (card.minimumPayment / totalMinimums) * funds;
        allocations.push({
          cardId: card.id,
          amount: allocation,
          newBalance: card.balance - allocation,
          newUtilization: ((card.balance - allocation) / card.limit) * 100,
          interestSavings: allocation * (card.interestRate / 100 / 12),
        });
      });
    } else {
      // Cover minimums, then optimize remaining funds
      remainingFunds -= totalMinimums;
      
      // Sort cards by optimization priority (highest utilization first for credit score impact)
      const sortedCards = [...cards].sort((a, b) => b.utilization - a.utilization);
      
      sortedCards.forEach(card => {
        const minimumPayment = card.minimumPayment;
        let additionalPayment = 0;
        
        if (remainingFunds > 0) {
          // Calculate additional payment to optimize utilization
          const targetUtilization = 30; // Optimal utilization threshold
          const targetBalance = (card.limit * targetUtilization) / 100;
          const maxAdditionalPayment = Math.max(0, card.balance - targetBalance);
          
          additionalPayment = Math.min(remainingFunds, maxAdditionalPayment);
          remainingFunds -= additionalPayment;
        }
        
        const totalPayment = minimumPayment + additionalPayment;
        allocations.push({
          cardId: card.id,
          amount: totalPayment,
          newBalance: card.balance - totalPayment,
          newUtilization: ((card.balance - totalPayment) / card.limit) * 100,
          interestSavings: totalPayment * (card.interestRate / 100 / 12),
        });
      });
    }

    setPaymentAllocations(allocations);
    setCalculationComplete(true);
    
    // Animate flow diagram
    Animated.timing(flowAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalInterestSavings = () => {
    return paymentAllocations.reduce((sum, allocation) => sum + allocation.interestSavings, 0);
  };

  const getAverageUtilizationBefore = () => {
    return cards.reduce((sum, card) => sum + card.utilization, 0) / cards.length;
  };

  const getAverageUtilizationAfter = () => {
    if (paymentAllocations.length === 0) return 0;
    return paymentAllocations.reduce((sum, allocation) => sum + allocation.newUtilization, 0) / paymentAllocations.length;
  };

  const getCreditScoreImpact = () => {
    const utilizationImprovement = getAverageUtilizationBefore() - getAverageUtilizationAfter();
    // Simplified credit score impact calculation
    return Math.round(utilizationImprovement * 2.5);
  };

  const renderFundsInput = () => (
    <Animated.View style={[styles.inputContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.inputLabel}>Available Funds</Text>
      <View style={styles.currencyInput}>
        <Text style={styles.currencySymbol}>$</Text>
        <TextInput
          style={styles.amountInput}
          value={availableFunds}
          onChangeText={setAvailableFunds}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor={colors.neutralGray}
        />
        <Text style={styles.currencyCode}>CAD</Text>
      </View>
      <Text style={styles.inputHint}>
        Enter the total amount you can allocate to credit card payments
      </Text>
    </Animated.View>
  );

  const renderFlowDiagram = () => {
    if (!calculationComplete) return null;

    return (
      <Animated.View style={[styles.flowContainer, { opacity: fadeAnim }]}>
        <Text style={styles.sectionTitle}>Payment Distribution</Text>
        
        <View style={styles.flowDiagram}>
          {/* Source */}
          <View style={styles.flowSource}>
            <DollarSign size={24} color={colors.growthGreen} />
            <Text style={styles.flowSourceAmount}>{formatCurrency(parseFloat(availableFunds))}</Text>
            <Text style={styles.flowSourceLabel}>Available Funds</Text>
          </View>
          
          {/* Flow lines and allocations */}
          <View style={styles.flowLines}>
            {paymentAllocations.map((allocation, index) => {
              const card = cards.find(c => c.id === allocation.cardId);
              if (!card) return null;
              
              const flowWidth = flowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, (allocation.amount / parseFloat(availableFunds)) * 100],
              });

              return (
                <View key={allocation.cardId} style={styles.flowLine}>
                  <Animated.View 
                    style={[
                      styles.flowArrow,
                      { width: `${flowWidth.__getValue()}%` }
                    ]}
                  />
                  <View style={styles.flowDestination}>
                    <CreditCard size={20} color={colors.clarityBlue} />
                    <View style={styles.flowDestinationInfo}>
                      <Text style={styles.flowDestinationName}>{card.name}</Text>
                      <Text style={styles.flowDestinationAmount}>
                        {formatCurrency(allocation.amount)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderComparisonBars = () => {
    if (!calculationComplete) return null;

    return (
      <Animated.View style={[styles.comparisonContainer, { opacity: fadeAnim }]}>
        <Text style={styles.sectionTitle}>Utilization Comparison</Text>
        
        {cards.map((card) => {
          const allocation = paymentAllocations.find(a => a.cardId === card.id);
          if (!allocation) return null;

          return (
            <View key={card.id} style={styles.comparisonCard}>
              <Text style={styles.comparisonCardName}>{card.name}</Text>
              
              <View style={styles.comparisonBars}>
                {/* Before */}
                <View style={styles.comparisonBar}>
                  <Text style={styles.comparisonLabel}>Before</Text>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar,
                        { 
                          width: `${card.utilization}%`,
                          backgroundColor: card.utilization >= 70 ? colors.errorRed : 
                                         card.utilization >= 30 ? colors.warning : colors.growthGreen
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.utilizationText}>{card.utilization.toFixed(0)}%</Text>
                </View>
                
                {/* Arrow */}
                <ArrowRight size={16} color={colors.neutralGray} />
                
                {/* After */}
                <View style={styles.comparisonBar}>
                  <Text style={styles.comparisonLabel}>After</Text>
                  <View style={styles.progressBarContainer}>
                    <Animated.View 
                      style={[
                        styles.progressBar,
                        { 
                          width: `${allocation.newUtilization}%`,
                          backgroundColor: allocation.newUtilization >= 70 ? colors.errorRed : 
                                         allocation.newUtilization >= 30 ? colors.warning : colors.growthGreen
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.utilizationText}>{allocation.newUtilization.toFixed(0)}%</Text>
                </View>
              </View>
            </View>
          );
        })}
      </Animated.View>
    );
  };

  const renderProjectedImpact = () => {
    if (!calculationComplete) return null;

    const creditScoreImpact = getCreditScoreImpact();
    const totalSavings = getTotalInterestSavings();

    return (
      <Animated.View style={[styles.impactContainer, { opacity: fadeAnim }]}>
        <Text style={styles.sectionTitle}>Projected Impact</Text>
        
        <View style={styles.impactCards}>
          <View style={styles.impactCard}>
            <TrendingUp size={24} color={colors.clarityBlue} />
            <Text style={styles.impactValue}>+{creditScoreImpact}</Text>
            <Text style={styles.impactLabel}>Credit Score Points</Text>
            <Text style={styles.impactTimeframe}>In 1-2 months</Text>
          </View>
          
          <View style={styles.impactCard}>
            <DollarSign size={24} color={colors.growthGreen} />
            <Text style={styles.impactValue}>{formatCurrency(totalSavings * 12)}</Text>
            <Text style={styles.impactLabel}>Annual Interest Savings</Text>
            <Text style={styles.impactTimeframe}>Per year</Text>
          </View>
          
          <View style={styles.impactCard}>
            <Clock size={24} color={colors.wisdomPurple} />
            <Text style={styles.impactValue}>8</Text>
            <Text style={styles.impactLabel}>Months Earlier</Text>
            <Text style={styles.impactTimeframe}>Debt freedom</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderApplyButton = () => {
    if (!calculationComplete) return null;

    return (
      <Animated.View style={[styles.applyButtonContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.applyButton}>
          <LinearGradient
            colors={[colors.growthGreen, colors.success]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.applyButtonGradient}
          >
            <CheckCircle size={24} color={colors.pureWhite} />
            <Text style={styles.applyButtonText}>Apply Recommendations</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.applyButtonHint}>
          This will create a payment plan based on your available funds
        </Text>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Payment Distribution</Text>
          <Calculator size={24} color={colors.clarityBlue} />
        </View>

        {/* Funds Input */}
        {renderFundsInput()}

        {/* Flow Diagram */}
        {renderFlowDiagram()}

        {/* Comparison Bars */}
        {renderComparisonBars()}

        {/* Projected Impact */}
        {renderProjectedImpact()}

        {/* Apply Button */}
        {renderApplyButton()}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    ...textStyles.h1,
    color: colors.midnightInk,
  },
  inputContainer: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginBottom: spacing.md,
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.borderDivider,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  currencySymbol: {
    ...textStyles.h2,
    color: colors.clarityBlue,
    marginRight: spacing.xs,
  },
  amountInput: {
    flex: 1,
    ...textStyles.h2,
    color: colors.midnightInk,
    paddingVertical: spacing.md,
  },
  currencyCode: {
    ...textStyles.body,
    color: colors.neutralGray,
    marginLeft: spacing.xs,
  },
  inputHint: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  flowContainer: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    ...textStyles.h2,
    color: colors.midnightInk,
    marginBottom: spacing.lg,
  },
  flowDiagram: {
    alignItems: 'center',
  },
  flowSource: {
    alignItems: 'center',
    backgroundColor: colors.cloudGray,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  flowSourceAmount: {
    ...textStyles.h2,
    color: colors.growthGreen,
    fontWeight: '700',
  },
  flowSourceLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  flowLines: {
    width: '100%',
  },
  flowLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  flowArrow: {
    height: 3,
    backgroundColor: colors.clarityBlue,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  flowDestination: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cloudGray,
    borderRadius: 12,
    padding: spacing.md,
    flex: 1,
  },
  flowDestinationInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  flowDestinationName: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '500',
  },
  flowDestinationAmount: {
    ...textStyles.caption,
    color: colors.clarityBlue,
    fontWeight: '600',
  },
  comparisonContainer: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  comparisonCard: {
    marginBottom: spacing.lg,
  },
  comparisonCardName: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  comparisonBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  comparisonBar: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
    marginBottom: spacing.xs,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.cloudGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  utilizationText: {
    ...textStyles.caption,
    color: colors.midnightInk,
    fontWeight: '600',
  },
  impactContainer: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  impactCards: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  impactCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.cloudGray,
    borderRadius: 12,
    padding: spacing.md,
  },
  impactValue: {
    ...textStyles.h3,
    color: colors.midnightInk,
    fontWeight: '700',
    marginVertical: spacing.xs,
  },
  impactLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  impactTimeframe: {
    ...textStyles.caption,
    color: colors.clarityBlue,
    textAlign: 'center',
    fontSize: 10,
  },
  applyButtonContainer: {
    marginHorizontal: spacing.lg,
    alignItems: 'center',
  },
  applyButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.growthGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: spacing.sm,
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  applyButtonText: {
    ...textStyles.button,
    color: colors.pureWhite,
    fontSize: 18,
    fontWeight: '600',
  },
  applyButtonHint: {
    ...textStyles.caption,
    color: colors.neutralGray,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

export default PaymentDistributionSimulator;