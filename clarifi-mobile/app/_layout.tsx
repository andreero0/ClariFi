import '../polyfills'; // Load ALL polyfills FIRST
import '../constants/spacing'; // Load spacing FIRST to prevent early access errors
import '../constants/colors'; // Load colors FIRST to prevent early access errors
import '../constants/typography'; // Load textStyles FIRST to prevent early access errors
import '../constants/theme'; // Load theme FIRST to prevent early access errors
import '../constants/merchants'; // Load merchants FIRST to ensure no UUID issues
import React, { useEffect, useState } from 'react';
import { SplashScreen, Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, LocalizationProvider } from '../context';
import { ThemeProvider } from '../context/ThemeContext';
import { OnboardingProvider } from '../context/OnboardingContext';
import { AchievementProvider } from '../context/AchievementContext';
import { SentryProvider } from '../services/analytics/SentryProvider';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { InAppAlertBanner } from '../components/notifications/InAppAlertBanner';
import { useInAppAlerts } from '../services/notifications/InAppAlertService';
import { utilizationMonitoringService } from '../services/notifications/UtilizationMonitoringService';
import '../utils/logbox-config';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const [isReady, setIsReady] = useState(false);
  const { currentAlert, dismissCurrentAlert } = useInAppAlerts();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      SplashScreen.hideAsync();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Handle navigation intents from alert system
  useEffect(() => {
    const unsubscribe = utilizationMonitoringService.subscribeToNavigation(
      intent => {
        if (intent) {
          router.push({
            pathname: intent.pathname as any,
            params: intent.params,
          });
          utilizationMonitoringService.clearNavigationIntent();
        }
      }
    );

    return unsubscribe;
  }, [router]);

  return (
    <>
      <Slot />
      <InAppAlertBanner alert={currentAlert} onDismiss={dismissCurrentAlert} />
    </>
  );
}

const RootLayout: React.FC = () => {
  return (
    <ErrorBoundary>
      <LocalizationProvider>
        <SentryProvider>
          <AuthProvider>
            <ThemeProvider>
              <OnboardingProvider>
                <AchievementProvider>
                  <RootLayoutNav />
                </AchievementProvider>
              </OnboardingProvider>
            </ThemeProvider>
          </AuthProvider>
        </SentryProvider>
      </LocalizationProvider>
    </ErrorBoundary>
  );
};

export default RootLayout;
