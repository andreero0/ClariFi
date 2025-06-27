import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Target,
  Plus,
  Edit3,
  Calendar,
  DollarSign,
  Settings,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Zap,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  description: string;
}

interface CategoryData {
  id: string;
  name: string;
  amount: number;
  budget: number;
  icon: any;
  color: string;
  transactions: Transaction[];
  monthlyTrend: Array<{ month: string; amount: number }>;
}

const getCategoryIcon = (categoryName: string) => {
  const iconMap: { [key: string]: any } = {
    'Food & Dining': Utensils,
    'Transportation': Car,
    'Shopping': ShoppingBag,
    'Bills & Utilities': Home,
    'Entertainment': Zap,
    'Other': DollarSign,
  };
  return iconMap[categoryName] || DollarSign;
};

const mockCategoryData: { [key: string]: CategoryData } = {
  'food-dining': {
    id: 'food-dining',
    name: 'Food & Dining',
    amount: 875,
    budget: 800,
    icon: Utensils,
    color: colors.error,
    transactions: [
      { id: '1', merchant: 'Loblaws', amount: 127.50, date: '2024-11-15', description: 'Grocery Shopping' },
      { id: '2', merchant: 'Tim Hortons', amount: 8.75, date: '2024-11-14', description: 'Coffee & Donut' },
      { id: '3', merchant: 'Metro', amount: 89.20, date: '2024-11-13', description: 'Weekly Groceries' },
      { id: '4', merchant: 'Boston Pizza', amount: 45.60, date: '2024-11-12', description: 'Dinner' },
      { id: '5', merchant: 'Starbucks', amount: 6.25, date: '2024-11-11', description: 'Latte' },
    ],
    monthlyTrend: [
      { month: 'Aug', amount: 720 },
      { month: 'Sep', amount: 810 },
      { month: 'Oct', amount: 765 },
      { month: 'Nov', amount: 875 },
    ],
  },
  'transportation': {
    id: 'transportation',
    name: 'Transportation',
    amount: 450,
    budget: 500,
    icon: Car,
    color: colors.warning,
    transactions: [
      { id: '1', merchant: 'Petro-Canada', amount: 65.40, date: '2024-11-15', description: 'Gas Fill-up' },
      { id: '2', merchant: 'TTC', amount: 156.00, date: '2024-11-01', description: 'Monthly Pass' },
      { id: '3', merchant: 'Uber', amount: 23.75, date: '2024-11-10', description: 'Airport Trip' },
    ],
    monthlyTrend: [
      { month: 'Aug', amount: 380 },
      { month: 'Sep', amount: 420 },
      { month: 'Oct', amount: 395 },
      { month: 'Nov', amount: 450 },
    ],
  },
};

const BudgetSettingModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  category: CategoryData;
  onSave: (amount: number, alertAt80: boolean) => void;
}> = ({ visible, onClose, category, onSave }) => {
  const [budgetAmount, setBudgetAmount] = useState(category.budget.toString());
  const [alertAt80, setAlertAt80] = useState(true);
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSave = () => {
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid budget amount.');
      return;
    }
    onSave(amount, alertAt80);
    onClose();
  };

  const suggestedAmount = Math.round(category.amount * 1.1); // 10% more than current spending

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.modalBackground}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.budgetModal,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Set {category.name} Budget</Text>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                keyboardType="numeric"
                placeholder="0"
                autoFocus
              />
            </View>

            <View style={styles.suggestionContainer}>
              <Text style={styles.suggestionText}>
                Based on your history, we suggest ${suggestedAmount}
              </Text>
              <TouchableOpacity
                style={styles.useSuggestionButton}
                onPress={() => setBudgetAmount(suggestedAmount.toString())}
              >
                <Text style={styles.useSuggestionText}>Use Suggestion</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.alertToggle}
              onPress={() => setAlertAt80(!alertAt80)}
            >
              <View style={styles.alertToggleContent}>
                <Text style={styles.alertToggleText}>Alert me at 80%</Text>
                <View style={[styles.toggle, alertAt80 && styles.toggleActive]}>
                  {alertAt80 && <View style={styles.toggleDot} />}
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Budget</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [categoryData, setCategoryData] = useState<CategoryData | null>(
    mockCategoryData[id || ''] || null
  );

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (categoryData) {
      const budgetUsage = Math.min((categoryData.amount / categoryData.budget) * 100, 100);
      Animated.timing(progressAnim, {
        toValue: budgetUsage,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [categoryData]);

  if (!categoryData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Category not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isOverBudget = categoryData.amount > categoryData.budget;
  const budgetUsagePercent = Math.min((categoryData.amount / categoryData.budget) * 100, 100);
  const trend = categoryData.monthlyTrend;
  const currentMonth = trend[trend.length - 1];
  const previousMonth = trend[trend.length - 2];
  const trendChange = ((currentMonth.amount - previousMonth.amount) / previousMonth.amount) * 100;
  const isIncreasing = trendChange > 0;

  const IconComponent = categoryData.icon;

  const handleBudgetSave = (amount: number, alertAt80: boolean) => {
    setCategoryData(prev => prev ? { ...prev, budget: amount } : null);
    console.log('Budget saved:', { amount, alertAt80 });
  };

  const handleAddTransaction = () => {
    console.log('Add manual transaction for', categoryData.name);
    // Navigate to add transaction screen
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.midnightInk} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryData.name}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={24} color={colors.neutral.medium} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.categoryIconLarge, { backgroundColor: categoryData.color + '15' }]}>
            <IconComponent size={48} color={categoryData.color} />
          </View>
          
          <View style={styles.heroContent}>
            <Text style={styles.currentAmount}>${categoryData.amount.toLocaleString()}</Text>
            <View style={styles.trendIndicator}>
              {isIncreasing ? (
                <TrendingUp size={16} color={colors.error} />
              ) : (
                <TrendingDown size={16} color={colors.success} />
              )}
              <Text style={[
                styles.trendText,
                { color: isIncreasing ? colors.error : colors.success }
              ]}>
                {Math.abs(trendChange).toFixed(1)}% vs last month
              </Text>
            </View>
          </View>
        </View>

        {/* Budget Progress */}
        <View style={styles.budgetSection}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetTitle}>Budget Usage</Text>
            <TouchableOpacity
              style={styles.editBudgetButton}
              onPress={() => setBudgetModalVisible(true)}
            >
              <Edit3 size={16} color={colors.clarityBlue} />
              <Text style={styles.editBudgetText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: isOverBudget ? colors.error : categoryData.color,
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.budgetUsageText}>
              ${categoryData.amount.toLocaleString()} of ${categoryData.budget.toLocaleString()} 
              ({budgetUsagePercent.toFixed(0)}%)
            </Text>
          </View>

          {isOverBudget && (
            <View style={styles.warningContainer}>
              <AlertTriangle size={16} color={colors.error} />
              <Text style={styles.warningText}>
                ${(categoryData.amount - categoryData.budget).toLocaleString()} over budget
              </Text>
            </View>
          )}
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
              <Plus size={16} color={colors.clarityBlue} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsList}>
            {categoryData.transactions.map((transaction, index) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionMain}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.merchantName}>{transaction.merchant}</Text>
                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={styles.transactionAmount}>
                      ${transaction.amount.toFixed(2)}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Monthly Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Trend</Text>
          <View style={styles.trendChart}>
            {categoryData.monthlyTrend.map((month, index) => {
              const maxAmount = Math.max(...categoryData.monthlyTrend.map(m => m.amount));
              const height = (month.amount / maxAmount) * 80;
              const isCurrentMonth = index === categoryData.monthlyTrend.length - 1;
              
              return (
                <View key={month.month} style={styles.trendBar}>
                  <View
                    style={[
                      styles.trendBarFill,
                      {
                        height: height,
                        backgroundColor: isCurrentMonth ? categoryData.color : colors.neutral.light,
                      },
                    ]}
                  />
                  <Text style={styles.trendMonth}>{month.month}</Text>
                  <Text style={styles.trendAmount}>${month.amount}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddTransaction}>
        <Plus size={24} color={colors.pureWhite} />
      </TouchableOpacity>

      {/* Budget Setting Modal */}
      <BudgetSettingModal
        visible={budgetModalVisible}
        onClose={() => setBudgetModalVisible(false)}
        category={categoryData}
        onSave={handleBudgetSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.pureWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cloudGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.midnightInk,
    letterSpacing: -0.25,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: colors.pureWhite,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.light,
  },
  categoryIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroContent: {
    alignItems: 'center',
  },
  currentAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.midnightInk,
    letterSpacing: -1,
    marginBottom: 8,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  budgetSection: {
    backgroundColor: colors.pureWhite,
    padding: 24,
    marginTop: 8,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.midnightInk,
  },
  editBudgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.clarityBlue + '15',
    borderRadius: 16,
  },
  editBudgetText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.clarityBlue,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 12,
    backgroundColor: colors.neutral.light,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  budgetUsageText: {
    fontSize: 14,
    color: colors.neutral.medium,
    textAlign: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.errorBackground,
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
  section: {
    backgroundColor: colors.pureWhite,
    padding: 24,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.midnightInk,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.clarityBlue + '15',
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.clarityBlue,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.light,
  },
  transactionMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.midnightInk,
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 14,
    color: colors.neutral.medium,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.midnightInk,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.neutral.medium,
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
    paddingTop: 20,
  },
  trendBar: {
    alignItems: 'center',
    flex: 1,
  },
  trendBarFill: {
    width: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  trendMonth: {
    fontSize: 12,
    color: colors.neutral.medium,
    marginBottom: 2,
  },
  trendAmount: {
    fontSize: 10,
    color: colors.neutral.medium,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.clarityBlue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.clarityBlue,
    fontWeight: '500',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  budgetModal: {
    backgroundColor: colors.pureWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.light,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.midnightInk,
    textAlign: 'center',
  },
  modalContent: {
    padding: 24,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.neutral.medium,
    marginRight: 8,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.midnightInk,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.clarityBlue,
    paddingBottom: 8,
    minWidth: 200,
  },
  suggestionContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.neutral.medium,
    marginBottom: 8,
  },
  useSuggestionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.clarityBlue + '15',
    borderRadius: 16,
  },
  useSuggestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.clarityBlue,
  },
  alertToggle: {
    marginBottom: 24,
  },
  alertToggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  alertToggleText: {
    fontSize: 16,
    color: colors.midnightInk,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.neutral.light,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 3,
  },
  toggleActive: {
    backgroundColor: colors.clarityBlue,
    alignItems: 'flex-start',
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.pureWhite,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.light,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.neutral.medium,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.clarityBlue,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.pureWhite,
  },
});