import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAnalyticsSafe } from '../../hooks/useAnalyticsSafe';
import { spacing } from '../../constants/spacing';
import Card from '../../components/ui/Card';
import Icon from '../../components/ui/Icon';
import {
  Calculator,
  TrendingDown,
  PiggyBank,
  CreditCard,
  Home,
  DollarSign,
  BarChart3,
  Target,
} from 'lucide-react-native';

interface CalculatorItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  route: string;
}

const CalculatorsScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { track, events } = useAnalyticsSafe();

  const calculators: CalculatorItem[] = [
    {
      id: 'debt-repayment',
      title: t('calculators.debtRepayment.title', 'Debt Repayment'),
      description: t(
        'calculators.debtRepayment.description',
        'Calculate optimal payment strategies to pay off debt faster'
      ),
      icon: TrendingDown,
      color: theme.error,
      route: '/education/calculators/debt-repayment',
    },
    {
      id: 'budget',
      title: t('calculators.budget.title', 'Budget Calculator'),
      description: t(
        'calculators.budget.description',
        'Create a personalized budget based on your income and expenses'
      ),
      icon: BarChart3,
      color: theme.primary,
      route: '/education/calculators/budget',
    },
    {
      id: 'savings-goal',
      title: t('calculators.savingsGoal.title', 'Savings Goal'),
      description: t(
        'calculators.savingsGoal.description',
        'Plan how much to save monthly to reach your financial goals'
      ),
      icon: PiggyBank,
      color: theme.success,
      route: '/education/calculators/savings-goal',
    },
    {
      id: 'credit-utilization',
      title: t('calculators.creditUtilization.title', 'Credit Utilization'),
      description: t(
        'calculators.creditUtilization.description',
        'Calculate and optimize your credit card utilization ratio'
      ),
      icon: CreditCard,
      color: theme.secondary,
      route: '/education/calculators/credit-utilization',
    },
    {
      id: 'mortgage',
      title: t('calculators.mortgage.title', 'Mortgage Calculator'),
      description: t(
        'calculators.mortgage.description',
        'Estimate monthly payments and total interest for home loans'
      ),
      icon: Home,
      color: theme.warning,
      route: '/education/calculators/mortgage',
    },
    {
      id: 'compound-interest',
      title: t('calculators.compoundInterest.title', 'Compound Interest'),
      description: t(
        'calculators.compoundInterest.description',
        'See how your investments can grow over time with compound interest'
      ),
      icon: DollarSign,
      color: theme.info,
      route: '/education/calculators/compound-interest',
    },
  ];

  const handleCalculatorPress = (calculator: CalculatorItem) => {
    // Track calculator selection
    track(events.education.calculatorSelected, {
      calculator_id: calculator.id,
      calculator_title: calculator.title,
    });

    // Navigate to specific calculator
    router.push(calculator.route);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {t('calculators.title', 'Financial Calculators')}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {t(
            'calculators.description',
            'Use these interactive tools to make informed financial decisions'
          )}
        </Text>

        <View style={styles.calculatorGrid}>
          {calculators.map((calculator) => (
            <Card
              key={calculator.id}
              style={styles.calculatorCard}
              onPress={() => handleCalculatorPress(calculator)}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${calculator.color}20` },
                ]}
              >
                <Icon
                  name={calculator.icon}
                  size={32}
                  color={calculator.color}
                />
              </View>
              <Text
                style={[styles.calculatorTitle, { color: theme.textPrimary }]}
              >
                {calculator.title}
              </Text>
              <Text
                style={[
                  styles.calculatorDescription,
                  { color: theme.textSecondary },
                ]}
              >
                {calculator.description}
              </Text>
              <View style={styles.arrowContainer}>
                <Icon
                  name="arrow-right"
                  size={20}
                  color={theme.textSecondary}
                />
              </View>
            </Card>
          ))}
        </View>

        <Card style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Icon name={Target} size={24} color={theme.primary} />
            <Text style={[styles.tipTitle, { color: theme.textPrimary }]}>
              {t('calculators.tip.title', 'Pro Tip')}
            </Text>
          </View>
          <Text style={[styles.tipText, { color: theme.textSecondary }]}>
            {t(
              'calculators.tip.text',
              'Save your calculations to track your progress over time. Each calculator includes helpful tips and Canadian-specific information.'
            )}
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  description: {
    fontSize: 16,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  calculatorGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  calculatorCard: {
    position: 'relative',
    paddingBottom: spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  calculatorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  calculatorDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  arrowContainer: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
  },
  tipCard: {
    marginTop: spacing.lg,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default CalculatorsScreen;