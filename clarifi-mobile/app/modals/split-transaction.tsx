import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Transaction } from '../../services/storage/dataModels';
import { useTransactions } from '../../hooks/useTransactions';
import { formatCurrency } from '../../utils/formatting/currency';
import { CategorySelector } from '../../components/transactions/CategorySelector';

interface SplitItem {
  id: string;
  description: string;
  amount: number;
  category_id: string;
  category_name: string;
}

export default function SplitTransactionModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const transactionId = params.id as string;

  const { transactions, updateTransaction, addTransaction } = useTransactions();
  const [originalTransaction, setOriginalTransaction] =
    useState<Transaction | null>(null);
  const [splitItems, setSplitItems] = useState<SplitItem[]>([]);
  const [showCategorySelector, setShowCategorySelector] = useState<
    string | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (transactionId) {
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction) {
        setOriginalTransaction(transaction);
        // Initialize with the original transaction as first split
        setSplitItems([
          {
            id: '1',
            description: transaction.description,
            amount: transaction.amount,
            category_id: transaction.category_id,
            category_name: transaction.category_name || '',
          },
        ]);
      } else {
        Alert.alert('Error', 'Transaction not found');
        router.back();
      }
    }
  }, [transactionId, transactions]);

  const addSplitItem = () => {
    const newId = (splitItems.length + 1).toString();
    setSplitItems([
      ...splitItems,
      {
        id: newId,
        description: '',
        amount: 0,
        category_id: '',
        category_name: '',
      },
    ]);
  };

  const removeSplitItem = (id: string) => {
    if (splitItems.length <= 2) {
      Alert.alert('Error', 'You must have at least 2 split items');
      return;
    }
    setSplitItems(splitItems.filter(item => item.id !== id));
  };

  const updateSplitItem = (id: string, field: keyof SplitItem, value: any) => {
    setSplitItems(
      splitItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const getTotalAmount = () => {
    return splitItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const getRemainingAmount = () => {
    return originalTransaction
      ? originalTransaction.amount - getTotalAmount()
      : 0;
  };

  const validateSplit = (): boolean => {
    if (splitItems.length < 2) {
      Alert.alert('Error', 'You must split into at least 2 items');
      return false;
    }

    for (const item of splitItems) {
      if (!item.description.trim()) {
        Alert.alert('Error', 'All split items must have a description');
        return false;
      }
      if (item.amount <= 0) {
        Alert.alert('Error', 'All split items must have a positive amount');
        return false;
      }
      if (!item.category_id) {
        Alert.alert('Error', 'All split items must have a category');
        return false;
      }
    }

    const total = getTotalAmount();
    if (
      originalTransaction &&
      Math.abs(total - originalTransaction.amount) > 0.01
    ) {
      Alert.alert(
        'Amount Mismatch',
        `Split total (${formatCurrency(total)}) doesn't match original amount (${formatCurrency(originalTransaction.amount)})`
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateSplit() || !originalTransaction) return;

    setIsSaving(true);
    try {
      // Update the first split item to replace the original transaction
      const firstSplit = splitItems[0];
      await updateTransaction(originalTransaction.id, {
        ...originalTransaction,
        description: firstSplit.description,
        amount: firstSplit.amount,
        category_id: firstSplit.category_id,
        category_name: firstSplit.category_name,
        notes:
          `${originalTransaction.notes || ''}\n[Split from original: ${formatCurrency(originalTransaction.amount)}]`.trim(),
      });

      // Add the remaining split items as new transactions
      for (let i = 1; i < splitItems.length; i++) {
        const split = splitItems[i];
        await addTransaction({
          date: originalTransaction.date,
          description: split.description,
          amount: split.amount,
          category_id: split.category_id,
          category_name: split.category_name,
          merchant_name: originalTransaction.merchant_name,
          is_recurring: false,
          user_verified: true,
          statement_import_id: originalTransaction.statement_import_id,
          tags: originalTransaction.tags,
          notes: `[Split from: ${originalTransaction.description}]`,
        });
      }

      Alert.alert('Success', 'Transaction split successfully');
      router.back();
    } catch (error) {
      console.error('Failed to split transaction:', error);
      Alert.alert('Error', 'Failed to split transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategorySelect = (
    itemId: string,
    categoryId: string,
    categoryName: string
  ) => {
    updateSplitItem(itemId, 'category_id', categoryId);
    updateSplitItem(itemId, 'category_name', categoryName);
    setShowCategorySelector(null);
  };

  const distributEvenly = () => {
    if (!originalTransaction || splitItems.length === 0) return;

    const amountPerItem = originalTransaction.amount / splitItems.length;
    setSplitItems(splitItems.map(item => ({ ...item, amount: amountPerItem })));
  };

  const renderSplitItem = (item: SplitItem, index: number) => (
    <View key={item.id} style={styles.splitItemContainer}>
      <View style={styles.splitItemHeader}>
        <Text style={styles.splitItemTitle}>Split {index + 1}</Text>
        {splitItems.length > 2 && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeSplitItem(item.id)}
          >
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Description */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Description *</Text>
        <TextInput
          style={styles.textInput}
          value={item.description}
          onChangeText={text => updateSplitItem(item.id, 'description', text)}
          placeholder="Enter description"
          placeholderTextColor="#6c757d"
        />
      </View>

      {/* Amount */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Amount *</Text>
        <TextInput
          style={styles.textInput}
          value={item.amount.toString()}
          onChangeText={text => {
            const numericValue = parseFloat(text.replace(/[^0-9.-]/g, '')) || 0;
            updateSplitItem(item.id, 'amount', numericValue);
          }}
          placeholder="0.00"
          placeholderTextColor="#6c757d"
          keyboardType="numeric"
        />
      </View>

      {/* Category */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Category *</Text>
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => setShowCategorySelector(item.id)}
        >
          <Text style={styles.categoryButtonText}>
            {item.category_name || 'Select Category'}
          </Text>
          <Text style={styles.categoryArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!originalTransaction) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#2B5CE6" />
      </SafeAreaView>
    );
  }

  const remaining = getRemainingAmount();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Split Transaction</Text>

          <TouchableOpacity
            style={[styles.headerButton, styles.saveButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Original Transaction Info */}
          <View style={styles.originalTransactionContainer}>
            <Text style={styles.originalTransactionTitle}>
              Original Transaction
            </Text>
            <Text style={styles.originalTransactionDescription}>
              {originalTransaction.description}
            </Text>
            <Text style={styles.originalTransactionAmount}>
              {formatCurrency(originalTransaction.amount)}
            </Text>
          </View>

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Split:</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: remaining === 0 ? '#28a745' : '#dc3545' },
                ]}
              >
                {formatCurrency(getTotalAmount())}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remaining:</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: remaining === 0 ? '#28a745' : '#dc3545' },
                ]}
              >
                {formatCurrency(remaining)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={addSplitItem}
            >
              <Text style={styles.actionButtonText}>+ Add Split</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={distributEvenly}
            >
              <Text style={styles.actionButtonText}>Distribute Evenly</Text>
            </TouchableOpacity>
          </View>

          {/* Split Items */}
          {splitItems.map((item, index) => renderSplitItem(item, index))}
        </ScrollView>

        {/* Category Selector Modal */}
        {showCategorySelector && (
          <CategorySelector
            selectedCategoryId={
              splitItems.find(item => item.id === showCategorySelector)
                ?.category_id || ''
            }
            onCategorySelect={(categoryId, categoryName) =>
              handleCategorySelect(
                showCategorySelector,
                categoryId,
                categoryName
              )
            }
            onClose={() => setShowCategorySelector(null)}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  originalTransactionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2B5CE6',
  },
  originalTransactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
  },
  originalTransactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  originalTransactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2B5CE6',
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2B5CE6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  splitItemContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  splitItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  splitItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dc3545',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  categoryArrow: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: '300',
  },
});
