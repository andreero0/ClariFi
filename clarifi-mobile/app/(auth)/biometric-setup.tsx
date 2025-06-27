import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fingerprint, ScanFace } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { useOnboarding } from '../../context/OnboardingContext';

export default function BiometricSetupScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<
    'FaceID' | 'TouchID' | 'Biometric'
  >('Biometric');
  const router = useRouter();
  const { setBiometricConsent, setCurrentStep, markStepComplete } =
    useOnboarding();

  useEffect(() => {
    // Mark this step as current
    setCurrentStep('biometric-setup');

    // Detect biometric type
    checkBiometricType();
  }, []);

  const checkBiometricType = async () => {
    const supportedTypes =
      await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (Platform.OS === 'ios') {
      if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        )
      ) {
        setBiometricType('FaceID');
      } else if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT
        )
      ) {
        setBiometricType('TouchID');
      }
    } else {
      setBiometricType('Biometric');
    }
  };

  const handleEnableBiometrics = async () => {
    setIsLoading(true);

    try {
      // PRD: System biometric prompt with platform-native styling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Use ${biometricType} for secure access to ClariFi`,
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        // Save biometric consent
        setBiometricConsent(true);
        markStepComplete('biometric-setup');
        setCurrentStep('bank-selection');

        // Navigate to next step
        router.push('/(auth)/bank-selection');
      } else {
        Alert.alert(
          'Authentication Failed',
          'Please try again or skip to continue without biometrics.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to enable biometric authentication. You can skip this step and continue.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipBiometrics = () => {
    // Save that user chose to skip biometrics
    setBiometricConsent(false);
    markStepComplete('biometric-setup');
    setCurrentStep('bank-selection');

    router.push('/(auth)/bank-selection');
  };

  const getIcon = () => {
    if (biometricType === 'FaceID') {
      return <ScanFace size={48} color={colors.primary} />;
    } else {
      return <Fingerprint size={48} color={colors.primary} />;
    }
  };

  const getButtonText = () => {
    return `Enable ${biometricType}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* PRD: Illustration of Face ID/Touch ID centered */}
        <View style={styles.iconContainer}>{getIcon()}</View>

        {/* PRD: Heading */}
        <Text style={styles.title}>Secure and Fast Access</Text>

        {/* PRD: "Use biometric authentication for faster, more secure sign-ins" body text */}
        <Text style={styles.description}>
          Use biometric authentication for faster, more secure sign-ins to your
          financial data.
        </Text>

        {/* PRD: Primary button "Enable Face ID" (or Touch ID based on device) */}
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
          onPress={handleEnableBiometrics}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Setting up...' : getButtonText()}
          </Text>
        </TouchableOpacity>

        {/* Skip option */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipBiometrics}
          disabled={isLoading}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface, // PRD: Pure White
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.xxl, // Increased spacing for better layout
  },
  title: {
    ...textStyles.h2, // PRD: H2 style
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxxxl, // Appropriate spacing before buttons
    paddingHorizontal: spacing.md, // Better text wrapping
  },
  primaryButton: {
    backgroundColor: colors.primary,
    height: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    width: '100%',
    maxWidth: 280, // Limit button width for better proportions
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg, // Better spacing between buttons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    ...textStyles.button,
    color: colors.surface,
  },
  skipButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    width: '100%',
    maxWidth: 280, // Match primary button width
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
