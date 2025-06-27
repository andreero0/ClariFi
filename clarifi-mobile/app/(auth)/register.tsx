import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ArrowLeft, Mail, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { translate } from '../../i18n';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

// PRD: Email Registration Screen - Just email input and continue
export default function EmailRegistrationScreen() {
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // PRD: Real-time email validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(email));
  }, [email]);

  // PRD: Auto-focus keyboard on screen entry
  useEffect(() => {
    // Keyboard will auto-focus via TextInput autoFocus prop
  }, []);

  const handleContinue = async () => {
    // Haptic feedback on button press
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!isEmailValid) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // PRD: Check if email already exists
      // TODO: Implement email existence check API call
      // If email exists, should transition to password entry with "Welcome back!" message

      // For now, proceed to password creation
      router.push({
        pathname: '/(auth)/password-creation',
        params: { email },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* PRD: Persistent ClariFi logo (40dp height) in top-left + Back arrow */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.logoText}>ClariFi</Text>
      </View>

      {/* PRD: "Let's get you started" H2 header */}
      <Text style={styles.title}>Let's get you started</Text>

      {/* PRD: Subtitle description */}
      <Text style={styles.subtitle}>
        Enter your email to create your secure account
      </Text>

      {/* PRD: Email input field with Mail icon and real-time validation */}
      <View style={styles.inputContainer}>
        <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={true} // PRD: Keyboard opens automatically
        />
        {/* PRD: Green checkmark when valid email entered */}
        {isEmailValid && (
          <Check
            size={20}
            color={colors.growth}
            style={styles.validationIcon}
          />
        )}
      </View>

      {/* PRD: "Continue" button - disabled until valid email */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          { opacity: isEmailValid && !isLoading ? 1 : 0.5 },
        ]}
        onPress={handleContinue}
        disabled={!isEmailValid || isLoading}
      >
        <Text style={styles.continueButtonText}>
          {isLoading ? 'Creating account...' : 'Continue'}
        </Text>
      </TouchableOpacity>

      {/* PRD: Terms and Privacy Policy disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          By continuing, you agree to our{' '}
          <Text style={styles.linkText}>Terms of Service</Text> and{' '}
          <Text style={styles.linkText}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // PRD: Clean white background
  container: {
    flex: 1,
    backgroundColor: colors.surface, // PRD Pure White
    paddingHorizontal: 24,
    paddingTop: 60, // Space for header
  },
  // PRD: Header with persistent logo and back arrow
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 48,
  },
  backButton: {
    marginRight: 16, // PRD: 16dp from logo
    padding: 8, // Touch area
  },
  logoText: {
    fontSize: 40, // PRD: 40dp height
    fontWeight: '700',
    color: colors.textPrimary, // PRD Midnight Ink
  },
  // PRD: "Let's get you started" H2 header, 24dp below header
  title: {
    ...textStyles.h2, // PRD H2 style (24dp, Semibold, Midnight Ink)
    color: colors.textPrimary,
    marginBottom: 8,
  },
  // PRD: Subtitle in Body Regular, Neutral Gray
  subtitle: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary, // PRD Neutral Gray
    marginBottom: 32,
  },
  // PRD: Email input with 24dp top margin
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5, // PRD: 1.5dp border
    borderColor: colors.borderLight, // PRD Border/Divider
    borderRadius: 12, // PRD: 12dp radius
    backgroundColor: colors.surface, // PRD Pure White
    paddingHorizontal: 16, // PRD: 16dp horizontal padding
    height: 52, // PRD: 52dp height
    marginBottom: 32,
  },
  inputIcon: {
    marginRight: 12, // Space between icon and input
  },
  input: {
    flex: 1,
    ...textStyles.bodyRegular, // PRD: Body Regular font
    color: colors.textPrimary, // PRD Midnight Ink
    paddingVertical: 16, // Increased padding to prevent text cutoff
    paddingHorizontal: 0, // No horizontal padding (handled by container)
    textAlignVertical: 'center', // Ensure text is vertically centered
    lineHeight: 20, // Explicit line height to prevent clipping
    includeFontPadding: false, // Android: Remove extra font padding
  },
  validationIcon: {
    marginLeft: 12, // Space between input and checkmark
  },
  // PRD: Continue button - Primary Button styling
  continueButton: {
    backgroundColor: colors.primary, // PRD Clarity Blue
    height: 48, // PRD: 48dp height
    borderRadius: 12, // PRD: 12dp radius
    paddingHorizontal: 20, // PRD: 20dp horizontal padding
    paddingVertical: 14, // PRD: 14dp vertical padding
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  continueButtonText: {
    ...textStyles.button, // PRD: Button text style
    color: colors.surface, // PRD Pure White
  },
  // PRD: Terms disclaimer in Caption style
  disclaimerContainer: {
    paddingHorizontal: 16,
  },
  disclaimerText: {
    ...textStyles.caption, // PRD: Caption (12dp, Regular, 0.25dp letter-spacing)
    color: colors.textSecondary, // PRD Neutral Gray Secondary
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    ...textStyles.caption,
    color: colors.primary, // PRD Clarity Blue
    fontWeight: '500',
  },
});
