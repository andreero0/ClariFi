import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
  Platform,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { translate } from '../../i18n';
import { useTheme } from '../../context/ThemeContext';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { useOnboarding } from '../../context/OnboardingContext';

const { width, height } = Dimensions.get('window');

// PRD: Particle component for background animation
const ParticleComponent: React.FC<{ delay: number; startX: number }> = ({
  delay,
  startX,
}) => {
  const translateY = useRef(new Animated.Value(height + 50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      // Reset position
      translateY.setValue(height + 50);
      opacity.setValue(0);

      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 8000, // 8 seconds to travel screen height
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Restart animation with random delay
        setTimeout(startAnimation, Math.random() * 3000 + 2000);
      });
    };

    // Start with initial delay
    setTimeout(startAnimation, delay);
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
};

// PRD: Particle system for background
const ParticleSystem: React.FC = () => {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: Math.random() * 5000,
    startX: Math.random() * width,
  }));

  return (
    <View style={styles.particleContainer}>
      {particles.map(particle => (
        <ParticleComponent
          key={particle.id}
          delay={particle.delay}
          startX={particle.startX}
        />
      ))}
    </View>
  );
};

export default function WelcomeScreen() {
  const { theme: colors } = useTheme();
  const { setCurrentStep } = useOnboarding();
  const router = useRouter();

  // PRD: Animation values for logo and content
  const logoFadeAnim = useRef(new Animated.Value(0)).current;
  const headlineFadeAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const contentTranslateAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const ctaFadeAnim = useRef(new Animated.Value(0)).current;
  const ctaTranslateAnim = useRef(new Animated.Value(30)).current;
  const cardAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Mark welcome as current step
    setCurrentStep('welcome');

    // PRD: Logo fade-in animation (300ms ease-out)
    Animated.timing(logoFadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      // PRD: Headline appears 100ms after logo
      setTimeout(() => {
        Animated.timing(headlineFadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start(() => {
          // PRD: Staggered card animations (50ms delays)
          Animated.stagger(50, 
            cardAnims.map((anim) =>
              Animated.timing(anim, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.back(1.1)),
                useNativeDriver: true,
              })
            )
          ).start(() => {
            // Animate CTA buttons after cards complete
            setTimeout(() => {
              Animated.parallel([
                Animated.timing(ctaFadeAnim, {
                  toValue: 1,
                  duration: 500,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
                Animated.timing(ctaTranslateAnim, {
                  toValue: 0,
                  duration: 500,
                  easing: Easing.out(Easing.back(1.1)),
                  useNativeDriver: true,
                }),
              ]).start();
            }, 150); // Small delay after cards finish
          });
        });
      }, 100);
    });
  }, []);

  const handleGetStarted = async () => {
    // PRD: Haptic feedback on button press
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Direct navigation using router
    router.push('/(auth)/register');
  };

  // PRD: Value proposition cards with exact specifications
  const valueCards = [
    {
      icon: 'shield-checkmark',
      iconColor: colors.primary, // Clarity Blue
      title: 'Bank-level Security',
      description: 'Your data stays private and encrypted',
    },
    {
      icon: 'bulb',
      iconColor: colors.wisdom || colors.primary, // Wisdom Purple
      title: 'AI-Powered Insights',
      description: 'Smart categorization and recommendations',
    },
    {
      icon: 'location',
      iconColor: colors.growth || colors.success, // Growth Green
      title: 'Built for Canada',
      description: 'Supports all major Canadian banks',
    },
  ];

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary || colors.appBackground,
    },
    logoText: {
      ...textStyles.h1,
      fontSize: 32, // PRD: 80dp height equivalent
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -1.5,
    },
    headline: {
      ...textStyles.h1,
      fontSize: 32,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    valueCard: {
      backgroundColor: colors.surface || colors.backgroundSecondary,
      borderRadius: 16,
      padding: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    cardTitle: {
      ...textStyles.h3,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    cardDescription: {
      ...textStyles.bodyRegular,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      height: 48, // PRD: 48dp height
      borderRadius: 12, // PRD: 12dp corner radius
      paddingHorizontal: 20, // PRD: 20dp horizontal padding
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryButtonText: {
      fontSize: 16, // PRD: Button text 16dp
      fontWeight: '500', // PRD: Medium (500)
      color: colors.surface || '#FFFFFF',
      letterSpacing: 0.5, // PRD: 0.5dp letter-spacing
    },
    linkText: {
      ...textStyles.bodySmall,
      color: colors.primary,
      textAlign: 'center',
      fontWeight: '400',
    },
  });

  return (
    <View style={dynamicStyles.container}>
      {/* PRD: Full screen background gradient from Cloud Gray to Pure White */}
      <LinearGradient
        colors={[colors.cloudGray || '#F7F9FC', colors.surface || '#FFFFFF']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* PRD: Particle animation background */}
      <ParticleSystem />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Animated.View
          style={{
            flex: 1,
            opacity: contentFadeAnim,
            transform: [{ translateY: contentTranslateAnim }],
          }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* PRD: ClariFi logo centered at 20% from top */}
            <Animated.View
              style={[
                styles.logoSection,
                {
                  marginTop: height * 0.08, // Reduced from 20% to 8% for better positioning
                  opacity: logoFadeAnim,
                },
              ]}
            >
              <Text style={dynamicStyles.logoText}>ClariFi</Text>
            </Animated.View>

            {/* PRD: Headline appears 100ms after logo */}
            <Animated.View style={{ opacity: headlineFadeAnim }}>
              <Text style={dynamicStyles.headline}>
                Welcome to Financial Clarity
              </Text>
            </Animated.View>

            {/* PRD: Three value proposition cards with staggered animations */}
            <View style={styles.cardsContainer}>
              {valueCards.map((card, index) => (
                <Animated.View
                  key={index}
                  style={{
                    opacity: cardAnims[index],
                    transform: [
                      {
                        translateY: cardAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <View style={dynamicStyles.valueCard}>
                    <Ionicons
                      name={card.icon as any}
                      size={24}
                      color={card.iconColor}
                      style={styles.cardIcon}
                    />
                    <Text style={dynamicStyles.cardTitle}>{card.title}</Text>
                    <Text style={dynamicStyles.cardDescription}>
                      {card.description}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* PRD: Primary CTA button (full width minus 48dp) */}
            <Animated.View 
              style={[
                styles.ctaContainer,
                {
                  opacity: ctaFadeAnim,
                  transform: [{ translateY: ctaTranslateAnim }],
                }
              ]}
            >
              <TouchableOpacity
                style={dynamicStyles.primaryButton}
                onPress={handleGetStarted}
                activeOpacity={0.8}
                accessible={true}
                accessibilityLabel="Get Started"
                accessibilityRole="button"
              >
                <Text style={dynamicStyles.primaryButtonText}>
                  Get Started
                </Text>
              </TouchableOpacity>

              {/* PRD: "Already have an account? Sign in" link */}
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity
                  style={styles.linkButton}
                  accessible={true}
                  accessibilityLabel="Already have an account? Sign in"
                  accessibilityRole="button"
                >
                  <Text style={dynamicStyles.linkText}>
                    Already have an account? Sign in
                  </Text>
                </TouchableOpacity>
              </Link>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  particleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#2B5CE6', // Clarity Blue with transparency
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24, // PRD: 24dp screen edge padding
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  cardsContainer: {
    paddingHorizontal: 0,
  },
  cardIcon: {
    marginBottom: spacing.lg,
  },
  spacer: {
    flex: 1,
    minHeight: spacing.xl,
  },
  ctaContainer: {
    paddingBottom: spacing.lg,
    paddingHorizontal: 24, // PRD: Full width minus 48dp (24dp each side)
  },
  linkButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 44, // Accessibility touch target
  },
});
