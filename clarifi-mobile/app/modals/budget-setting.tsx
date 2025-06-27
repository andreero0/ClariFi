import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { formatCurrency } from '../../utils/formatting/currency';
import { spacing } from '../../constants/spacing';

const budgetColors = {
  primary: '#2B5CE6',
  primaryLight: '#4B7BF5',
  success: '#00C896',
  warning: '#FECA57',
  error: '#FF4757',
  surface: '#FFFFFF',
  background: '#FAFBFD',
  textPrimary: '#1A1F36',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
};

interface BudgetCategory {
  id: string;
  name: string;
  currentSpending: number;
  suggestedBudget: number;
  userBudget: number;
  color: string;
  icon: any;
}

const mockCategories: BudgetCategory[] = [
  {
    id: 'food',
    name: 'Food & Dining',
    currentSpending: 847.32,
    suggestedBudget: 900,
    userBudget: 900,
    color: '#FF6B6B',
    icon: '🍽️',
  },
  {
    id: 'transport',
    name: 'Transportation',
    currentSpending: 425.18,
    suggestedBudget: 500,
    userBudget: 500,
    color: '#4ECDC4',
    icon: '🚗',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    currentSpending: 723.91,
    suggestedBudget: 600,
    userBudget: 600,
    color: '#45B7D1',
    icon: '🛍️',
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    currentSpending: 494.46,
    suggestedBudget: 400,
    userBudget: 400,
    color: '#96CEB4',
    icon: '🎮',
  },
  {
    id: 'bills',
    name: 'Bills & Utilities',
    currentSpending: 356.78,
    suggestedBudget: 400,
    userBudget: 400,
    color: '#FECA57',
    icon: '⚡',
  },
];

export default function BudgetSettingModal() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const [categories, setCategories] = useState(mockCategories);
  const [hasChanges, setHasChanges] = useState(false);
  const [totalBudget, setTotalBudget] = useState(
    categories.reduce((sum, cat) => sum + cat.userBudget, 0)
  );
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const updateCategoryBudget = (categoryId: string, newBudget: number) => {
    const updatedCategories = categories.map(cat =>
      cat.id === categoryId ? { ...cat, userBudget: newBudget } : cat
    );
    setCategories(updatedCategories);
    setTotalBudget(updatedCategories.reduce((sum, cat) => sum + cat.userBudget, 0));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Simulate saving budgets
    Alert.alert(
      'Budget Saved',
      'Your budget settings have been saved successfully!',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const resetToSuggested = () => {
    Alert.alert(
      'Reset to AI Suggestions',
      'This will reset all budgets to our AI-recommended amounts. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            const resetCategories = categories.map(cat => ({
              ...cat,
              userBudget: cat.suggestedBudget,
            }));
            setCategories(resetCategories);
            setTotalBudget(resetCategories.reduce((sum, cat) => sum + cat.userBudget, 0));
            setHasChanges(true);
          },
        },
      ]
    );
  };

  const renderCategoryBudgetSetting = (category: BudgetCategory) => {
    const utilizationPercent = (category.currentSpending / category.userBudget) * 100;
    const isOverBudget = utilizationPercent > 100;
    const isWarning = utilizationPercent > 80;

    return (
      <View key={category.id} style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryInfo}>
            <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' }]}>
              <Text style={styles.categoryEmoji}>{category.icon}</Text>
            </View>
            <View style={styles.categoryText}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categorySpending}>
                {formatCurrency(category.currentSpending)} spent this month
              </Text>
            </View>
          </View>
          <View style={styles.categoryStatus}>
            {isOverBudget ? (
              <AlertCircle size={20} color={budgetColors.error} />
            ) : isWarning ? (
              <TrendingUp size={20} color={budgetColors.warning} />
            ) : (
              <CheckCircle size={20} color={budgetColors.success} />
            )}
          </View>
        </View>

        <View style={styles.budgetSliderContainer}>
          <View style={styles.budgetInputRow}>
            <Text style={styles.budgetLabel}>Monthly Budget</Text>
            <View style={styles.budgetInputContainer}>
              <DollarSign size={16} color={budgetColors.textSecondary} />
              <TextInput
                style={styles.budgetInput}
                value={category.userBudget.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text) || 0;
                  updateCategoryBudget(category.id, value);
                }}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={category.suggestedBudget * 2}
            value={category.userBudget}
            onValueChange={(value) => updateCategoryBudget(category.id, Math.round(value))}
            step={25}
            minimumTrackTintColor={category.color}
            maximumTrackTintColor={budgetColors.borderLight}
            thumbTintColor={category.color}
          />

          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>$0</Text>
            <Text style={styles.sliderLabel}>{formatCurrency(category.suggestedBudget * 2)}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(utilizationPercent, 100)}%`,
                  backgroundColor: isOverBudget ? budgetColors.error : isWarning ? budgetColors.warning : budgetColors.success,
                },
              ]}
            />
          </View>
          <Text style={[
            styles.utilizationText,
            { color: isOverBudget ? budgetColors.error : budgetColors.textSecondary }
          ]}>
            {utilizationPercent.toFixed(1)}% utilized
            {isOverBudget && ` (${formatCurrency(category.currentSpending - category.userBudget)} over)`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.suggestionButton}
          onPress={() => updateCategoryBudget(category.id, category.suggestedBudget)}
        >
          <Text style={styles.suggestionText}>
            💡 AI suggests {formatCurrency(category.suggestedBudget)} based on your history
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.modal,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Set Your Budgets</Text>
            <Text style={styles.headerSubtitle}>
              Total Budget: {formatCurrency(totalBudget)}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={budgetColors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Budgets</Text>
            <Text style={styles.sectionDescription}>
              Set monthly spending limits for each category. Our AI analyzes your spending patterns to suggest optimal amounts.
            </Text>
          </View>

          {categories.map(renderCategoryBudgetSetting)}

          <View style={styles.totalSummary}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Monthly Budget</Text>
              <Text style={styles.totalAmount}>{formatCurrency(totalBudget)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Current Spending</Text>
              <Text style={styles.totalSpending}>
                {formatCurrency(categories.reduce((sum, cat) => sum + cat.currentSpending, 0))}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={resetToSuggested} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Reset to AI Suggestions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.primaryButton, !hasChanges && styles.disabledButton]}
            disabled={!hasChanges}
          >
            <Text style={[styles.primaryButtonText, !hasChanges && styles.disabledButtonText]}>
              Save Changes
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: budgetColors.surface,
    borderRadius: 20,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: budgetColors.borderLight,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: budgetColors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: budgetColors.textSecondary,
    fontWeight: '500',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: budgetColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: budgetColors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: 14,
    color: budgetColors.textSecondary,
    lineHeight: 20,
  },
  categoryCard: {
    backgroundColor: budgetColors.background,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: budgetColors.borderLight,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryText: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: budgetColors.textPrimary,
  },
  categorySpending: {
    fontSize: 14,
    color: budgetColors.textSecondary,
    marginTop: 2,
  },
  categoryStatus: {
    marginLeft: spacing.md,
  },
  budgetSliderContainer: {
    marginBottom: spacing.lg,
  },
  budgetInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  budgetLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: budgetColors.textPrimary,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: budgetColors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: budgetColors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  budgetInput: {
    fontSize: 16,
    fontWeight: '600',
    color: budgetColors.textPrimary,
    marginLeft: spacing.xs,
    minWidth: 60,
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: budgetColors.textSecondary,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: budgetColors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  utilizationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionButton: {
    backgroundColor: budgetColors.primaryLight + '20',
    borderRadius: 8,
    padding: spacing.md,
  },
  suggestionText: {
    fontSize: 14,
    color: budgetColors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  totalSummary: {
    backgroundColor: budgetColors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: budgetColors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: budgetColors.textPrimary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: budgetColors.primary,
  },
  totalSpending: {
    fontSize: 16,
    fontWeight: '600',
    color: budgetColors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: budgetColors.borderLight,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: budgetColors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: budgetColors.surface,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: budgetColors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: budgetColors.textPrimary,
  },
  disabledButton: {
    backgroundColor: budgetColors.borderLight,
  },
  disabledButtonText: {
    color: budgetColors.textSecondary,
  },
});