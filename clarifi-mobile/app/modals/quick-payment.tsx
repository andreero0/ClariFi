import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCreditCards } from '../../hooks/useCreditCards';
import { colors } from '../../constants';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import {
  X,
  CreditCard,
  DollarSign,
  TrendingDown,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

const QuickPaymentModal: React.FC = () => {
  const router = useRouter();
  const { cardId, suggestedAmount, utilizationTarget } = useLocalSearchParams<{
    cardId: string;
    suggestedAmount?: string;
    utilizationTarget?: string;
  }>();

  const { cards, addPayment } = useCreditCards();
  const card = cards?.find(c => c.id === cardId);

  const [paymentAmount, setPaymentAmount] = useState(suggestedAmount || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [paymentType, setPaymentType] = useState<
    'minimum' | 'suggested' | 'custom'
  >('suggested');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!card) {
    return null;
  }

  const currentUtilization = (card.currentBalance / card.creditLimit) * 100;
  const targetUtilization = parseFloat(utilizationTarget || '30');
  const minimumPayment = card.minimumPayment;
  const suggestedPaymentAmount = parseFloat(suggestedAmount || '0');

  // Calculate different payment scenarios
  const paymentToReachTarget = Math.max(
    0,
    card.currentBalance - (card.creditLimit * targetUtilization) / 100
  );
  const fullBalancePayment = card.currentBalance;

  const getPaymentOptions = () => [
    {
      type: 'minimum' as const,
      amount: minimumPayment,
      label: 'Minimum Payment',
      description: 'Required monthly payment',
      newUtilization:
        ((card.currentBalance - minimumPayment) / card.creditLimit) * 100,
    },
    {
      type: 'suggested' as const,
      amount: suggestedPaymentAmount || paymentToReachTarget,
      label: `Target ${targetUtilization}% Utilization`,
      description: 'Recommended for credit score optimization',
      newUtilization: targetUtilization,
    },
    {
      type: 'full' as const,
      amount: fullBalancePayment,
      label: 'Pay Full Balance',
      description: 'Eliminate all debt on this card',
      newUtilization: 0,
    },
  ];

  const handlePaymentTypeSelect = (
    type: 'minimum' | 'suggested' | 'custom',
    amount: number
  ) => {
    setPaymentType(type);
    setPaymentAmount(amount.toString());
  };

  const handleCustomAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9.]/g, '');
    setPaymentAmount(numericValue);
    setPaymentType('custom');
  };

  const handleSubmitPayment = async () => {
    const amount = parseFloat(paymentAmount);

    if (!amount || amount <= 0) {
      return;
    }

    if (amount > card.currentBalance) {
      // Could show warning but allow overpayment
    }

    setIsLoading(true);

    try {
      await addPayment(cardId, {
        amount,
        paymentDate: new Date().toISOString(),
        type: 'manual-payment',
        description: `Quick payment from utilization alert`,
      });

      // Show success animation then close
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error('Payment logging error:', error);
      setIsLoading(false);
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization <= 10) return colors.growthGreen;
    if (utilization <= 30) return colors.clarityBlue;
    if (utilization <= 60) return colors.warning;
    return colors.errorRed;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <X size={24} color={colors.pureWhite} />
      </TouchableOpacity>

      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Quick Payment</Text>
        <Text style={styles.headerSubtitle}>
          Optimize your credit utilization
        </Text>
      </View>
    </Animated.View>
  );

  const renderCardInfo = () => (
    <View style={styles.cardSection}>
      <View
        style={[
          styles.cardHeader,
          { backgroundColor: card.color || colors.clarityBlue },
        ]}
      >
        <View style={styles.cardIconContainer}>
          <CreditCard size={24} color={colors.pureWhite} />
        </View>
        <View style={styles.cardDetails}>
          <Text style={styles.cardName}>{card.name}</Text>
          <Text style={styles.cardNumber}>•••• {card.lastFourDigits}</Text>
        </View>
        <View style={styles.utilizationBadge}>
          <Text
            style={[
              styles.utilizationText,
              { color: getUtilizationColor(currentUtilization) },
            ]}
          >
            {currentUtilization.toFixed(0)}%
          </Text>
        </View>
      </View>

      <View style={styles.cardStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Current Balance</Text>
          <Text style={styles.statValue}>
            {formatCurrency(card.currentBalance)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Credit Limit</Text>
          <Text style={styles.statValue}>
            {formatCurrency(card.creditLimit)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPaymentOptions = () => (
    <View style={styles.optionsSection}>
      <Text style={styles.sectionTitle}>Payment Options</Text>

      {getPaymentOptions().map(option => (
        <TouchableOpacity
          key={option.type}
          style={[
            styles.paymentOption,
            paymentType === option.type && styles.selectedOption,
          ]}
          onPress={() => handlePaymentTypeSelect(option.type, option.amount)}
        >
          <View style={styles.optionContent}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionAmount}>
                {formatCurrency(option.amount)}
              </Text>
            </View>

            <Text style={styles.optionDescription}>{option.description}</Text>

            <View style={styles.utilizationPreview}>
              <Text style={styles.utilizationLabel}>New Utilization:</Text>
              <Text
                style={[
                  styles.utilizationValue,
                  { color: getUtilizationColor(option.newUtilization) },
                ]}
              >
                {option.newUtilization.toFixed(1)}%
              </Text>
              <TrendingDown
                size={16}
                color={
                  option.newUtilization < currentUtilization
                    ? colors.growthGreen
                    : colors.neutralGray
                }
              />
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCustomAmount = () => (
    <View style={styles.customSection}>
      <Text style={styles.sectionTitle}>Custom Amount</Text>

      <View style={styles.customInputContainer}>
        <View style={styles.currencySymbol}>
          <DollarSign size={20} color={colors.neutralGray} />
        </View>
        <TextInput
          style={styles.customInput}
          value={paymentAmount}
          onChangeText={handleCustomAmountChange}
          placeholder="0.00"
          placeholderTextColor={colors.neutralGray}
          keyboardType="numeric"
          returnKeyType="done"
        />
      </View>

      {parseFloat(paymentAmount) > card.currentBalance && (
        <View style={styles.warningContainer}>
          <Info size={16} color={colors.warning} />
          <Text style={styles.warningText}>
            Payment exceeds current balance. This will create a credit on your
            account.
          </Text>
        </View>
      )}
    </View>
  );

  const renderExplanation = () => (
    <View style={styles.explanationSection}>
      <TouchableOpacity
        style={styles.explanationToggle}
        onPress={() => setShowExplanation(!showExplanation)}
      >
        <Text style={styles.explanationToggleText}>Why this amount?</Text>
        {showExplanation ? (
          <ChevronUp size={20} color={colors.clarityBlue} />
        ) : (
          <ChevronDown size={20} color={colors.clarityBlue} />
        )}
      </TouchableOpacity>

      {showExplanation && (
        <Animated.View
          style={[styles.explanationContent, { opacity: fadeAnim }]}
        >
          <Text style={styles.explanationText}>
            Keeping your credit utilization below {targetUtilization}% is
            recommended for optimal credit scores in Canada. This payment amount
            will reduce your utilization from {currentUtilization.toFixed(1)}%
            to {targetUtilization}%, which can positively impact your credit
            score within 1-2 billing cycles.
          </Text>

          <View style={styles.benefitsList}>
            <Text style={styles.benefitsTitle}>Benefits of this payment:</Text>
            <Text style={styles.benefitItem}>
              • Improved credit score potential
            </Text>
            <Text style={styles.benefitItem}>• Better loan approval odds</Text>
            <Text style={styles.benefitItem}>
              • Lower interest rates on future credit
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionSection}>
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!paymentAmount || parseFloat(paymentAmount) <= 0 || isLoading) &&
            styles.disabledButton,
        ]}
        onPress={handleSubmitPayment}
        disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || isLoading}
      >
        {isLoading ? (
          <View style={styles.submitButtonContent}>
            <Text style={styles.submitButtonText}>Logging Payment...</Text>
          </View>
        ) : (
          <View style={styles.submitButtonContent}>
            <CheckCircle size={20} color={colors.pureWhite} />
            <Text style={styles.submitButtonText}>Log Payment</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <StatusBar
        backgroundColor={card.color || colors.clarityBlue}
        barStyle="light-content"
      />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {renderHeader()}

          <Animated.ScrollView
            style={[
              styles.scrollView,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {renderCardInfo()}
            {renderPaymentOptions()}
            {renderCustomAmount()}
            {renderExplanation()}

            <View style={styles.bottomSpacer} />
          </Animated.ScrollView>

          {renderActionButtons()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

export default QuickPaymentModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.clarityBlue,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginLeft: -40, // Compensate for close button width
  },
  headerTitle: {
    ...textStyles.h2,
    color: colors.pureWhite,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...textStyles.caption,
    color: colors.pureWhite,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  cardSection: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardDetails: {
    flex: 1,
  },
  cardName: {
    ...textStyles.h3,
    color: colors.pureWhite,
    marginBottom: spacing.xs,
  },
  cardNumber: {
    ...textStyles.caption,
    color: colors.pureWhite,
    opacity: 0.9,
  },
  utilizationBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  utilizationText: {
    ...textStyles.caption,
    fontWeight: '700',
  },
  cardStats: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.cloudGray,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
  },
  optionsSection: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginBottom: spacing.lg,
  },
  paymentOption: {
    borderWidth: 2,
    borderColor: colors.cloudGray,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  selectedOption: {
    borderColor: colors.clarityBlue,
    backgroundColor: colors.cloudGray,
  },
  optionContent: {
    gap: spacing.sm,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLabel: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
  },
  optionAmount: {
    ...textStyles.h3,
    color: colors.clarityBlue,
    fontWeight: '700',
  },
  optionDescription: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  utilizationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  utilizationLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  utilizationValue: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  customSection: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.cloudGray,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  currencySymbol: {
    marginRight: spacing.sm,
  },
  customInput: {
    flex: 1,
    ...textStyles.h2,
    color: colors.midnightInk,
    paddingVertical: spacing.md,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning + '20',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  warningText: {
    ...textStyles.caption,
    color: colors.warning,
    flex: 1,
  },
  explanationSection: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  explanationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  explanationToggleText: {
    ...textStyles.body,
    color: colors.clarityBlue,
    fontWeight: '600',
  },
  explanationContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cloudGray,
  },
  explanationText: {
    ...textStyles.body,
    color: colors.neutralGray,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  benefitsList: {
    backgroundColor: colors.cloudGray,
    padding: spacing.md,
    borderRadius: 8,
  },
  benefitsTitle: {
    ...textStyles.caption,
    color: colors.midnightInk,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  benefitItem: {
    ...textStyles.caption,
    color: colors.neutralGray,
    marginBottom: spacing.xs,
  },
  actionSection: {
    padding: spacing.lg,
    backgroundColor: colors.pureWhite,
    borderTopWidth: 1,
    borderTopColor: colors.cloudGray,
  },
  submitButton: {
    backgroundColor: colors.clarityBlue,
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  disabledButton: {
    backgroundColor: colors.neutralGray,
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submitButtonText: {
    ...textStyles.button,
    color: colors.pureWhite,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...textStyles.button,
    color: colors.neutralGray,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

export default QuickPaymentModal;
