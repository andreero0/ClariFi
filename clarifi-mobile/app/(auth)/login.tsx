import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const { width, height } = Dimensions.get('window');

// Demo accounts for testing
const DEMO_ACCOUNTS = [
  { email: 'demo@clarifi.ca', password: 'demo123', name: 'Demo User' },
  { email: 'test@clarifi.ca', password: 'test123', name: 'Test User' },
  { email: 'sarah@example.com', password: 'password', name: 'Sarah Chen' },
];

export default function SignInScreen() {
  const router = useRouter();
  const {
    signIn,
    isSigningIn,
    error: authError,
    clearError,
    isBiometricLoginEnabled,
    isBiometricHardwareAvailable,
    isBiometricEnrolled,
    attemptBiometricLogin,
    isLoggingInWithBiometrics,
    checkBiometricSupport,
    signInWithGoogle,
    signInWithApple,
    signInWithFacebook,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false); // Hidden by default

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(spacing.xl)).current;

  useEffect(() => {
    checkBiometricSupport();

    // Initialize animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [checkBiometricSupport]);

  const handleSignIn = async () => {
    // Haptic feedback on button press
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (authError) clearError();

    // Check if it's a demo account
    const demoAccount = DEMO_ACCOUNTS.find(
      acc => acc.email === email && acc.password === password
    );
    if (demoAccount) {
      Alert.alert(
        'Demo Mode',
        `Welcome ${demoAccount.name}! This is a demo account.`
      );
      // For demo, just navigate (you'd normally call signIn)
      router.replace('/(tabs)/dashboard');
      return;
    }

    const response = await signIn({ email, password });
    if (response && !response.error && response.user) {
      // Navigation handled by root layout
    } else if (response && response.error) {
      Alert.alert('Sign In Failed', response.error.message);
    }
  };

  const handleDemoLogin = (demoAccount: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(demoAccount.email);
    setPassword(demoAccount.password);
  };

  const handleBiometricSignIn = async () => {
    // Haptic feedback on button press
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (authError) clearError();
    const success = await attemptBiometricLogin();
    if (!success && authError) {
      Alert.alert('Biometric Sign In Failed', authError.message);
    }
  };

  const canAttemptBiometricLogin =
    isBiometricLoginEnabled &&
    isBiometricHardwareAvailable &&
    isBiometricEnrolled;

  const handleSocialSignIn = async (
    provider: 'google' | 'apple' | 'facebook'
  ) => {
    if (authError) clearError();

    // For demo purposes, show that it's not implemented
    Alert.alert(
      'Coming Soon',
      `${provider} sign-in will be available in the next update.`
    );
    return;

    let result;
    switch (provider) {
      case 'google':
        result = await signInWithGoogle();
        break;
      case 'apple':
        result = await signInWithApple();
        break;
      case 'facebook':
        result = await signInWithFacebook();
        break;
    }

    if (result?.error) {
      Alert.alert('Sign In Failed', result.error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with logo and back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.logoText}>ClariFi</Text>
        </View>

        {/* Animated content */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Title and subtitle */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your ClariFi account</Text>
          </View>

          {/* Demo accounts toggle (dev only) */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.demoToggleButton}
              onPress={() => setShowDemoAccounts(!showDemoAccounts)}
            >
              <Text style={styles.demoToggleText}>
                {showDemoAccounts ? 'Hide' : 'Show'} Demo Accounts
              </Text>
            </TouchableOpacity>
          )}

          {/* Demo accounts (dev only) */}
          {showDemoAccounts && __DEV__ && (
            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Demo Accounts (Dev Only)</Text>
              {DEMO_ACCOUNTS.map((account, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.demoButton}
                  onPress={() => handleDemoLogin(account)}
                >
                  <Text style={styles.demoButtonText}>{account.name}</Text>
                  <Text style={styles.demoEmail}>{account.email}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Email input */}
          <View style={styles.inputContainer}>
            <Mail
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
            />
          </View>

          {/* Password input */}
          <View style={styles.inputContainer}>
            <Lock
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textContentType="password"
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color={colors.textSecondary} />
              ) : (
                <Eye size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Error message */}
          {authError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{authError.message}</Text>
            </View>
          )}

          {/* Sign in button */}
          <TouchableOpacity
            style={[styles.signInButton, { opacity: isSigningIn ? 0.6 : 1 }]}
            onPress={handleSignIn}
            disabled={isSigningIn || isLoggingInWithBiometrics}
          >
            <Text style={styles.signInButtonText}>
              {isSigningIn ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Biometric login */}
          {canAttemptBiometricLogin && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricSignIn}
              disabled={isLoggingInWithBiometrics || isSigningIn}
            >
              <Fingerprint size={20} color={colors.primary} />
              <Text style={styles.biometricButtonText}>
                {isLoggingInWithBiometrics ? 'Verifying...' : 'Use Biometrics'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Social sign-in */}
          <View style={styles.socialContainer}>
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>Or continue with</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialSignIn('google')}
                disabled={isSigningIn}
              >
                <Ionicons name="logo-google" size={20} color="#4285F4" />
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialSignIn('apple')}
                  disabled={isSigningIn}
                >
                  <Ionicons name="logo-apple" size={20} color="#000" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialSignIn('facebook')}
                disabled={isSigningIn}
              >
                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Links */}
          <View style={styles.linksContainer}>
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkText}>Forgot Password?</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/(auth)/register" asChild>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkText}>
                  Don't have an account?{' '}
                  <Text style={styles.linkTextBold}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  backButton: {
    marginRight: spacing.lg,
    padding: spacing.sm,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  formContainer: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: spacing.xxl,
  },
  title: {
    ...textStyles.h1,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
  },
  demoToggleButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.neutral.light,
  },
  demoToggleText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  demoContainer: {
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  demoTitle: {
    ...textStyles.caption,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoButton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  demoButtonText: {
    ...textStyles.bodyRegular,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  demoEmail: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    height: 52,
    marginBottom: spacing.lg,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  passwordToggle: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  errorContainer: {
    backgroundColor: colors.error + '15',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  errorText: {
    ...textStyles.caption,
    color: colors.error,
    textAlign: 'center',
  },
  signInButton: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 16,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: Platform.OS === 'ios' ? 6 : 3,
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.4,
    shadowRadius: Platform.OS === 'ios' ? 12 : 6,
    elevation: Platform.OS === 'android' ? 6 : 0,
  },
  signInButtonText: {
    ...textStyles.button,
    fontSize: 17,
    fontWeight: '600',
    color: colors.surface,
    letterSpacing: -0.1,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    height: 48,
    borderRadius: 16,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  biometricButtonText: {
    ...textStyles.button,
    color: colors.primary,
    fontWeight: '600',
  },
  socialContainer: {
    marginBottom: spacing.xl,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  orText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  linksContainer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  linkButton: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  linkTextBold: {
    color: colors.primary,
    fontWeight: '600',
  },
});
