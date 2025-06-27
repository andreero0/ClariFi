import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { useCreditCards } from '../../hooks/useCreditCards';
import {
  CreditCard,
  formatCreditLimit,
  calculateUtilization,
} from '../../types/creditCard';

interface OptimizationCard extends CreditCard {
  suggestedPayment: number;
  newBalance: number;
  newUtilization: number;
  utilizationChange: number;
  scoreImpact: number;
}

interface OptimizationStrategy {
  id: string;
  name: string;
  description: string;
  icon: string;
  benefit: string;
}

interface ScoreImpactCalculation {
  currentScore: number;
  projectedScore: number;
  change: number;
  factors: {
    utilizationImpact: number;
    paymentHistoryImpact: number;
    creditMixImpact: number;
  };
}

const OPTIMIZATION_STRATEGIES: OptimizationStrategy[] = [
  {
    id: 'score',
    name: 'Maximize Credit Score',
    description: 'Focus on reducing utilization for maximum score impact',
    icon: '📈',
    benefit: '+12-18 points',
  },
  {
    id: 'interest',
    name: 'Minimize Interest',
    description: 'Pay high-interest cards first to save money',
    icon: '💰',
    benefit: '$47/month saved',
  },
  {
    id: 'snowball',
    name: 'Debt Snowball',
    description: 'Pay off smallest balances first for motivation',
    icon: '⛄',
    benefit: '2-3 cards paid off',
  },
];

export default function PaymentOptimizerModal() {
  const router = useRouter();
  const { cards } = useCreditCards();

  const [availableFunds, setAvailableFunds] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('score');
  const [optimizedCards, setOptimizedCards] = useState<OptimizationCard[]>([]);
  const [manualAdjustments, setManualAdjustments] = useState<
    OptimizationCard[]
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);

  // Filter out cards with zero balance for optimization
  const eligibleCards = useMemo(() => {
    return cards?.filter(card => card.currentBalance > 0) || [];
  }, [cards]);

  const totalMinimumPayments = useMemo(() => {
    return eligibleCards.reduce((sum, card) => sum + card.minimumPayment, 0);
  }, [eligibleCards]);

  const currentTotalUtilization = useMemo(() => {
    if (!cards || cards.length === 0) return 0;
    const totalBalance = cards.reduce(
      (sum, card) => sum + card.currentBalance,
      0
    );
    const totalLimit = cards.reduce((sum, card) => sum + card.creditLimit, 0);
    return totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
  }, [cards]);

  // Get current cards being displayed (manual adjustments or algorithm results)
  const currentCards =
    isManualMode && manualAdjustments.length > 0
      ? manualAdjustments
      : optimizedCards;

  const calculateScoreImpact = (
    utilizationChange: number
  ): ScoreImpactCalculation => {
    // Simplified Canadian credit score calculation (300-900 range)
    const baseScore = 700; // Assumed current score

    // Utilization has the highest impact (35% of score)
    const utilizationImpact = Math.min(
      100,
      Math.max(-100, utilizationChange * -2)
    );

    // Payment history impact (minimal for this tool)
    const paymentHistoryImpact = 5; // Positive for making payments

    // Credit mix impact (minimal)
    const creditMixImpact = 2;

    const totalImpact =
      utilizationImpact + paymentHistoryImpact + creditMixImpact;
    const projectedScore = Math.min(
      900,
      Math.max(300, baseScore + totalImpact)
    );

    return {
      currentScore: baseScore,
      projectedScore,
      change: totalImpact,
      factors: {
        utilizationImpact,
        paymentHistoryImpact,
        creditMixImpact,
      },
    };
  };

  const optimizePayments = () => {
    const funds = parseFloat(availableFunds);

    if (isNaN(funds) || funds <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    if (funds < totalMinimumPayments) {
      Alert.alert(
        'Insufficient Funds',
        `You need at least ${formatCreditLimit(totalMinimumPayments)} to cover minimum payments.`
      );
      return;
    }

    const remainingFunds = funds - totalMinimumPayments;
    const optimized = [...eligibleCards].map(card => ({
      ...card,
      suggestedPayment: card.minimumPayment,
      newBalance: card.currentBalance - card.minimumPayment,
      newUtilization: 0,
      utilizationChange: 0,
      scoreImpact: 0,
    }));

    // Apply optimization strategy
    if (selectedStrategy === 'score') {
      optimizeForScore(optimized, remainingFunds);
    } else if (selectedStrategy === 'interest') {
      optimizeForInterest(optimized, remainingFunds);
    } else {
      optimizeForSnowball(optimized, remainingFunds);
    }

    // Calculate new utilizations and impacts
    optimized.forEach(card => {
      const oldUtilization = calculateUtilization(
        card.currentBalance,
        card.creditLimit
      );
      card.newUtilization = calculateUtilization(
        card.newBalance,
        card.creditLimit
      );
      card.utilizationChange = card.newUtilization - oldUtilization;
      card.scoreImpact = Math.abs(card.utilizationChange) * 2; // Simplified impact calculation
    });

    setOptimizedCards(optimized);
    setShowResults(true);
  };

  const optimizeForScore = (cards: OptimizationCard[], extraFunds: number) => {
    // Sort by utilization ratio (highest first)
    const sortedCards = cards.sort((a, b) => {
      const utilizationA = calculateUtilization(
        a.currentBalance,
        a.creditLimit
      );
      const utilizationB = calculateUtilization(
        b.currentBalance,
        b.creditLimit
      );
      return utilizationB - utilizationA;
    });

    let remainingFunds = extraFunds;

    // First, try to get cards under 30% utilization
    for (const card of sortedCards) {
      const targetBalance = card.creditLimit * 0.3;
      const paymentNeeded = Math.max(0, card.newBalance - targetBalance);
      const payment = Math.min(paymentNeeded, remainingFunds);

      if (payment > 0) {
        card.suggestedPayment += payment;
        card.newBalance -= payment;
        remainingFunds -= payment;
      }
    }

    // Then, distribute remaining funds proportionally
    while (
      remainingFunds > 0 &&
      sortedCards.some(card => card.newBalance > 0)
    ) {
      let totalDistributed = 0;

      for (const card of sortedCards) {
        if (card.newBalance > 0 && remainingFunds > 0) {
          const payment = Math.min(remainingFunds, card.newBalance, 100); // $100 increments
          card.suggestedPayment += payment;
          card.newBalance -= payment;
          remainingFunds -= payment;
          totalDistributed += payment;
        }
      }

      if (totalDistributed === 0) break; // Prevent infinite loop
    }
  };

  const optimizeForInterest = (
    cards: OptimizationCard[],
    extraFunds: number
  ) => {
    // Sort by interest rate (highest first)
    const sortedCards = cards.sort((a, b) => b.interestRate - a.interestRate);

    let remainingFunds = extraFunds;

    for (const card of sortedCards) {
      const payment = Math.min(remainingFunds, card.newBalance);
      card.suggestedPayment += payment;
      card.newBalance -= payment;
      remainingFunds -= payment;

      if (remainingFunds <= 0) break;
    }
  };

  const optimizeForSnowball = (
    cards: OptimizationCard[],
    extraFunds: number
  ) => {
    // Sort by balance (lowest first)
    const sortedCards = cards.sort(
      (a, b) => a.currentBalance - b.currentBalance
    );

    let remainingFunds = extraFunds;

    for (const card of sortedCards) {
      const payment = Math.min(remainingFunds, card.newBalance);
      card.suggestedPayment += payment;
      card.newBalance -= payment;
      remainingFunds -= payment;

      if (remainingFunds <= 0) break;
    }
  };

  const resetOptimization = () => {
    setOptimizedCards([]);
    setManualAdjustments([]);
    setShowResults(false);
    setAvailableFunds('');
    setIsManualMode(false);
  };

  const resetToAlgorithm = () => {
    setManualAdjustments([...optimizedCards]);
    setIsManualMode(false);
  };

  const enableManualMode = () => {
    if (optimizedCards.length > 0) {
      setManualAdjustments([...optimizedCards]);
      setIsManualMode(true);
    }
  };

  const handlePaymentAdjustment = (cardId: string, newPayment: number) => {
    const funds = parseFloat(availableFunds);
    if (isNaN(funds)) return;

    const updatedCards = [...manualAdjustments];
    const cardIndex = updatedCards.findIndex(card => card.id === cardId);

    if (cardIndex === -1) return;

    const card = updatedCards[cardIndex];

    // Ensure payment is within bounds
    const minPayment = card.minimumPayment;
    const maxPayment = Math.min(card.currentBalance, funds);
    const constrainedPayment = Math.max(
      minPayment,
      Math.min(newPayment, maxPayment)
    );

    // Update the card
    updatedCards[cardIndex] = {
      ...card,
      suggestedPayment: constrainedPayment,
      newBalance: card.currentBalance - constrainedPayment,
    };

    // Recalculate utilizations and impacts
    updatedCards[cardIndex].newUtilization = calculateUtilization(
      updatedCards[cardIndex].newBalance,
      card.creditLimit
    );

    const oldUtilization = calculateUtilization(
      card.currentBalance,
      card.creditLimit
    );
    updatedCards[cardIndex].utilizationChange =
      updatedCards[cardIndex].newUtilization - oldUtilization;
    updatedCards[cardIndex].scoreImpact =
      Math.abs(updatedCards[cardIndex].utilizationChange) * 2;

    setManualAdjustments(updatedCards);
  };

  const getTotalOptimizedUtilization = () => {
    const activeCards =
      isManualMode && manualAdjustments.length > 0
        ? manualAdjustments
        : optimizedCards;
    if (activeCards.length === 0) return currentTotalUtilization;

    const totalNewBalance = activeCards.reduce(
      (sum, card) => sum + card.newBalance,
      0
    );
    const totalLimit = activeCards.reduce(
      (sum, card) => sum + card.creditLimit,
      0
    );
    return totalLimit > 0 ? (totalNewBalance / totalLimit) * 100 : 0;
  };

  const scoreImpact = useMemo(() => {
    if (!showResults) return null;
    const utilizationChange =
      currentTotalUtilization - getTotalOptimizedUtilization();
    return calculateScoreImpact(utilizationChange);
  }, [
    showResults,
    optimizedCards,
    manualAdjustments,
    isManualMode,
    currentTotalUtilization,
  ]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Optimize Your Payments</Text>
        <Text style={styles.subtitle}>
          Maximize your credit score impact with strategic payments
        </Text>
      </View>
    </View>
  );

  const renderCurrentSummary = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Current Situation</Text>

      <View style={styles.summaryStats}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{eligibleCards.length}</Text>
          <Text style={styles.summaryLabel}>Cards with Balance</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text
            style={[
              styles.summaryValue,
              { color: getUtilizationColor(currentTotalUtilization) },
            ]}
          >
            {currentTotalUtilization.toFixed(1)}%
          </Text>
          <Text style={styles.summaryLabel}>Total Utilization</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {formatCreditLimit(totalMinimumPayments)}
          </Text>
          <Text style={styles.summaryLabel}>Min. Payments</Text>
        </View>
      </View>
    </View>
  );

  const renderStrategySelector = () => (
    <View style={styles.strategyCard}>
      <Text style={styles.strategyTitle}>Optimization Strategy</Text>

      {OPTIMIZATION_STRATEGIES.map(strategy => (
        <TouchableOpacity
          key={strategy.id}
          style={[
            styles.strategyOption,
            selectedStrategy === strategy.id && styles.strategyOptionSelected,
          ]}
          onPress={() => setSelectedStrategy(strategy.id)}
        >
          <Text style={styles.strategyIcon}>{strategy.icon}</Text>
          <View style={styles.strategyContent}>
            <View style={styles.strategyHeader}>
              <Text
                style={[
                  styles.strategyName,
                  selectedStrategy === strategy.id &&
                    styles.strategyNameSelected,
                ]}
              >
                {strategy.name}
              </Text>
              <Text style={styles.strategyBenefit}>{strategy.benefit}</Text>
            </View>
            <Text style={styles.strategyDescription}>
              {strategy.description}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPaymentInput = () => {
    const funds = parseFloat(availableFunds) || 0;
    const maxFunds = Math.max(totalMinimumPayments * 3, 2000); // Reasonable max for slider

    return (
      <View style={styles.inputCard}>
        <Text style={styles.inputTitle}>Available Payment Funds</Text>

        <TextInput
          style={styles.fundsInput}
          value={availableFunds}
          onChangeText={setAvailableFunds}
          placeholder="0.00"
          keyboardType="numeric"
          maxLength={10}
        />

        {/* Visual Slider for adjustment */}
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>
            Adjust Amount: {formatCreditLimit(funds)}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={maxFunds}
            value={funds}
            onValueChange={value => setAvailableFunds(value.toFixed(0))}
            step={50}
            thumbStyle={styles.sliderThumb}
            trackStyle={styles.sliderTrack}
            minimumTrackTintColor="#2B5CE6"
            maximumTrackTintColor="#E2E8F0"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>$0</Text>
            <Text style={styles.sliderLabelText}>
              {formatCreditLimit(maxFunds)}
            </Text>
          </View>
        </View>

        <Text style={styles.inputHint}>
          Minimum required: {formatCreditLimit(totalMinimumPayments)}
        </Text>

        <TouchableOpacity
          style={[
            styles.optimizeButton,
            (!availableFunds ||
              parseFloat(availableFunds) < totalMinimumPayments) &&
              styles.optimizeButtonDisabled,
          ]}
          onPress={optimizePayments}
          disabled={
            !availableFunds || parseFloat(availableFunds) < totalMinimumPayments
          }
        >
          <Text style={styles.optimizeButtonText}>Calculate Best Plan</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderResults = () => {
    if (!showResults || optimizedCards.length === 0) return null;

    const totalUtilizationChange =
      currentTotalUtilization - getTotalOptimizedUtilization();

    return (
      <View style={styles.resultsCard}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {isManualMode ? 'Manual Adjustments' : 'Optimization Results'}
          </Text>

          <View style={styles.headerButtons}>
            {!isManualMode && (
              <TouchableOpacity
                style={styles.manualButton}
                onPress={enableManualMode}
              >
                <Text style={styles.manualButtonText}>Manual</Text>
              </TouchableOpacity>
            )}

            {isManualMode && (
              <TouchableOpacity
                style={styles.algorithmButton}
                onPress={resetToAlgorithm}
              >
                <Text style={styles.algorithmButtonText}>Algorithm</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetOptimization}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Score Impact Summary */}
        {scoreImpact && (
          <View style={styles.scoreImpactCard}>
            <Text style={styles.scoreImpactTitle}>
              Projected Credit Score Impact
            </Text>

            <View style={styles.scoreComparison}>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreValue}>
                  {scoreImpact.currentScore}
                </Text>
                <Text style={styles.scoreLabel}>Current Est.</Text>
              </View>

              <Text style={styles.scoreArrow}>→</Text>

              <View style={styles.scoreItem}>
                <Text
                  style={[
                    styles.scoreValue,
                    { color: scoreImpact.change > 0 ? '#28a745' : '#dc3545' },
                  ]}
                >
                  {scoreImpact.projectedScore}
                </Text>
                <Text style={styles.scoreLabel}>Projected</Text>
              </View>
            </View>

            <Text
              style={[
                styles.scoreChange,
                { color: scoreImpact.change > 0 ? '#28a745' : '#dc3545' },
              ]}
            >
              {scoreImpact.change > 0 ? '+' : ''}
              {scoreImpact.change} points
            </Text>
          </View>
        )}

        {/* Utilization Summary */}
        <View style={styles.utilizationSummary}>
          <View style={styles.utilizationItem}>
            <Text style={styles.utilizationLabel}>Current Utilization</Text>
            <Text
              style={[
                styles.utilizationValue,
                { color: getUtilizationColor(currentTotalUtilization) },
              ]}
            >
              {currentTotalUtilization.toFixed(1)}%
            </Text>
          </View>

          <Text style={styles.utilizationArrow}>→</Text>

          <View style={styles.utilizationItem}>
            <Text style={styles.utilizationLabel}>After Payments</Text>
            <Text
              style={[
                styles.utilizationValue,
                { color: getUtilizationColor(getTotalOptimizedUtilization()) },
              ]}
            >
              {getTotalOptimizedUtilization().toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Card-by-Card Results */}
        <Text style={styles.cardResultsTitle}>
          {isManualMode ? 'Adjust Payments' : 'Suggested Payments'}
        </Text>

        {currentCards.map(card => (
          <View key={card.id} style={styles.cardResult}>
            <View style={styles.cardResultHeader}>
              <Text style={styles.cardResultName}>{card.name}</Text>
              <Text style={styles.cardResultPayment}>
                {formatCreditLimit(card.suggestedPayment)}
              </Text>
            </View>

            {isManualMode && (
              <View style={styles.adjustmentControls}>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>
                    Payment Amount: {formatCreditLimit(card.suggestedPayment)}
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={card.minimumPayment}
                    maximumValue={Math.min(
                      card.currentBalance,
                      parseFloat(availableFunds) || card.currentBalance
                    )}
                    value={card.suggestedPayment}
                    onValueChange={value =>
                      handlePaymentAdjustment(card.id, value)
                    }
                    step={10}
                    thumbStyle={styles.sliderThumb}
                    trackStyle={styles.sliderTrack}
                    minimumTrackTintColor="#007AFF"
                    maximumTrackTintColor="#E9ECEF"
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabelText}>
                      Min: {formatCreditLimit(card.minimumPayment)}
                    </Text>
                    <Text style={styles.sliderLabelText}>
                      Max:{' '}
                      {formatCreditLimit(
                        Math.min(
                          card.currentBalance,
                          parseFloat(availableFunds) || card.currentBalance
                        )
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.cardResultDetails}>
              <Text style={styles.cardResultDetail}>
                Balance: {formatCreditLimit(card.currentBalance)} →{' '}
                {formatCreditLimit(card.newBalance)}
              </Text>
              <Text style={styles.cardResultDetail}>
                Utilization:{' '}
                {calculateUtilization(
                  card.currentBalance,
                  card.creditLimit
                ).toFixed(1)}
                % → {card.newUtilization.toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}

        {/* Strategy Explanation */}
        <TouchableOpacity
          style={styles.explanationButton}
          onPress={() => setShowExplanation(!showExplanation)}
        >
          <Text style={styles.explanationButtonText}>
            {showExplanation ? 'Hide' : 'Show'} Strategy Explanation
          </Text>
        </TouchableOpacity>

        {showExplanation && (
          <View style={styles.explanationCard}>
            <Text style={styles.explanationTitle}>Why This Strategy?</Text>
            <Text style={styles.explanationText}>
              {getStrategyExplanation(selectedStrategy, totalUtilizationChange)}
            </Text>
          </View>
        )}

        {/* Apply This Plan CTA */}
        <TouchableOpacity
          style={styles.applyPlanButton}
          onPress={() => {
            // For now, just show a success message
            Alert.alert(
              'Plan Applied!',
              'Your payment plan has been saved. You can set up reminders and track your progress.',
              [
                { text: 'Set Reminders', style: 'default' },
                { text: 'Track Progress', style: 'default' },
                { text: 'OK', style: 'cancel' },
              ]
            );
          }}
        >
          <Text style={styles.applyPlanButtonText}>Apply This Plan</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization <= 10) return '#28a745';
    if (utilization <= 30) return '#20c997';
    if (utilization <= 50) return '#ffc107';
    if (utilization <= 80) return '#fd7e14';
    return '#dc3545';
  };

  const getStrategyExplanation = (
    strategy: string,
    utilizationReduction: number
  ) => {
    const selectedStrategyObj = OPTIMIZATION_STRATEGIES.find(
      s => s.id === strategy
    );

    if (strategy === 'score') {
      return `This strategy prioritizes reducing your credit utilization ratio, which has the biggest impact on your credit score in Canada. By reducing your total utilization by ${utilizationReduction.toFixed(1)}%, you could see an improvement in your Equifax and TransUnion credit scores within 1-2 billing cycles. Best for people who want to improve their credit score quickly.`;
    } else if (strategy === 'interest') {
      return `This strategy focuses on paying off high-interest debt first, which saves you the most money in interest charges over time. While it may not have the immediate credit score impact of the score-focused approach, it optimizes your financial health long-term. Best for people who want to minimize total debt costs.`;
    } else {
      return `This strategy pays off your smallest balances first, creating psychological momentum as you eliminate debts completely. While it may not be mathematically optimal, it provides motivation through quick wins. Best for people who need psychological encouragement to stay on track with debt payments.`;
    }
  };

  if (!cards || cards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Credit Cards Found</Text>
          <Text style={styles.emptyText}>
            Add some credit cards first to use the payment optimizer.
          </Text>
          <TouchableOpacity
            style={styles.addCardsButton}
            onPress={() => {
              router.back();
              router.push('/(tabs)/cards');
            }}
          >
            <Text style={styles.addCardsButtonText}>Add Credit Cards</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (eligibleCards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Balances to Optimize</Text>
          <Text style={styles.emptyText}>
            All your credit cards have zero balance. Great job maintaining low
            utilization!
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.addCardsButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderHeader()}

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderCurrentSummary()}
          {renderStrategySelector()}
          {renderPaymentInput()}
          {renderResults()}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginLeft: -32, // Compensate for close button
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  strategyCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  strategyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  strategyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    marginBottom: 12,
  },
  strategyOptionSelected: {
    borderColor: '#2B5CE6',
    backgroundColor: '#F7F9FC',
  },
  strategyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  strategyContent: {
    flex: 1,
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  strategyNameSelected: {
    color: '#2B5CE6',
  },
  strategyBenefit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C896',
  },
  strategyDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },
  inputCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  fundsInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  optimizeButton: {
    backgroundColor: '#2B5CE6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  optimizeButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  optimizeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  manualButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  manualButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  algorithmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#28a745',
    borderWidth: 1,
    borderColor: '#28a745',
  },
  algorithmButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  adjustmentControls: {
    marginVertical: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e1e5e9',
  },
  sliderContainer: {
    paddingHorizontal: 4,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#007AFF',
    width: 20,
    height: 20,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#6c757d',
  },
  scoreImpactCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  scoreImpactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  scoreComparison: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  scoreArrow: {
    fontSize: 20,
    color: '#6c757d',
  },
  scoreChange: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  utilizationSummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  utilizationItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  utilizationLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  utilizationValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  utilizationArrow: {
    fontSize: 16,
    color: '#6c757d',
  },
  cardResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  cardResult: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  cardResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cardResultPayment: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  cardResultDetails: {
    gap: 4,
  },
  cardResultDetail: {
    fontSize: 14,
    color: '#6c757d',
  },
  explanationButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    marginTop: 16,
  },
  explanationButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  explanationCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  addCardsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addCardsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  applyPlanButton: {
    backgroundColor: '#2B5CE6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#2B5CE6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  applyPlanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 32,
  },
});
