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
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import ProgressBar from '../../../components/ui/ProgressBar';
import {
  TrendingDown,
  Plus,
  Trash2,
  Info,
  Calculator,
  DollarSign,
  Calendar,
} from 'lucide-react-native';

interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
}

interface PayoffStrategy {
  method: 'avalanche' | 'snowball';
  totalInterest: number;
  payoffTime: number;
  order: string[];
}

const DebtRepaymentCalculator = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { track, events } = useAnalyticsSafe();

  const [debts, setDebts] = useState<Debt[]>([
    {
      id: '1',
      name: 'Credit Card 1',
      balance: 5000,
      interestRate: 19.99,
      minimumPayment: 150,
    },
  ]);
  const [extraPayment, setExtraPayment] = useState('100');
  const [selectedStrategy, setSelectedStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const [results, setResults] = useState<PayoffStrategy | null>(null);

  useEffect(() => {
    calculatePayoff();
  }, [debts, extraPayment, selectedStrategy]);

  const addDebt = () => {
    const newDebt: Debt = {
      id: Date.now().toString(),
      name: `Debt ${debts.length + 1}`,
      balance: 0,
      interestRate: 0,
      minimumPayment: 0,
    };
    setDebts([...debts, newDebt]);
  };

  const updateDebt = (id: string, field: keyof Debt, value: string) => {
    setDebts(
      debts.map((debt) =>
        debt.id === id
          ? { ...debt, [field]: field === 'name' ? value : parseFloat(value) || 0 }
          : debt
      )
    );
  };

  const removeDebt = (id: string) => {
    setDebts(debts.filter((debt) => debt.id !== id));
  };

  const calculatePayoff = () => {
    if (debts.length === 0 || debts.some((d) => d.balance <= 0)) {
      setResults(null);
      return;
    }

    const extra = parseFloat(extraPayment) || 0;
    const sortedDebts = [...debts];

    // Sort based on strategy
    if (selectedStrategy === 'avalanche') {
      sortedDebts.sort((a, b) => b.interestRate - a.interestRate);
    } else {
      sortedDebts.sort((a, b) => a.balance - b.balance);
    }

    // Simple calculation (simplified for demo)
    const totalBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);
    const averageRate = debts.reduce((sum, debt) => sum + debt.interestRate, 0) / debts.length;
    const totalMinPayments = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
    const totalPayment = totalMinPayments + extra;

    // Rough estimation
    const monthsToPayoff = Math.ceil(totalBalance / totalPayment);
    const estimatedInterest = (totalBalance * (averageRate / 100 / 12) * monthsToPayoff) / 2;

    setResults({
      method: selectedStrategy,
      totalInterest: estimatedInterest,
      payoffTime: monthsToPayoff,
      order: sortedDebts.map((d) => d.name),
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
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
            {t('calculators.debtRepayment.title', 'Debt Repayment Calculator')}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Debts List */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                {t('calculators.debtRepayment.yourDebts', 'Your Debts')}
              </Text>
              <TouchableOpacity onPress={addDebt}>
                <Icon name={Plus} size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {debts.map((debt) => (
              <View key={debt.id} style={styles.debtItem}>
                <View style={styles.debtHeader}>
                  <TextInput
                    style={[styles.debtNameInput, { color: theme.textPrimary }]}
                    value={debt.name}
                    onChangeText={(value) => updateDebt(debt.id, 'name', value)}
                    placeholder="Debt name"
                    placeholderTextColor={theme.textSecondary}
                  />
                  <TouchableOpacity onPress={() => removeDebt(debt.id)}>
                    <Icon name={Trash2} size={20} color={theme.error} />
                  </TouchableOpacity>
                </View>

                <View style={styles.debtFields}>
                  <View style={styles.fieldContainer}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                      Balance
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>
                        $
                      </Text>
                      <TextInput
                        style={[styles.fieldInput, { color: theme.textPrimary }]}
                        value={debt.balance.toString()}
                        onChangeText={(value) => updateDebt(debt.id, 'balance', value)}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={theme.textSecondary}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                      Interest Rate
                    </Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={[styles.fieldInput, { color: theme.textPrimary }]}
                        value={debt.interestRate.toString()}
                        onChangeText={(value) => updateDebt(debt.id, 'interestRate', value)}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={theme.textSecondary}
                      />
                      <Text style={[styles.percentSymbol, { color: theme.textSecondary }]}>
                        %
                      </Text>
                    </View>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                      Min Payment
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>
                        $
                      </Text>
                      <TextInput
                        style={[styles.fieldInput, { color: theme.textPrimary }]}
                        value={debt.minimumPayment.toString()}
                        onChangeText={(value) => updateDebt(debt.id, 'minimumPayment', value)}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={theme.textSecondary}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </Card>

          {/* Extra Payment */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {t('calculators.debtRepayment.extraPayment', 'Extra Monthly Payment')}
            </Text>
            <View style={styles.extraPaymentInput}>
              <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>
                $
              </Text>
              <TextInput
                style={[styles.largeInput, { color: theme.textPrimary }]}
                value={extraPayment}
                onChangeText={setExtraPayment}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </Card>

          {/* Strategy Selection */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {t('calculators.debtRepayment.strategy', 'Payoff Strategy')}
            </Text>
            <View style={styles.strategyButtons}>
              <TouchableOpacity
                style={[
                  styles.strategyButton,
                  selectedStrategy === 'avalanche' && styles.selectedStrategy,
                  { borderColor: selectedStrategy === 'avalanche' ? theme.primary : theme.borderLight },
                ]}
                onPress={() => setSelectedStrategy('avalanche')}
              >
                <Icon
                  name={TrendingDown}
                  size={24}
                  color={selectedStrategy === 'avalanche' ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.strategyName,
                    { color: selectedStrategy === 'avalanche' ? theme.primary : theme.textPrimary },
                  ]}
                >
                  Avalanche
                </Text>
                <Text style={[styles.strategyDesc, { color: theme.textSecondary }]}>
                  Pay highest interest first
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.strategyButton,
                  selectedStrategy === 'snowball' && styles.selectedStrategy,
                  { borderColor: selectedStrategy === 'snowball' ? theme.primary : theme.borderLight },
                ]}
                onPress={() => setSelectedStrategy('snowball')}
              >
                <Icon
                  name={TrendingDown}
                  size={24}
                  color={selectedStrategy === 'snowball' ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.strategyName,
                    { color: selectedStrategy === 'snowball' ? theme.primary : theme.textPrimary },
                  ]}
                >
                  Snowball
                </Text>
                <Text style={[styles.strategyDesc, { color: theme.textSecondary }]}>
                  Pay smallest balance first
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Results */}
          {results && (
            <Card style={[styles.section, styles.resultsCard]}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                {t('calculators.debtRepayment.results', 'Payoff Results')}
              </Text>

              <View style={styles.resultItem}>
                <View style={styles.resultIcon}>
                  <Icon name={Calendar} size={24} color={theme.primary} />
                </View>
                <View style={styles.resultContent}>
                  <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>
                    Time to pay off all debts
                  </Text>
                  <Text style={[styles.resultValue, { color: theme.textPrimary }]}>
                    {results.payoffTime} months
                  </Text>
                </View>
              </View>

              <View style={styles.resultItem}>
                <View style={styles.resultIcon}>
                  <Icon name={DollarSign} size={24} color={theme.error} />
                </View>
                <View style={styles.resultContent}>
                  <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>
                    Total interest paid
                  </Text>
                  <Text style={[styles.resultValue, { color: theme.textPrimary }]}>
                    {formatCurrency(results.totalInterest)}
                  </Text>
                </View>
              </View>

              <View style={styles.payoffOrder}>
                <Text style={[styles.orderTitle, { color: theme.textPrimary }]}>
                  Recommended payoff order:
                </Text>
                {results.order.map((debtName, index) => (
                  <View key={debtName} style={styles.orderItem}>
                    <View
                      style={[
                        styles.orderNumber,
                        { backgroundColor: theme.primary },
                      ]}
                    >
                      <Text style={styles.orderNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.orderName, { color: theme.textPrimary }]}>
                      {debtName}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Info Card */}
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name={Info} size={20} color={theme.info} />
              <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>
                How it works
              </Text>
            </View>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              The Avalanche method prioritizes paying off debts with the highest interest rates first, minimizing total interest paid. The Snowball method focuses on smallest balances first for psychological wins.
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  debtItem: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  debtNameInput: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: spacing.md,
  },
  debtFields: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fieldContainer: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    height: 40,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
  },
  currencySymbol: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  percentSymbol: {
    fontSize: 16,
    marginLeft: spacing.xs,
  },
  extraPaymentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  largeInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
  },
  strategyButtons: {
    gap: spacing.md,
  },
  strategyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 2,
    borderRadius: 12,
  },
  selectedStrategy: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  strategyName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
    flex: 1,
  },
  strategyDesc: {
    fontSize: 12,
  },
  resultsCard: {
    marginTop: spacing.xl,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  resultContent: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  payoffOrder: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  orderNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  orderName: {
    fontSize: 16,
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

export default DebtRepaymentCalculator;