import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { translate } from '../../i18n';
import { BankDefinition, SUPPORTED_BANKS } from '../../constants/banks';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useOnboarding } from '../../context/OnboardingContext';
import BankLogo from '../../components/banks/BankLogo';

// Interface for bank items with selection state
interface SelectableBank extends BankDefinition {
  selected: boolean;
  scaleAnim: Animated.Value; // PRD: Scale animation for tap
}

const { width } = Dimensions.get('window');

// PRD: Primary Canadian banks in specific order
const PRD_BANKS = ['td', 'rbc', 'bmo', 'scotia', 'cibc', 'national-bank'];

export default function BankSelectionScreen() {
  const [banks, setBanks] = useState<SelectableBank[]>([]);
  const [isMultipleMode, setIsMultipleMode] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const {
    setSelectedBankIds,
    selectedBankIds,
    setCurrentStep,
    markStepComplete,
  } = useOnboarding();

  // Initialize banks only once when component mounts
  useEffect(() => {
    if (!isInitialized) {
      // Mark this step as current when screen loads
      setCurrentStep('bank-selection');

      // PRD: Filter to only show the 6 required Canadian banks
      const prdBanks = PRD_BANKS.map(bankId => {
        const bank = SUPPORTED_BANKS.find(b => b.id === bankId);
        return bank
          ? {
              ...bank,
              selected: selectedBankIds.includes(bankId), // Restore previous selections
              scaleAnim: new Animated.Value(1),
            }
          : null;
      }).filter(Boolean) as SelectableBank[];

      setBanks(prdBanks);

      // Set multiple mode if user previously selected multiple banks
      if (selectedBankIds.length > 1) {
        setIsMultipleMode(true);
      }

      // Update selected count
      const count = prdBanks.filter(bank => bank.selected).length;
      setSelectedCount(count);
      
      setIsInitialized(true);
    }
  }, [isInitialized, selectedBankIds, setCurrentStep]);

  // PRD: Single bank selection mode (default)
  const handleSelectBank = useCallback(async (bankId: string) => {
    // Haptic feedback on bank selection
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    console.log('Selecting bank:', bankId, 'Current mode:', isMultipleMode ? 'multiple' : 'single');
    
    // Update banks state immediately
    setBanks(prevBanks => {
      const updatedBanks = prevBanks.map(bank => {
        if (!isMultipleMode) {
          // Single selection mode - select this bank, clear others
          return {
            ...bank,
            selected: bank.id === bankId,
          };
        } else {
          // Multiple selection mode - toggle this bank
          return bank.id === bankId 
            ? { ...bank, selected: !bank.selected }
            : bank;
        }
      });
      
      // Update selected count immediately
      const newCount = updatedBanks.filter(bank => bank.selected).length;
      setSelectedCount(newCount);
      
      console.log('New banks state:', updatedBanks.map(b => ({ id: b.id, selected: b.selected })));
      return updatedBanks;
    });

    // PRD: Scale animation on tap (1.02 scale)
    const targetBank = banks.find(b => b.id === bankId);
    if (targetBank) {
      Animated.sequence([
        Animated.timing(targetBank.scaleAnim, {
          toValue: 1.02,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(targetBank.scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isMultipleMode, banks]);

  // PRD: "I use multiple banks" toggle
  const handleMultipleBanksToggle = useCallback(() => {
    setIsMultipleMode(true);
    setSelectedCount(0);
    // Clear all selections when switching to multiple mode
    setBanks(prevBanks =>
      prevBanks.map(bank => ({ ...bank, selected: false }))
    );
  }, []);

  const navigateToNextStep = useCallback(async () => {
    if (selectedCount === 0) return;

    // Haptic feedback on continue button
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const selectedIds = banks
      .filter(bank => bank.selected)
      .map(bank => bank.id);

    // Save bank selections with persistence
    setSelectedBankIds(selectedIds);

    // Mark this step as complete and set next step
    markStepComplete('bank-selection');
    setCurrentStep('statement-instructions');

    console.log(
      `Bank selection complete. Selected banks: ${selectedIds.join(', ')}`
    );
    router.push('/(auth)/statement-instructions');
  }, [selectedCount, banks, setSelectedBankIds, markStepComplete, setCurrentStep, router]);

  const handleBankNotListed = useCallback(async () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // For now, allow user to continue without bank selection
    // This could be enhanced later to show a form for custom bank entry
    Alert.alert(
      'Bank Not Listed',
      'No problem! You can still continue and add your bank information later in the app settings.',
      [
        {
          text: 'Go Back',
          style: 'cancel'
        },
        {
          text: 'Continue Anyway',
          onPress: () => {
            // Set a generic "other" bank selection
            setSelectedBankIds(['other']);
            markStepComplete('bank-selection');
            setCurrentStep('statement-instructions');
            router.push('/(auth)/statement-instructions');
          }
        }
      ]
    );
  }, [setSelectedBankIds, markStepComplete, setCurrentStep, router]);

  // PRD: Render bank card with exact specifications
  const renderBankCard = useCallback((bank: SelectableBank, index: number) => {
    return (
      <Animated.View
        key={bank.id}
        style={[
          styles.bankCard,
          {
            transform: [{ scale: bank.scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.bankCardInner,
            bank.selected && styles.bankCardSelected,
          ]}
          onPress={() => handleSelectBank(bank.id)}
          activeOpacity={0.9}
        >
          {/* PRD: Bank logo using proper styled bank logos */}
          <BankLogo bankId={bank.id} size={64} />

          {/* PRD: Check icon in top-right corner when selected */}
          {bank.selected && (
            <View style={styles.checkIconContainer}>
              <Check size={16} color={colors.surface} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }, [handleSelectBank]);

  return (
    <View style={styles.container}>
      {/* PRD: Header with back arrow and logo */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.logoText}>ClariFi</Text>
      </View>

      {/* PRD: "Which bank do you use?" H2 header */}
      <Text style={styles.title}>Which bank do you use?</Text>

      {/* PRD: "Select your primary bank to get started" subtitle */}
      <Text style={styles.subtitle}>
        {isMultipleMode
          ? 'Select all banks you use'
          : 'Select your primary bank to get started'}
      </Text>

      {/* PRD: 2x3 grid of bank cards with 16dp spacing */}
      <View style={styles.bankGrid}>
        {banks.map((bank, index) => renderBankCard(bank, index))}
      </View>

      {/* PRD: "I use multiple banks" link below grid */}
      {!isMultipleMode && (
        <TouchableOpacity
          style={styles.multipleBanksButton}
          onPress={handleMultipleBanksToggle}
        >
          <Text style={styles.multipleBanksText}>I use multiple banks</Text>
        </TouchableOpacity>
      )}

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* PRD: Continue button */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          { opacity: selectedCount > 0 ? 1 : 0.5 },
        ]}
        onPress={navigateToNextStep}
        disabled={selectedCount === 0}
      >
        <Text style={styles.continueButtonText}>
          {isMultipleMode
            ? `Continue with ${selectedCount} bank${selectedCount !== 1 ? 's' : ''}`
            : 'Continue'}
        </Text>
      </TouchableOpacity>

      {/* PRD: "My bank isn't listed" link at bottom */}
      <TouchableOpacity style={styles.notListedButton} onPress={handleBankNotListed}>
        <Text style={styles.notListedText}>My bank isn't listed</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface, // PRD Pure White
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  // PRD: Header with logo and back arrow
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 48,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  // PRD: "Which bank do you use?" H2 header
  title: {
    ...textStyles.h2, // PRD H2 style (24dp, Semibold, Midnight Ink)
    color: colors.textPrimary,
    marginBottom: 8,
  },
  // PRD: Subtitle description
  subtitle: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  // PRD: 2x3 grid of bank cards with 16dp spacing
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16, // PRD: 16dp spacing
    marginBottom: 32,
  },
  // PRD: Each card 156dp x 100dp
  bankCard: {
    width: 156, // PRD: 156dp width
    height: 100, // PRD: 100dp height
  },
  bankCardInner: {
    flex: 1,
    backgroundColor: colors.surface, // PRD: White background
    borderWidth: 1,
    borderColor: colors.borderLight, // PRD: Border/Divider stroke
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  // PRD: Selected card shows blue border
  bankCardSelected: {
    borderWidth: 2, // PRD: 2dp border
    borderColor: colors.primary, // PRD: Clarity Blue
    backgroundColor: `${colors.primary}0A`, // 10% opacity blue background
  },
  // Bank logo container is now handled by BankLogo component
  // PRD: Check icon in top-right corner
  checkIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // PRD: "I use multiple banks" link
  multipleBanksButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  multipleBanksText: {
    ...textStyles.bodyRegular,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  spacer: {
    flex: 1,
  },
  // PRD: Continue button
  continueButton: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  continueButtonText: {
    ...textStyles.button,
    color: colors.surface,
  },
  // PRD: "My bank isn't listed" link at bottom
  notListedButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  notListedText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
