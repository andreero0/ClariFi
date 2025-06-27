import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Trophy,
  TrendingUp,
  Bell,
  Target,
  ChevronRight,
} from 'lucide-react-native';

import Button from '../../components/ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { useAuth } from '../../context/AuthContext';
import { useOnboarding } from '../../context/OnboardingContext';
import ConfettiAnimation from '../../components/animations/ConfettiAnimation';

const { width } = Dimensions.get('window');

interface CountingNumberProps {
  targetValue: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

const CountingNumber: React.FC<CountingNumberProps> = ({
  targetValue,
  prefix = '',
  suffix = '',
  duration = 1500,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(animatedValue, {
      toValue: targetValue,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });

    const listener = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.floor(value));
    });

    animation.start();

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [targetValue, duration]);

  return (
    <Text style={styles.foundDataValue}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </Text>
  );
};

const OnboardingCompleteScreen = () => {
  const router = useRouter();
  const { theme: colors } = useTheme();
  const { markOnboardingComplete } = useAuth();
  const { selectedBankIds, markStepComplete, resetOnboardingState } =
    useOnboarding();

  // Animation values
  const [showConfetti, setShowConfetti] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cardsAnim = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Mock data based on typical statement import results
  const mockData = {
    monthlySpending: 2847,
    creditUtilization: 34,
    transactionsCategorized: 47,
    selectedBanks: selectedBankIds.length,
  };

  useEffect(() => {
    // Mark this final step as current
    markStepComplete('onboarding-complete');

    // Start confetti animation
    setShowConfetti(true);
    
    // Stop confetti after 4 seconds
    setTimeout(() => setShowConfetti(false), 4000);

    // Start pulsing animation for CTA
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Delay pulsing to start after other animations
    setTimeout(() => pulseAnimation.start(), 2000);

    // Staggered card animations
    const cardAnimations = cardsAnim.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 1500 + index * 200, // Start after data counting
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      })
    );

    Animated.parallel(cardAnimations).start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  const handleGoToDashboard = async () => {
    try {
      await markOnboardingComplete();
      // Reset onboarding context since we're done
      resetOnboardingState();
      // Don't manually navigate - useAuthRedirect will handle this automatically
      // when onboardingStatus changes to 'complete'
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const handleTakeTour = async () => {
    // Navigate to dashboard with tour parameter
    try {
      await markOnboardingComplete();
      resetOnboardingState();
      // Don't manually navigate - useAuthRedirect will handle this automatically
      // Note: Tour functionality can be implemented through dashboard state/params
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };


  const renderCelebration = () => {
    // PRD: Proper confetti animation replacing the "Christmas lights" effect
    return (
      <ConfettiAnimation
        isVisible={showConfetti}
        duration={3000}
        pieceCount={30}
      />
    );
  };

  const benefitCards = [
    {
      icon: Bell,
      title: 'Get alerts 3 days before statement dates',
      color: colors.primary,
    },
    {
      icon: TrendingUp,
      title: 'See AI-powered insights',
      color: colors.growth || colors.success,
    },
    {
      icon: Target,
      title: 'Track progress with achievements',
      color: colors.wisdom || colors.primary,
    },
  ];

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary || colors.appBackground,
    },
    header: {
      ...textStyles.h1,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    foundDataSection: {
      backgroundColor: colors.surface || colors.backgroundSecondary,
      borderRadius: 20,
      padding: spacing.lg,
      marginBottom: spacing.xl,
      marginHorizontal: spacing.lg,
    },
    foundDataTitle: {
      ...textStyles.h3,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    foundDataValue: {
      ...textStyles.h2,
      color: colors.primary,
      fontWeight: '700',
    },
    benefitCard: {
      backgroundColor: colors.surface || colors.backgroundSecondary,
      borderRadius: 16,
      padding: spacing.lg,
      marginBottom: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    benefitText: {
      ...textStyles.bodyRegular,
      color: colors.textPrimary,
      flex: 1,
      marginLeft: spacing.md,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {renderCelebration()}

      <View style={styles.content}>
        {/* PRD: Trophy icon (48dp) in Wisdom Purple */}
        <View style={styles.iconContainer}>
          <Trophy size={48} color={colors.wisdom || colors.primary} />
        </View>

        {/* PRD: "You're all set!" H1 header */}
        <Text style={dynamicStyles.header}>You're all set!</Text>

        {/* PRD: "Here's what ClariFi found:" section with animated counting */}
        <View style={dynamicStyles.foundDataSection}>
          <Text style={dynamicStyles.foundDataTitle}>
            Here's what ClariFi found:
          </Text>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Monthly spending:</Text>
            <CountingNumber
              targetValue={mockData.monthlySpending}
              prefix="$"
              duration={1200}
            />
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Credit utilization:</Text>
            <CountingNumber
              targetValue={mockData.creditUtilization}
              suffix="%"
              duration={1000}
            />
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Transactions categorized:</Text>
            <CountingNumber
              targetValue={mockData.transactionsCategorized}
              duration={800}
            />
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Banks connected:</Text>
            <CountingNumber
              targetValue={mockData.selectedBanks}
              duration={600}
            />
          </View>
        </View>

        {/* PRD: Three benefit reminder cards with staggered animations */}
        <View style={styles.benefitsSection}>
          {benefitCards.map((benefit, index) => (
            <Animated.View
              key={index}
              style={[
                dynamicStyles.benefitCard,
                {
                  transform: [
                    {
                      translateY: cardsAnim[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                  opacity: cardsAnim[index],
                },
              ]}
            >
              <View
                style={[
                  styles.benefitIcon,
                  { backgroundColor: benefit.color + '20' },
                ]}
              >
                <benefit.icon size={20} color={benefit.color} />
              </View>
              <Text style={dynamicStyles.benefitText}>{benefit.title}</Text>
            </Animated.View>
          ))}
        </View>

        {/* PRD: "Explore Your Dashboard" primary CTA pulsing gently */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Button
            title="Explore Your Dashboard"
            onPress={handleGoToDashboard}
            style={styles.primaryButton}
          />
        </Animated.View>

        {/* PRD: "Take a Quick Tour" secondary option */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleTakeTour}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
            Take a Quick Tour
          </Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dataLabel: {
    ...textStyles.bodyRegular,
    color: '#4A5568',
  },
  benefitsSection: {
    marginBottom: spacing.xl,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    marginBottom: spacing.lg,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    ...textStyles.bodyRegular,
    fontWeight: '500',
    marginRight: spacing.xs,
  },
  // Confetti animation is now handled by ConfettiAnimation component
});

export default OnboardingCompleteScreen;
