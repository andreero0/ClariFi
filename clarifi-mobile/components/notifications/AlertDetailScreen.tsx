import React, { useState, useRef } from 'react';
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
import { useRouter } from 'expo-router';
import {
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Info,
  CreditCard,
  Target,
  CheckCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const { width } = Dimensions.get('window');

interface UtilizationComparisonProps {
  current: number;
  recommended: number;
  creditLimit: number;
}

const UtilizationComparison: React.FC<UtilizationComparisonProps> = ({
  current,
  recommended,
  creditLimit,
}) => {
  const getCurrentColor = (util: number) => {
    if (util >= 90) return colors.error;
    if (util >= 70) return colors.warning;
    if (util >= 30) return colors.clarityBlue;
    return colors.success;
  };

  const currentColor = getCurrentColor(current);
  const recommendedColor = getCurrentColor(recommended);

  return (
    <View style={styles.comparisonContainer}>
      <Text style={styles.comparisonTitle}>Utilization Comparison</Text>
      
      <View style={styles.comparisonBars}>
        {/* Current Utilization */}
        <View style={styles.barSection}>
          <View style={styles.barHeader}>
            <Text style={styles.barLabel}>Current</Text>
            <Text style={[styles.barValue, { color: currentColor }]}>
              {current}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${Math.min(current, 100)}%`,
                  backgroundColor: currentColor
                }
              ]} 
            />
          </View>
        </View>

        {/* Recommended Utilization */}
        <View style={styles.barSection}>
          <View style={styles.barHeader}>
            <Text style={styles.barLabel}>Recommended</Text>
            <Text style={[styles.barValue, { color: recommendedColor }]}>
              {recommended}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${Math.min(recommended, 100)}%`,
                  backgroundColor: recommendedColor
                }
              ]} 
            />
          </View>
        </View>
      </View>

      <View style={styles.comparisonInsight}>
        <Text style={styles.insightText}>
          {current > recommended 
            ? `Reduce utilization by ${(current - recommended).toFixed(1)}% to improve credit health`
            : 'Your utilization is within healthy limits'
          }
        </Text>
      </View>
    </View>
  );
};

interface CreditScoreImpactProps {
  utilizationChange: number;
  estimatedScoreChange: number;
}

const CreditScoreImpact: React.FC<CreditScoreImpactProps> = ({
  utilizationChange,
  estimatedScoreChange,
}) => {
  const isPositiveImpact = estimatedScoreChange > 0;

  return (
    <View style={styles.scoreImpactContainer}>
      <View style={styles.scoreHeader}>
        <Text style={styles.scoreTitle}>Credit Score Impact</Text>
        <TouchableOpacity style={styles.infoButton}>
          <Info size={16} color={colors.neutralGray} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.scoreContent}>
        <View style={styles.scoreChange}>
          {isPositiveImpact ? (
            <TrendingUp size={24} color={colors.success} />
          ) : (
            <TrendingDown size={24} color={colors.error} />
          )}
          <Text style={[
            styles.scoreChangeText,
            { color: isPositiveImpact ? colors.success : colors.error }
          ]}>
            {isPositiveImpact ? '+' : ''}{estimatedScoreChange} points
          </Text>
        </View>
        
        <Text style={styles.scoreDescription}>
          Estimated impact from {Math.abs(utilizationChange).toFixed(1)}% utilization change
        </Text>
      </View>
      
      <View style={styles.scoreFactors}>
        <Text style={styles.factorsTitle}>Key factors affecting your score:</Text>
        <View style={styles.factorsList}>
          <View style={styles.factor}>
            <View style={[styles.factorDot, { backgroundColor: colors.clarityBlue }]} />
            <Text style={styles.factorText}>Credit utilization (30% of score)</Text>
          </View>
          <View style={styles.factor}>
            <View style={[styles.factorDot, { backgroundColor: colors.wisdomPurple }]} />
            <Text style={styles.factorText}>Payment history (35% of score)</Text>
          </View>
          <View style={styles.factor}>
            <View style={[styles.factorDot, { backgroundColor: colors.growthGreen }]} />
            <Text style={styles.factorText}>Credit age (15% of score)</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

interface PaymentInstructionsProps {
  currentBalance: number;
  recommendedPayment: number;
  minimumPayment: number;
  dueDate: string;
}

const PaymentInstructions: React.FC<PaymentInstructionsProps> = ({
  currentBalance,
  recommendedPayment,
  minimumPayment,
  dueDate,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.instructionsContainer}>
      <Text style={styles.instructionsTitle}>Recommended Action</Text>
      
      <View style={styles.paymentCard}>
        <LinearGradient
          colors={[colors.clarityBlue, colors.skyTrust]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.paymentGradient}
        >
          <View style={styles.paymentHeader}>
            <DollarSign size={24} color={colors.pureWhite} />
            <Text style={styles.paymentTitle}>Make a Payment</Text>
          </View>
          
          <View style={styles.paymentAmounts}>
            <View style={styles.paymentOption}>
              <Text style={styles.paymentLabel}>Recommended</Text>
              <Text style={styles.paymentAmount}>
                {formatCurrency(recommendedPayment)}
              </Text>
            </View>
            
            <View style={styles.paymentOption}>
              <Text style={styles.paymentLabel}>Minimum</Text>
              <Text style={styles.paymentAmountSecondary}>
                {formatCurrency(minimumPayment)}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.stepsContainer}>
        <Text style={styles.stepsTitle}>Step-by-step instructions:</Text>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepText}>
            Open your banking app or visit your bank's website
          </Text>
        </View>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepText}>
            Navigate to "Pay Bills" or "Transfer Money"
          </Text>
        </View>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.stepText}>
            Select your credit card as the payee
          </Text>
        </View>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <Text style={styles.stepText}>
            Enter payment amount: {formatCurrency(recommendedPayment)}
          </Text>
        </View>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>5</Text>
          </View>
          <Text style={styles.stepText}>
            Schedule payment for {formatDate(dueDate)} or sooner
          </Text>
        </View>
      </View>
    </View>
  );
};

interface AlertDetailScreenProps {
  cardName: string;
  utilization: number;
  creditLimit: number;
  currentBalance: number;
  recommendedUtilization: number;
  dueDate: string;
  onClose: () => void;
  onTakeAction: () => void;
}

const AlertDetailScreen: React.FC<AlertDetailScreenProps> = ({
  cardName,
  utilization,
  creditLimit,
  currentBalance,
  recommendedUtilization = 30,
  dueDate,
  onClose,
  onTakeAction,
}) => {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [actionTaken, setActionTaken] = useState(false);

  const availableCredit = creditLimit - currentBalance;
  const recommendedPayment = Math.max(
    (currentBalance * (utilization - recommendedUtilization)) / 100,
    currentBalance * 0.1 // Minimum 10% of balance
  );
  const minimumPayment = currentBalance * 0.02; // Typical 2% minimum
  const utilizationChange = utilization - recommendedUtilization;
  const estimatedScoreChange = Math.min(Math.max(utilizationChange * -2, -50), 50);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleTakeAction = () => {
    setActionTaken(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setTimeout(() => {
      onTakeAction();
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={colors.midnightInk} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Utilization Alert</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Alert Summary */}
        <View style={styles.alertSummary}>
          <View style={styles.alertIcon}>
            <AlertTriangle size={32} color={colors.warning} />
          </View>
          <Text style={styles.alertTitle}>{cardName}</Text>
          <Text style={styles.alertSubtitle}>
            Current utilization: {utilization}% of {formatCurrency(creditLimit)}
          </Text>
          
          <View style={styles.alertStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(currentBalance)}</Text>
              <Text style={styles.statLabel}>Current Balance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(availableCredit)}</Text>
              <Text style={styles.statLabel}>Available Credit</Text>
            </View>
          </View>
        </View>

        {/* Utilization Comparison */}
        <UtilizationComparison
          current={utilization}
          recommended={recommendedUtilization}
          creditLimit={creditLimit}
        />

        {/* Credit Score Impact */}
        <CreditScoreImpact
          utilizationChange={utilizationChange}
          estimatedScoreChange={estimatedScoreChange}
        />

        {/* Payment Instructions */}
        <PaymentInstructions
          currentBalance={currentBalance}
          recommendedPayment={recommendedPayment}
          minimumPayment={minimumPayment}
          dueDate={dueDate}
        />

        {/* Key Dates Calendar */}
        <View style={styles.calendarContainer}>
          <Text style={styles.calendarTitle}>Important Dates</Text>
          
          <View style={styles.dateItem}>
            <Calendar size={20} color={colors.clarityBlue} />
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>Payment Due Date</Text>
              <Text style={styles.dateValue}>
                {new Date(dueDate).toLocaleDateString('en-CA')}
              </Text>
            </View>
          </View>
          
          <View style={styles.dateItem}>
            <Target size={20} color={colors.success} />
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>Recommended Payment By</Text>
              <Text style={styles.dateValue}>
                {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Sticky Action Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, actionTaken && styles.actionButtonSuccess]}
          onPress={handleTakeAction}
          disabled={actionTaken}
        >
          <Animated.View
            style={[
              styles.actionButtonContent,
              {
                transform: [{
                  scale: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.8],
                  }),
                }],
              },
            ]}
          >
            {actionTaken ? (
              <CheckCircle size={24} color={colors.pureWhite} />
            ) : (
              <DollarSign size={24} color={colors.pureWhite} />
            )}
            <Text style={styles.actionButtonText}>
              {actionTaken ? 'Action Taken!' : 'Take Action'}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.pureWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDivider,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cloudGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  alertSummary: {
    backgroundColor: colors.pureWhite,
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  alertIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.cloudGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  alertTitle: {
    ...textStyles.h2,
    color: colors.midnightInk,
    marginBottom: spacing.xs,
  },
  alertSubtitle: {
    ...textStyles.body,
    color: colors.neutralGray,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  alertStats: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...textStyles.h3,
    color: colors.clarityBlue,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
    textAlign: 'center',
  },
  comparisonContainer: {
    backgroundColor: colors.pureWhite,
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  comparisonTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginBottom: spacing.lg,
  },
  comparisonBars: {
    gap: spacing.lg,
  },
  barSection: {
    gap: spacing.sm,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabel: {
    ...textStyles.body,
    color: colors.neutralGray,
  },
  barValue: {
    ...textStyles.body,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.cloudGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  comparisonInsight: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.cloudGray,
    borderRadius: 12,
  },
  insightText: {
    ...textStyles.body,
    color: colors.midnightInk,
    textAlign: 'center',
  },
  scoreImpactContainer: {
    backgroundColor: colors.pureWhite,
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  scoreTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
  },
  infoButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreContent: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scoreChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  scoreChangeText: {
    ...textStyles.h2,
    fontWeight: '700',
  },
  scoreDescription: {
    ...textStyles.body,
    color: colors.neutralGray,
    textAlign: 'center',
  },
  scoreFactors: {
    marginTop: spacing.lg,
  },
  factorsTitle: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  factorsList: {
    gap: spacing.sm,
  },
  factor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  factorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  factorText: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  instructionsContainer: {
    backgroundColor: colors.pureWhite,
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  instructionsTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginBottom: spacing.lg,
  },
  paymentCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  paymentGradient: {
    padding: spacing.lg,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  paymentTitle: {
    ...textStyles.h3,
    color: colors.pureWhite,
  },
  paymentAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentOption: {
    alignItems: 'center',
  },
  paymentLabel: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  paymentAmount: {
    ...textStyles.h2,
    color: colors.pureWhite,
    fontWeight: '700',
  },
  paymentAmountSecondary: {
    ...textStyles.body,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  stepsContainer: {
    gap: spacing.md,
  },
  stepsTitle: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.clarityBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.pureWhite,
  },
  stepText: {
    ...textStyles.body,
    color: colors.neutralGray,
    flex: 1,
    lineHeight: 22,
  },
  calendarContainer: {
    backgroundColor: colors.pureWhite,
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginBottom: spacing.lg,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    ...textStyles.body,
    color: colors.neutralGray,
    marginBottom: 2,
  },
  dateValue: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 100, // Space for sticky button
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.pureWhite,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderDivider,
  },
  actionButton: {
    backgroundColor: colors.clarityBlue,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    shadowColor: colors.clarityBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonSuccess: {
    backgroundColor: colors.success,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  actionButtonText: {
    ...textStyles.button,
    color: colors.pureWhite,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AlertDetailScreen;