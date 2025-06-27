import React, { useState, useEffect, useRef } from 'react';
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
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCreditCards } from '../../hooks/useCreditCards';
import {
  CreditCardFormData,
  CreditCardIssuer,
  validateCreditCardForm,
  getIssuerDisplayName,
} from '../../types/creditCard';
import { colors } from '../../constants';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import {
  X,
  Check,
  CreditCard,
  DollarSign,
  Calendar,
  AlertCircle,
} from 'lucide-react-native';

const CANADIAN_ISSUERS: CreditCardIssuer[] = [
  'rbc',
  'td',
  'bmo',
  'scotiabank',
  'cibc',
  'tangerine',
  'mbna',
  'capital-one',
  'pc-financial',
];

const INTERNATIONAL_ISSUERS: CreditCardIssuer[] = [
  'visa',
  'mastercard',
  'amex',
  'discover',
];

const CARD_COLORS = [
  colors.clarityBlue,
  colors.growthGreen,
  colors.errorRed,
  '#FF9500',
  colors.wisdomPurple,
  '#5856D6',
  '#00C7BE',
  '#30B0C7',
  '#32ADE6',
  '#FF6B35',
];

const CreditCardFormModal: React.FC = () => {
  const router = useRouter();
  const { cardId } = useLocalSearchParams<{ cardId?: string }>();
  const { cards, addCard, updateCard } = useCreditCards();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreditCardFormData>({
    name: '',
    lastFourDigits: '',
    issuer: 'rbc',
    creditLimit: '',
    currentBalance: '0',
    paymentDueDate: '',
    statementDate: '',
    interestRate: '19.99',
    notes: '',
    color: CARD_COLORS[0],
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const isEditing = !!cardId;

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

  // Load card data for editing
  useEffect(() => {
    if (isEditing && cards && cardId) {
      const cardToEdit = cards.find(card => card.id === cardId);
      if (cardToEdit) {
        setFormData({
          name: cardToEdit.name,
          lastFourDigits: cardToEdit.lastFourDigits,
          issuer: cardToEdit.issuer,
          creditLimit: cardToEdit.creditLimit.toString(),
          currentBalance: cardToEdit.currentBalance.toString(),
          paymentDueDate: cardToEdit.paymentDueDate.split('T')[0], // Convert to YYYY-MM-DD
          statementDate: cardToEdit.statementDate.split('T')[0],
          interestRate: cardToEdit.interestRate.toString(),
          notes: cardToEdit.notes || '',
          color: cardToEdit.color || CARD_COLORS[0],
        });

        const colorIndex = CARD_COLORS.indexOf(
          cardToEdit.color || CARD_COLORS[0]
        );
        setSelectedColorIndex(colorIndex >= 0 ? colorIndex : 0);
      }
    }
  }, [isEditing, cardId, cards]);

  const updateFormField = (field: keyof CreditCardFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validateCreditCardForm(formData);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const cardData = {
        name: formData.name.trim(),
        lastFourDigits: formData.lastFourDigits.trim(),
        issuer: formData.issuer,
        creditLimit: parseFloat(formData.creditLimit),
        currentBalance: parseFloat(formData.currentBalance),
        paymentDueDate: new Date(formData.paymentDueDate).toISOString(),
        statementDate: new Date(formData.statementDate).toISOString(),
        interestRate: parseFloat(formData.interestRate),
        notes: formData.notes?.trim(),
        color: formData.color,
        availableCredit: 0, // Will be calculated in the hook
        minimumPayment: 0, // Will be calculated in the hook
        isActive: true,
      };

      if (isEditing && cardId) {
        await updateCard(cardId, cardData);
        Alert.alert('Success', 'Credit card updated successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await addCard(cardData);
        Alert.alert('Success', 'Credit card added successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error('Error saving card:', error);
      Alert.alert('Error', 'Failed to save credit card. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderIssuerSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Financial Institution</Text>

      <Text style={styles.subsectionTitle}>Canadian Banks</Text>
      <View style={styles.issuerGrid}>
        {CANADIAN_ISSUERS.map(issuer => (
          <TouchableOpacity
            key={issuer}
            style={[
              styles.issuerOption,
              formData.issuer === issuer && styles.selectedIssuer,
            ]}
            onPress={() => updateFormField('issuer', issuer)}
          >
            <Text
              style={[
                styles.issuerText,
                formData.issuer === issuer && styles.selectedIssuerText,
              ]}
            >
              {getIssuerDisplayName(issuer)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subsectionTitle}>Card Networks</Text>
      <View style={styles.issuerGrid}>
        {INTERNATIONAL_ISSUERS.map(issuer => (
          <TouchableOpacity
            key={issuer}
            style={[
              styles.issuerOption,
              formData.issuer === issuer && styles.selectedIssuer,
            ]}
            onPress={() => updateFormField('issuer', issuer)}
          >
            <Text
              style={[
                styles.issuerText,
                formData.issuer === issuer && styles.selectedIssuerText,
              ]}
            >
              {getIssuerDisplayName(issuer)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderColorSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Card Color</Text>
      <View style={styles.colorGrid}>
        {CARD_COLORS.map((color, index) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColorIndex === index && styles.selectedColor,
            ]}
            onPress={() => {
              setSelectedColorIndex(index);
              updateFormField('color', color);
            }}
          >
            {selectedColorIndex === index && (
              <Text style={styles.colorCheckmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const formatCurrency = (text: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = text.replace(/[^0-9.]/g, '');
    return numericValue;
  };

  const formatCardNumber = (text: string) => {
    // Only allow 4 digits
    const numericValue = text.replace(/[^0-9]/g, '').slice(0, 4);
    return numericValue;
  };

  return (
    <>
      <StatusBar
        backgroundColor={colors.clarityBlue}
        barStyle="light-content"
      />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <X size={24} color={colors.pureWhite} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <CreditCard size={24} color={colors.pureWhite} />
              <Text style={styles.headerTitle}>
                {isEditing ? 'Edit Card' : 'Add Card'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.saveButton, loading && styles.disabledButton]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.pureWhite} />
              ) : (
                <Check size={20} color={colors.pureWhite} />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Error Messages */}
          {errors.length > 0 && (
            <Animated.View
              style={[
                styles.errorContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <AlertCircle size={20} color={colors.errorRed} />
              <View style={styles.errorTextContainer}>
                {errors.map((error, index) => (
                  <Text key={index} style={styles.errorText}>
                    {error}
                  </Text>
                ))}
              </View>
            </Animated.View>
          )}

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
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Name *</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    focusedField === 'name' && styles.focusedInput,
                  ]}
                  value={formData.name}
                  onChangeText={text => updateFormField('name', text)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="e.g., RBC Rewards Visa"
                  placeholderTextColor={colors.neutralGray}
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last 4 Digits *</Text>
                <View style={styles.inputWithIcon}>
                  <CreditCard
                    size={20}
                    color={colors.neutralGray}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.textInputWithIcon,
                      focusedField === 'lastFourDigits' && styles.focusedInput,
                    ]}
                    value={formData.lastFourDigits}
                    onChangeText={text =>
                      updateFormField('lastFourDigits', formatCardNumber(text))
                    }
                    onFocus={() => setFocusedField('lastFourDigits')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="1234"
                    placeholderTextColor={colors.neutralGray}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>
            </View>

            {/* Issuer Selection */}
            {renderIssuerSelection()}

            {/* Financial Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Financial Details</Text>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Credit Limit (CAD) *</Text>
                  <View style={styles.inputWithIcon}>
                    <DollarSign
                      size={18}
                      color={colors.neutralGray}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.textInput,
                        styles.textInputWithIcon,
                        focusedField === 'creditLimit' && styles.focusedInput,
                      ]}
                      value={formData.creditLimit}
                      onChangeText={text =>
                        updateFormField('creditLimit', formatCurrency(text))
                      }
                      onFocus={() => setFocusedField('creditLimit')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="5000"
                      placeholderTextColor={colors.neutralGray}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Current Balance (CAD) *</Text>
                  <View style={styles.inputWithIcon}>
                    <DollarSign
                      size={18}
                      color={colors.neutralGray}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.textInput,
                        styles.textInputWithIcon,
                        focusedField === 'currentBalance' &&
                          styles.focusedInput,
                      ]}
                      value={formData.currentBalance}
                      onChangeText={text =>
                        updateFormField('currentBalance', formatCurrency(text))
                      }
                      onFocus={() => setFocusedField('currentBalance')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="0"
                      placeholderTextColor={colors.neutralGray}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Interest Rate (%) *</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    focusedField === 'interestRate' && styles.focusedInput,
                  ]}
                  value={formData.interestRate}
                  onChangeText={text =>
                    updateFormField('interestRate', formatCurrency(text))
                  }
                  onFocus={() => setFocusedField('interestRate')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="19.99"
                  placeholderTextColor={colors.neutralGray}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Payment Dates */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Information</Text>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Payment Due Date *</Text>
                  <View style={styles.inputWithIcon}>
                    <Calendar
                      size={18}
                      color={colors.neutralGray}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.textInput,
                        styles.textInputWithIcon,
                        focusedField === 'paymentDueDate' &&
                          styles.focusedInput,
                      ]}
                      value={formData.paymentDueDate}
                      onChangeText={text =>
                        updateFormField('paymentDueDate', text)
                      }
                      onFocus={() => setFocusedField('paymentDueDate')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.neutralGray}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Statement Date *</Text>
                  <View style={styles.inputWithIcon}>
                    <Calendar
                      size={18}
                      color={colors.neutralGray}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.textInput,
                        styles.textInputWithIcon,
                        focusedField === 'statementDate' && styles.focusedInput,
                      ]}
                      value={formData.statementDate}
                      onChangeText={text =>
                        updateFormField('statementDate', text)
                      }
                      onFocus={() => setFocusedField('statementDate')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.neutralGray}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Color Selection */}
            {renderColorSelection()}

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes (Optional)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.notesInput,
                  focusedField === 'notes' && styles.focusedInput,
                ]}
                value={formData.notes}
                onChangeText={text => updateFormField('notes', text)}
                onFocus={() => setFocusedField('notes')}
                onBlur={() => setFocusedField(null)}
                placeholder="Add any notes about this card..."
                placeholderTextColor={colors.neutralGray}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Privacy Notice */}
            <View style={styles.privacyNotice}>
              <Text style={styles.privacyText}>
                🔒 Your credit card information is stored securely on your
                device and never transmitted to external servers.
              </Text>
            </View>
          </Animated.ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

export default CreditCardFormModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.clarityBlue,
    paddingTop: spacing.xl,
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.pureWhite,
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: spacing.sm,
    borderRadius: 20,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.errorBackground,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.errorRed,
    gap: spacing.sm,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorText: {
    ...textStyles.caption,
    color: colors.errorRed,
    marginBottom: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
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
  subsectionTitle: {
    ...textStyles.caption,
    fontWeight: '600',
    color: colors.neutralGray,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  inputLabel: {
    ...textStyles.caption,
    fontWeight: '600',
    color: colors.midnightInk,
    marginBottom: spacing.sm,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cloudGray,
    borderRadius: 12,
    backgroundColor: colors.pureWhite,
  },
  inputIcon: {
    marginLeft: spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.cloudGray,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...textStyles.body,
    backgroundColor: colors.pureWhite,
  },
  textInputWithIcon: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: spacing.sm,
  },
  focusedInput: {
    borderColor: colors.clarityBlue,
    borderWidth: 2,
  },
  notesInput: {
    height: 100,
    paddingTop: spacing.md,
  },
  issuerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  issuerOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cloudGray,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cloudGray,
  },
  selectedIssuer: {
    backgroundColor: colors.clarityBlue,
    borderColor: colors.clarityBlue,
  },
  issuerText: {
    ...textStyles.caption,
    fontWeight: '500',
    color: colors.midnightInk,
  },
  selectedIssuerText: {
    color: colors.pureWhite,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedColor: {
    borderColor: colors.midnightInk,
    transform: [{ scale: 1.1 }],
  },
  colorCheckmark: {
    color: colors.pureWhite,
    fontSize: 20,
    fontWeight: '700',
  },
  privacyNotice: {
    backgroundColor: colors.cloudGray,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.growthGreen,
  },
  privacyText: {
    ...textStyles.small,
    color: colors.neutralGray,
    textAlign: 'center',
    lineHeight: 18,
  },
});
