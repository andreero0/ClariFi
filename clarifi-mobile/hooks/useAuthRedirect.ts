import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useOnboarding, OnboardingStep } from '../context/OnboardingContext';

// Map onboarding steps to actual routes
const getRouteForStep = (step: OnboardingStep): string => {
  const stepRoutes: Record<OnboardingStep, string> = {
    welcome: '/(auth)/welcome',
    register: '/(auth)/register',
    'password-creation': '/(auth)/password-creation',
    'biometric-setup': '/(auth)/biometric-setup',
    'bank-selection': '/(auth)/bank-selection',
    'statement-instructions': '/(auth)/statement-instructions',
    'statement-capture': '/(auth)/statement-capture',
    'statement-processing': '/(auth)/statement-processing',
    'onboarding-complete': '/(auth)/onboarding-complete',
  };
  return stepRoutes[step];
};

export function useAuthRedirect() {
  const { session, isLoading, user, onboardingStatus } = useAuth();
  const { progress, isLoading: onboardingLoading } = useOnboarding();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading || onboardingLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const currentRoute = `/${segments.join('/')}`;
    
    console.log('Auth Redirect:', {
      session: !!session,
      user: !!user,
      onboardingStatus,
      currentRoute,
      inAuthGroup,
      inTabsGroup
    });

    if (session && user) {
      // User is authenticated
      if (onboardingStatus === 'complete') {
        // Onboarding is complete, redirect to main app
        if (inAuthGroup) {
          console.log('Auth Redirect: Navigating to dashboard from auth group');
          router.replace('/(tabs)/dashboard');
        }
      } else if (onboardingStatus === 'pending') {
        // User is authenticated but onboarding not complete
        if (inTabsGroup) {
          // Check if we can resume onboarding from where user left off
          if (progress.canResume && progress.currentStep) {
            const resumeRoute = getRouteForStep(progress.currentStep);
            console.log(
              `Resuming onboarding at step: ${progress.currentStep} -> ${resumeRoute}`
            );
            router.replace(resumeRoute as any);
          } else {
            // Start fresh onboarding
            router.replace('/(auth)/onboarding');
          }
        } else if (inAuthGroup) {
          // User is in auth group but may not be on the right step
          const expectedRoute = getRouteForStep(progress.currentStep);
          if (currentRoute !== expectedRoute && progress.canResume) {
            console.log(
              `Redirecting to correct onboarding step: ${progress.currentStep} -> ${expectedRoute}`
            );
            router.replace(expectedRoute as any);
          }
        }
      }
      // If onboardingStatus is 'unknown', let the current flow continue
    } else {
      // User is not authenticated
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
    }
  }, [
    session,
    user,
    isLoading,
    onboardingStatus,
    progress,
    onboardingLoading,
    segments,
    router,
  ]);
}
