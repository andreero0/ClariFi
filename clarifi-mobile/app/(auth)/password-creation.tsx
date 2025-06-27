import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Check,
  CheckCircle,
} from 'lucide-react-native';
import { translate } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

// PRD: Password Creation Screen with strength indicator and requirements checklist
export default function PasswordCreationScreen() {
  const { email } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  // PRD: Success state animation
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  // PRD: Password strength calculation
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0, // 0-4 scale
    color: colors.error,
    label: 'Weak',
  });

  // PRD: Password requirements checklist
  const [requirements, setRequirements] = useState({
    length: false, // At least 8 characters
    uppercase: false, // One uppercase letter
    number: false, // One number
    special: false, // One special character
  });

  // Animation for checkmarks
  const checkmarkAnimations = {
    length: useRef(new Animated.Value(0)).current,
    uppercase: useRef(new Animated.Value(0)).current,
    number: useRef(new Animated.Value(0)).current,
    special: useRef(new Animated.Value(0)).current,
  };

  // PRD: Real-time strength calculation and requirements validation
  useEffect(() => {
    const newRequirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    setRequirements(newRequirements);

    // Animate checkmarks when requirements are met
    Object.keys(newRequirements).forEach(key => {
      const wasMetBefore = requirements[key as keyof typeof requirements];
      const isMetNow = newRequirements[key as keyof typeof newRequirements];

      if (!wasMetBefore && isMetNow) {
        // Animate checkmark appearing
        Animated.spring(
          checkmarkAnimations[key as keyof typeof checkmarkAnimations],
          {
            toValue: 1,
            tension: 300,
            friction: 10,
            useNativeDriver: true,
          }
        ).start();
      } else if (wasMetBefore && !isMetNow) {
        // Animate checkmark disappearing
        Animated.timing(
          checkmarkAnimations[key as keyof typeof checkmarkAnimations],
          {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }
        ).start();
      }
    });

    // Calculate strength score and color
    const metCount = Object.values(newRequirements).filter(Boolean).length;
    let score = 0;
    let color = colors.error;
    let label = 'Weak';

    if (metCount === 4) {
      score = 4;
      color = colors.growth;
      label = 'Strong';
    } else if (metCount === 3) {
      score = 3;
      color = colors.warning;
      label = 'Good';
    } else if (metCount >= 2) {
      score = 2;
      color = colors.warning;
      label = 'Fair';
    } else if (metCount >= 1) {
      score = 1;
      color = colors.error;
      label = 'Weak';
    }

    setPasswordStrength({ score, color, label });

    // PRD: Second password field appears with slide-down animation once first password is valid
    if (metCount === 4 && !showConfirmPassword) {
      setShowConfirmPassword(true);
    } else if (metCount < 4 && showConfirmPassword) {
      setShowConfirmPassword(false);
      setConfirmPassword(''); // Clear confirm password when main password becomes invalid
    }
  }, [password]);

  const handleCreateAccount = async () => {
    if (passwordStrength.score < 4) {
      Alert.alert(
        'Password too weak',
        'Please ensure your password meets all requirements'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords don't match",
        'Please make sure both passwords are identical'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp({ email: email as string, password });
      if (result.error) {
        Alert.alert('Error', result.error.message);
        setIsLoading(false);
      } else {
        // PRD: Success state with checkmark animation and automatic transition after 800ms
        setIsLoading(false);
        setSuccessState(true);

        // PRD: Lottie-style checkmark animation
        Animated.parallel([
          Animated.spring(successScale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(successOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        // PRD: Auto-transition after 800ms
        setTimeout(() => {
          router.replace('/(auth)/biometric-setup');
        }, 800);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account');
      setIsLoading(false);
    }
  };

  const renderRequirement = (key: keyof typeof requirements, text: string) => {
    const isMet = requirements[key];
    const animation = checkmarkAnimations[key];

    return (
      <View key={key} style={styles.requirementRow}>
        <View style={styles.checkmarkContainer}>
          <Animated.View
            style={[
              styles.checkmark,
              {
                opacity: animation,
                transform: [
                  {
                    scale: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Check size={16} color={colors.surface} />
          </Animated.View>
        </View>
        <Text
          style={[
            styles.requirementText,
            { color: isMet ? colors.growth : colors.textSecondary },
          ]}
        >
          {text}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* PRD: Header with logo and back arrow */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.logoText}>ClariFi</Text>
      </View>

      {/* PRD: "Create a secure password" H2 header */}
      <Text style={styles.title}>Create a secure password</Text>

      {/* PRD: Password strength indicator bar (4dp height) */}
      <View style={styles.strengthContainer}>
        <View style={styles.strengthBar}>
          <View
            style={[
              styles.strengthFill,
              {
                width: `${(passwordStrength.score / 4) * 100}%`,
                backgroundColor: passwordStrength.color,
              },
            ]}
          />
        </View>
        <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
          {passwordStrength.label}
        </Text>
      </View>

      {/* PRD: Password input field with Lock icon and Eye toggle */}
      <View style={styles.inputContainer}>
        <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          style={styles.eyeButton}
        >
          {isPasswordVisible ? (
            <EyeOff size={20} color={colors.textSecondary} />
          ) : (
            <Eye size={20} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      {/* PRD: Password requirements checklist with animated checkmarks */}
      <View style={styles.requirementsContainer}>
        {renderRequirement('length', 'At least 8 characters')}
        {renderRequirement('uppercase', 'One uppercase letter')}
        {renderRequirement('number', 'One number')}
        {renderRequirement('special', 'One special character')}
      </View>

      {/* PRD: Second password field appears once first password is valid */}
      {showConfirmPassword && (
        <View style={[styles.inputContainer, styles.confirmPasswordContainer]}>
          <Lock
            size={20}
            color={colors.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!isPasswordVisible}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {password === confirmPassword && confirmPassword.length > 0 && (
            <Check
              size={20}
              color={colors.growth}
              style={styles.validationIcon}
            />
          )}
        </View>
      )}

      {/* PRD: "Create Account" button enables when passwords match */}
      <TouchableOpacity
        style={[
          styles.createButton,
          {
            opacity:
              passwordStrength.score === 4 &&
              password === confirmPassword &&
              confirmPassword.length > 0 &&
              !isLoading
                ? 1
                : 0.5,
          },
        ]}
        onPress={handleCreateAccount}
        disabled={
          !(
            passwordStrength.score === 4 &&
            password === confirmPassword &&
            confirmPassword.length > 0
          ) || isLoading
        }
      >
        <Text style={styles.createButtonText}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      {/* PRD: Success state overlay with checkmark animation */}
      {successState && (
        <View style={styles.successOverlay}>
          <Animated.View
            style={[
              styles.successContainer,
              {
                opacity: successOpacity,
                transform: [{ scale: successScale }],
              },
            ]}
          >
            <View style={styles.checkmarkCircle}>
              <CheckCircle size={64} color={colors.growth || colors.success} />
            </View>
            <Text style={styles.successText}>Account created!</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
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
  title: {
    ...textStyles.h2,
    color: colors.textPrimary,
    marginBottom: 16, // PRD: Reduced spacing for tighter form layout
  },
  // PRD: Password strength indicator bar (4dp height)
  strengthContainer: {
    marginBottom: 16, // PRD: Reduced spacing for convenient form layout
  },
  strengthBar: {
    height: 4, // PRD: 4dp height
    backgroundColor: colors.neutral.light,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
    // Note: Transitions handled by Animated API in React Native
  },
  strengthLabel: {
    ...textStyles.caption,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 12, // PRD: Reduced spacing for convenient form layout
  },
  confirmPasswordContainer: {
    marginTop: 16, // Better spacing between password fields
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
  },
  validationIcon: {
    marginLeft: 8,
  },
  // PRD: Password requirements checklist
  requirementsContainer: {
    marginBottom: 24, // Better spacing for convenient form layout
    marginTop: 12, // Improved gap after password input
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, // Better spacing between requirements
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.growth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementText: {
    ...textStyles.bodyRegular,
    fontSize: 14,
  },
  createButton: {
    backgroundColor: colors.primary,
    height: 48, // PRD: 48dp button height
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
    marginTop: 20, // Better spacing from form elements
  },
  createButtonText: {
    ...textStyles.button,
    color: colors.surface,
  },
  // PRD: Success state overlay styles
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkCircle: {
    marginBottom: 16,
  },
  successText: {
    ...textStyles.h2,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
