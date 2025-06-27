import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCreditCards } from '../../hooks/useCreditCards';
import {
  PaymentFormData,
  PaymentType,
  formatCreditLimit,
} from '../../types/creditCard';

const PAYMENT_TYPES: {
  key: PaymentType;
  label: string;
  description: string;
}[] = [
  {
    key: 'minimum',
    label: 'Minimum Payment',
    description: 'Pay the minimum required amount',
  },
  {
    key: 'statement-balance',
    label: 'Statement Balance',
    description: 'Pay the full statement balance',
  },
  {
    key: 'full-balance',
    label: 'Full Current Balance',
    description: 'Pay the entire current balance',
  },
  {
    key: 'custom',
    label: 'Custom Amount',
    description: 'Enter a specific payment amount',
  },
];

export default function PaymentFormModal() {
  const router = useRouter();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const { cards, addPayment } = useCreditCards();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
    type: 'minimum',
    description: '',
    confirmationNumber: '',
  });

  const [errors, setErrors] = useState<string[]>([]);

  const card = cards?.find(c => c.id === cardId);

  useEffect(() => {
    if (!card) {
      router.back();
      return;
    }

    // Set default amount based on payment type
    updatePaymentAmount(formData.type);
  }, [card]);

  const updatePaymentAmount = (paymentType: PaymentType) => {
    if (!card) return;

    let defaultAmount = '';

    switch (paymentType) {
      case 'minimum':
        defaultAmount = card.minimumPayment.toString();
        break;
      case 'statement-balance':
        // For demo purposes, assume statement balance is 80% of current balance
        defaultAmount = (card.currentBalance * 0.8).toFixed(2);
        break;
      case 'full-balance':
        defaultAmount = card.currentBalance.toString();
        break;
      case 'custom':
        defaultAmount = '';
        break;
      default:
        defaultAmount = '';
    }

    setFormData(prev => ({
      ...prev,
      type: paymentType,
      amount: defaultAmount,
    }));
  };

  const updateFormField = (field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = (): string[] => {
    const validationErrors: string[] = [];

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      validationErrors.push('Payment amount must be greater than 0');
    }

    if (card && parseFloat(formData.amount) > card.currentBalance) {
      validationErrors.push('Payment amount cannot exceed current balance');
    }

    if (!formData.paymentDate) {
      validationErrors.push('Payment date is required');
    }

    const paymentDate = new Date(formData.paymentDate);
    const today = new Date();
    const maxFutureDate = new Date();
    maxFutureDate.setDate(today.getDate() + 30); // Max 30 days in future

    if (paymentDate > maxFutureDate) {
      validationErrors.push(
        'Payment date cannot be more than 30 days in the future'
      );
    }

    return validationErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!card) {
      Alert.alert('Error', 'Card not found');
      return;
    }

    setLoading(true);

    try {
      const paymentData = {
        cardId: card.id,
        amount: parseFloat(formData.amount),
        paymentDate: new Date(formData.paymentDate).toISOString(),
        type: formData.type,
        description: formData.description.trim() || undefined,
        confirmationNumber: formData.confirmationNumber.trim() || undefined,
      };

      await addPayment(paymentData);

      Alert.alert(
        'Payment Recorded',
        `Payment of ${formatCreditLimit(parseFloat(formData.amount))} has been recorded for ${card.name}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error recording payment:', error);
      Alert.alert('Error', 'Failed to record payment. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (text: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = text.replace(/[^0-9.]/g, '');
    return numericValue;
  };

  const renderPaymentTypeSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payment Type</Text>

      {PAYMENT_TYPES.map(type => (
        <TouchableOpacity
          key={type.key}
          style={[
            styles.paymentTypeOption,
            formData.type === type.key && styles.selectedPaymentType,
          ]}
          onPress={() => updatePaymentAmount(type.key)}
        >
          <View style={styles.paymentTypeContent}>
            <Text
              style={[
                styles.paymentTypeLabel,
                formData.type === type.key && styles.selectedPaymentTypeText,
              ]}
            >
              {type.label}
            </Text>
            <Text
              style={[
                styles.paymentTypeDescription,
                formData.type === type.key &&
                  styles.selectedPaymentTypeDescription,
              ]}
            >
              {type.description}
            </Text>
          </View>

          {formData.type === type.key && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAmountSection = () => {
    if (!card) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Amount</Text>

        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>CAD $</Text>
          <TextInput
            style={[
              styles.amountInput,
              formData.type !== 'custom' && styles.disabledInput,
            ]}
            value={formData.amount}
            onChangeText={text =>
              updateFormField('amount', formatCurrency(text))
            }
            placeholder="0.00"
            keyboardType="numeric"
            editable={formData.type === 'custom'}
          />
        </View>

        {/* Quick reference amounts */}
        <View style={styles.referenceAmounts}>
          <View style={styles.referenceItem}>
            <Text style={styles.referenceLabel}>Minimum Payment</Text>
            <Text style={styles.referenceAmount}>
              {formatCreditLimit(card.minimumPayment)}
            </Text>
          </View>

          <View style={styles.referenceItem}>
            <Text style={styles.referenceLabel}>Current Balance</Text>
            <Text style={styles.referenceAmount}>
              {formatCreditLimit(card.currentBalance)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (!card) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Record Payment</Text>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.saveButton, loading && styles.disabledButton]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Record</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Error Messages */}
        {errors.length > 0 && (
          <View style={styles.errorContainer}>
            {errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>
                • {error}
              </Text>
            ))}
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Card Information */}
          <View
            style={[
              styles.cardHeader,
              { backgroundColor: card.color || '#007AFF' },
            ]}
          >
            <Text style={styles.cardName}>{card.name}</Text>
            <Text style={styles.cardDetails}>•••• {card.lastFourDigits}</Text>
            <Text style={styles.cardBalance}>
              Current Balance: {formatCreditLimit(card.currentBalance)}
            </Text>
          </View>

          {/* Payment Type Selection */}
          {renderPaymentTypeSelection()}

          {/* Amount Section */}
          {renderAmountSection()}

          {/* Payment Date */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Date</Text>
            <TextInput
              style={styles.textInput}
              value={formData.paymentDate}
              onChangeText={text => updateFormField('paymentDate', text)}
              placeholder="YYYY-MM-DD"
            />
            <Text style={styles.inputHint}>
              Enter the date when the payment was made or will be made
            </Text>
          </View>

          {/* Optional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Additional Details (Optional)
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.textInput}
                value={formData.description}
                onChangeText={text => updateFormField('description', text)}
                placeholder="e.g., Monthly payment, Extra payment"
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmation Number</Text>
              <TextInput
                style={styles.textInput}
                value={formData.confirmationNumber}
                onChangeText={text =>
                  updateFormField('confirmationNumber', text)
                }
                placeholder="e.g., TXN123456789"
                maxLength={50}
              />
            </View>
          </View>

          {/* Impact Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Impact</Text>

            <View style={styles.impactRow}>
              <Text style={styles.impactLabel}>Current Balance</Text>
              <Text style={styles.impactValue}>
                {formatCreditLimit(card.currentBalance)}
              </Text>
            </View>

            <View style={styles.impactRow}>
              <Text style={styles.impactLabel}>Payment Amount</Text>
              <Text style={[styles.impactValue, styles.negativeValue]}>
                -
                {formatCurrency(formData.amount)
                  ? formatCreditLimit(parseFloat(formData.amount))
                  : '$0.00'}
              </Text>
            </View>

            <View style={[styles.impactRow, styles.resultRow]}>
              <Text style={styles.impactLabel}>New Balance</Text>
              <Text style={[styles.impactValue, styles.positiveValue]}>
                {formatCreditLimit(
                  Math.max(
                    0,
                    card.currentBalance - (parseFloat(formData.amount) || 0)
                  )
                )}
              </Text>
            </View>
          </View>

          {/* Privacy Notice */}
          <View style={styles.privacyNotice}>
            <Text style={styles.privacyText}>
              🔒 Payment records are stored securely on your device and never
              shared with third parties.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    marginBottom: 4,
  },
  scrollView: {
    flex: 1,
  },
  cardHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  cardDetails: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 8,
  },
  cardBalance: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  paymentTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 8,
  },
  selectedPaymentType: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  paymentTypeContent: {
    flex: 1,
  },
  paymentTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  selectedPaymentTypeText: {
    color: '#ffffff',
  },
  paymentTypeDescription: {
    fontSize: 13,
    color: '#6c757d',
  },
  selectedPaymentTypeDescription: {
    color: '#ffffff',
    opacity: 0.9,
  },
  checkmark: {
    width: 24,
    height: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '700',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingVertical: 16,
  },
  disabledInput: {
    color: '#6c757d',
  },
  referenceAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e1e5e9',
  },
  referenceItem: {
    alignItems: 'center',
  },
  referenceLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  referenceAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputHint: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e1e5e9',
    marginTop: 8,
    paddingTop: 16,
  },
  impactLabel: {
    fontSize: 14,
    color: '#495057',
  },
  impactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  negativeValue: {
    color: '#dc3545',
  },
  positiveValue: {
    color: '#28a745',
  },
  privacyNotice: {
    backgroundColor: '#e8f5e8',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    marginBottom: 32,
  },
  privacyText: {
    fontSize: 12,
    color: '#155724',
    textAlign: 'center',
    lineHeight: 16,
  },
});
