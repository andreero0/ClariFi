import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import { useAnalyticsSafe } from '../../../hooks/useAnalyticsSafe';
import { spacing } from '../../../constants/spacing';
import Card from '../../../components/ui/Card';
import Icon from '../../../components/ui/Icon';
import CircularProgress from '../../../components/charts/CircularProgress';
import {
  PiggyBank,
  Target,
  Calendar,
  DollarSign,
  TrendingUp,
  Info,
} from 'lucide-react-native';

const SavingsGoalCalculator = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { track, events } = useAnalyticsSafe();

  const [goalAmount, setGoalAmount] = useState('10000');
  const [currentSavings, setCurrentSavings] = useState('1000');
  const [monthlyContribution, setMonthlyContribution] = useState('500');
  const [interestRate, setInterestRate] = useState('2.5');
  const [timeframe, setTimeframe] = useState('24'); // months

  const [results, setResults] = useState({
    monthsToGoal: 0,
    totalContributions: 0,
    interestEarned: 0,
    finalAmount: 0,
    progressPercentage: 0,
  });

  useEffect(() => {
    calculateSavings();
  }, [goalAmount, currentSavings, monthlyContribution, interestRate, timeframe]);

  const calculateSavings = () => {
    const goal = parseFloat(goalAmount) || 0;
    const current = parseFloat(currentSavings) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const rate = parseFloat(interestRate) / 100 / 12; // Monthly rate
    const months = parseInt(timeframe) || 0;

    if (goal <= 0 || monthly <= 0) {
      setResults({
        monthsToGoal: 0,
        totalContributions: 0,
        interestEarned: 0,
        finalAmount: current,
        progressPercentage: goal > 0 ? (current / goal) * 100 : 0,
      });
      return;
    }

    // Calculate future value with compound interest
    let balance = current;
    let totalContributions = current;
    let monthsNeeded = 0;

    // Calculate how long to reach goal
    while (balance < goal && monthsNeeded < 600) { // Max 50 years
      balance = balance * (1 + rate) + monthly;
      totalContributions += monthly;
      monthsNeeded++;
    }

    // Calculate value at specified timeframe
    let projectedBalance = current;
    for (let i = 0; i < months; i++) {
      projectedBalance = projectedBalance * (1 + rate) + monthly;
    }

    const interestEarned = projectedBalance - current - (monthly * months);

    setResults({
      monthsToGoal: monthsNeeded,
      totalContributions: totalContributions,
      interestEarned: Math.max(0, interestEarned),
      finalAmount: projectedBalance,
      progressPercentage: Math.min(100, (projectedBalance / goal) * 100),
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatMonths = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${remainingMonths} months`;
    if (remainingMonths === 0) return `${years} years`;
    return `${years} years, ${remainingMonths} months`;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-left" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {t('calculators.savingsGoal.title', 'Savings Goal Calculator')}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Goal Information */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Your Savings Goal
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Goal Amount
              </Text>
              <View style={styles.largeInputWrapper}>
                <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>
                  $
                </Text>
                <TextInput
                  style={[styles.largeInput, { color: theme.textPrimary }]}
                  value={goalAmount}
                  onChangeText={setGoalAmount}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Current Savings
              </Text>
              <View style={styles.inputWrapper}>
                <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>
                  $
                </Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  value={currentSavings}
                  onChangeText={setCurrentSavings}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>
          </Card>

          {/* Contribution Details */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Contribution Details
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Monthly Contribution
              </Text>
              <View style={styles.inputWrapper}>
                <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>
                  $
                </Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  value={monthlyContribution}
                  onChangeText={setMonthlyContribution}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Interest Rate (Annual)
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary }]}
                    value={interestRate}
                    onChangeText={setInterestRate}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                  />
                  <Text style={[styles.percentSymbol, { color: theme.textSecondary }]}>
                    %
                  </Text>
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.md }]}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Time Frame
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary }]}
                    value={timeframe}
                    onChangeText={setTimeframe}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                  />
                  <Text style={[styles.unitText, { color: theme.textSecondary }]}>
                    mo
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Results */}
          <Card style={[styles.section, styles.resultsCard]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Savings Projection
            </Text>

            <View style={styles.progressContainer}>
              <CircularProgress
                progress={results.progressPercentage}
                size={160}
                strokeWidth={12}
                color={results.progressPercentage >= 100 ? theme.success : theme.primary}
              >
                <Icon 
                  name={PiggyBank} 
                  size={32} 
                  color={results.progressPercentage >= 100 ? theme.success : theme.primary} 
                />
                <Text style={[styles.progressText, { color: theme.textPrimary }]}>
                  {Math.round(results.progressPercentage)}%
                </Text>
                <Text style={[styles.progressSubtext, { color: theme.textSecondary }]}>
                  of goal
                </Text>
              </CircularProgress>
            </View>

            <View style={styles.resultItems}>
              <View style={styles.resultItem}>
                <Icon name={Calendar} size={20} color={theme.secondary} />
                <View style={styles.resultContent}>
                  <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>
                    Time to reach goal
                  </Text>
                  <Text style={[styles.resultValue, { color: theme.textPrimary }]}>
                    {formatMonths(results.monthsToGoal)}
                  </Text>
                </View>
              </View>

              <View style={styles.resultItem}>
                <Icon name={DollarSign} size={20} color={theme.primary} />
                <View style={styles.resultContent}>
                  <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>
                    Projected balance in {timeframe} months
                  </Text>
                  <Text style={[styles.resultValue, { color: theme.textPrimary }]}>
                    {formatCurrency(results.finalAmount)}
                  </Text>
                </View>
              </View>

              <View style={styles.resultItem}>
                <Icon name={TrendingUp} size={20} color={theme.success} />
                <View style={styles.resultContent}>
                  <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>
                    Interest earned
                  </Text>
                  <Text style={[styles.resultValue, { color: theme.textPrimary }]}>
                    {formatCurrency(results.interestEarned)}
                  </Text>
                </View>
              </View>
            </View>

            {results.progressPercentage >= 100 && (
              <View style={[styles.successMessage, { backgroundColor: theme.success + '20' }]}>
                <Icon name={Target} size={20} color={theme.success} />
                <Text style={[styles.successText, { color: theme.success }]}>
                  You'll reach your goal in {formatMonths(results.monthsToGoal)}!
                </Text>
              </View>
            )}
          </Card>

          {/* Tips */}
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name={Info} size={20} color={theme.info} />
              <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>
                Savings Tips
              </Text>
            </View>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              • Consider setting up automatic transfers to your savings account{'\n'}
              • Look for high-interest savings accounts or TFSAs in Canada{'\n'}
              • Review and adjust your contributions quarterly{'\n'}
              • Track your progress regularly to stay motivated
            </Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    height: 48,
  },
  largeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 64,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  largeInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '600',
  },
  currencySymbol: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  percentSymbol: {
    fontSize: 16,
    marginLeft: spacing.xs,
  },
  unitText: {
    fontSize: 14,
    marginLeft: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
  },
  resultsCard: {
    marginTop: spacing.xl,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  progressText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  progressSubtext: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  resultItems: {
    gap: spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resultContent: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  infoCard: {
    marginTop: spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SavingsGoalCalculator;