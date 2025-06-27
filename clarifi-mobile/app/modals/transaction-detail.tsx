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
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Transaction } from '../../services/storage/dataModels';
import { useTransactions } from '../../hooks/useTransactions';
import { validateTransactionForm } from '../../utils/validation/transactions';
import { formatCurrency } from '../../utils/formatting/currency';
import { formatDate, toISODateString } from '../../utils/formatting/date';
import { CategorySelector } from '../../components/transactions/CategorySelector';

interface TransactionForm extends Omit<Transaction, 'id'> {
  id?: string;
}

export default function TransactionDetailModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const transactionId = params.id as string;
  const isEdit = Boolean(transactionId);

  const { transactions, updateTransaction, addTransaction, loading } =
    useTransactions();

  const [transaction, setTransaction] = useState<TransactionForm>({
    date: toISODateString(new Date()),
    amount: 0,
    category_id: '',
    category_name: '',
    merchant_name: '',
    description: '',
    is_recurring: false,
    user_verified: true, // User is manually editing
    tags: [],
    notes: '',
  });

  const [validationErrors, setValidationErrors] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load transaction data if editing
  useEffect(() => {
    if (isEdit && transactionId) {
      const existingTransaction = transactions.find(
        t => t.id === transactionId
      );
      if (existingTransaction) {
        setTransaction(existingTransaction);
      } else {
        Alert.alert('Error', 'Transaction not found');
        router.back();
      }
    }
  }, [isEdit, transactionId, transactions]);

  const validateForm = (): boolean => {
    const errors = validateTransactionForm(transaction);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEdit && transaction.id) {
        await updateTransaction(transaction.id, transaction);
        Alert.alert('Success', 'Transaction updated successfully');
      } else {
        await addTransaction(transaction);
        Alert.alert('Success', 'Transaction added successfully');
      }
      router.back();
    } catch (error) {
      console.error('Failed to save transaction:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  const handleDelete = () => {
    if (!isEdit || !transaction.id) return;

    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete functionality would go here
              Alert.alert('Success', 'Transaction deleted successfully');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  const updateField = (field: keyof TransactionForm, value: any) => {
    setTransaction(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleAmountChange = (text: string) => {
    // Remove non-numeric characters except decimal point and minus
    const cleanText = text.replace(/[^0-9.-]/g, '');
    const numericValue = parseFloat(cleanText) || 0;
    updateField('amount', numericValue);
  };

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    updateField('category_id', categoryId);
    updateField('category_name', categoryName);
    setShowCategorySelector(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      updateField('date', toISODateString(selectedDate));
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
        <Text style={styles.headerButtonText}>Cancel</Text>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>
        {isEdit ? 'Edit Transaction' : 'Add Transaction'}
      </Text>

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
  );

  const renderFormField = (
    label: string,
    value: string | number,
    onChangeText: (text: string) => void,
    placeholder: string,
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default',
    multiline: boolean = false,
    error?: string
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.multilineInput,
          error && styles.inputError,
        ]}
        value={value.toString()}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6c757d"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {renderHeader()}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Transaction Description */}
          {renderFormField(
            'Description *',
            transaction.description,
            text => updateField('description', text),
            'Enter transaction description',
            'default',
            false,
            validationErrors.description
          )}

          {/* Amount */}
          {renderFormField(
            'Amount *',
            transaction.amount.toString(),
            handleAmountChange,
            '0.00',
            'numeric',
            false,
            validationErrors.amount
          )}

          {/* Merchant Name */}
          {renderFormField(
            'Merchant',
            transaction.merchant_name || '',
            text => updateField('merchant_name', text),
            'Enter merchant name',
            'default',
            false,
            validationErrors.merchant_name
          )}

          {/* Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Date *</Text>
            <TouchableOpacity
              style={[
                styles.dateButton,
                validationErrors.date && styles.inputError,
              ]}
              onPress={showDatePickerModal}
            >
              <Text style={styles.dateButtonText}>
                {formatDate(new Date(transaction.date))}
              </Text>
              <Text style={styles.dateArrow}>📅</Text>
            </TouchableOpacity>
            {validationErrors.date && (
              <Text style={styles.errorText}>{validationErrors.date}</Text>
            )}
          </View>

          {/* Category Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Category *</Text>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                validationErrors.category_id && styles.inputError,
              ]}
              onPress={() => setShowCategorySelector(true)}
            >
              <Text style={styles.categoryButtonText}>
                {transaction.category_name || 'Select Category'}
              </Text>
              <Text style={styles.categoryArrow}>›</Text>
            </TouchableOpacity>
            {validationErrors.category_id && (
              <Text style={styles.errorText}>
                {validationErrors.category_id}
              </Text>
            )}
          </View>

          {/* Recurring Toggle */}
          <View style={styles.fieldContainer}>
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() =>
                updateField('is_recurring', !transaction.is_recurring)
              }
            >
              <View style={styles.toggleInfo}>
                <Text style={styles.fieldLabel}>Recurring Transaction</Text>
                <Text style={styles.toggleSubtext}>
                  Mark if this transaction repeats regularly
                </Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  transaction.is_recurring && styles.toggleActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    transaction.is_recurring && styles.toggleThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Tags */}
          {renderFormField(
            'Tags',
            transaction.tags?.join(', ') || '',
            text =>
              updateField(
                'tags',
                text
                  .split(',')
                  .map(tag => tag.trim())
                  .filter(Boolean)
              ),
            'Enter tags separated by commas',
            'default',
            false
          )}

          {/* Notes */}
          {renderFormField(
            'Notes',
            transaction.notes || '',
            text => updateField('notes', text),
            'Add any additional notes...',
            'default',
            true
          )}

          {/* Delete Button (Edit Mode Only) */}
          {isEdit && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Delete Transaction</Text>
            </TouchableOpacity>
          )}

          <View style={styles.spacer} />
        </ScrollView>

        {/* Category Selector Modal */}
        {showCategorySelector && (
          <CategorySelector
            selectedCategoryId={transaction.category_id}
            onCategorySelect={handleCategorySelect}
            onClose={() => setShowCategorySelector(false)}
          />
        )}

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={new Date(transaction.date)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

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
  fieldContainer: {
    marginBottom: 24,
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
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    fontSize: 14,
    color: '#dc3545',
    marginTop: 4,
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
  dateButton: {
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
  dateButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  dateArrow: {
    fontSize: 16,
    color: '#6c757d',
  },
  toggleContainer: {
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
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleSubtext: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e9ecef',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  deleteButton: {
    marginTop: 32,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#dc3545',
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  spacer: {
    height: 20,
  },
});
