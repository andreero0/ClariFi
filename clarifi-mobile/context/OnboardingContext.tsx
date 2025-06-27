import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Storage Keys ---
const ONBOARDING_DATA_KEY = 'onboarding_data';
const ONBOARDING_PROGRESS_KEY = 'onboarding_progress';

// --- Types ---
export type OnboardingStep =
  | 'welcome'
  | 'register'
  | 'password-creation'
  | 'biometric-setup'
  | 'bank-selection'
  | 'statement-instructions'
  | 'statement-capture'
  | 'statement-processing'
  | 'onboarding-complete';

interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  canResume: boolean;
}

interface OnboardingState {
  selectedBankIds: string[];
  biometricConsent: boolean | null; // null = not asked, true = consented, false = denied
  progress: OnboardingProgress;
  isLoading: boolean;
}

interface OnboardingContextValue extends OnboardingState {
  setSelectedBankIds: (bankIds: string[]) => void;
  setBiometricConsent: (consent: boolean) => void;
  setCurrentStep: (step: OnboardingStep) => void;
  markStepComplete: (step: OnboardingStep) => void;
  resetOnboardingState: () => void;
  loadOnboardingData: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined
);

// --- OnboardingProvider Component ---

interface OnboardingProviderProps {
  children: ReactNode;
}

const initialOnboardingState: OnboardingState = {
  selectedBankIds: [],
  biometricConsent: null,
  progress: {
    currentStep: 'welcome',
    completedSteps: [],
    canResume: false,
  },
  isLoading: true,
};

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
}) => {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(
    initialOnboardingState
  );

  // Persist data to AsyncStorage
  const persistData = useCallback(async (data: Partial<OnboardingState>) => {
    try {
      const currentData = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
      const existingData = currentData ? JSON.parse(currentData) : {};
      const updatedData = { ...existingData, ...data };
      await AsyncStorage.setItem(
        ONBOARDING_DATA_KEY,
        JSON.stringify(updatedData)
      );
    } catch (error) {
      console.error('Failed to persist onboarding data:', error);
    }
  }, []);

  // Load data from AsyncStorage
  const loadOnboardingData = useCallback(async () => {
    try {
      setOnboardingState(prev => ({ ...prev, isLoading: true }));

      const storedData = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setOnboardingState(prev => ({
          ...prev,
          ...parsedData,
          isLoading: false,
        }));
      } else {
        setOnboardingState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
      setOnboardingState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadOnboardingData();
  }, [loadOnboardingData]);

  const setSelectedBankIds = useCallback(
    (bankIds: string[]) => {
      const update = { selectedBankIds: bankIds };
      setOnboardingState(prevState => ({ ...prevState, ...update }));
      persistData(update);
    },
    [persistData]
  );

  const setBiometricConsent = useCallback(
    (consent: boolean) => {
      const update = { biometricConsent: consent };
      setOnboardingState(prevState => ({ ...prevState, ...update }));
      persistData(update);
    },
    [persistData]
  );

  const setCurrentStep = useCallback(
    (step: OnboardingStep) => {
      const update = {
        progress: {
          ...onboardingState.progress,
          currentStep: step,
          canResume: true,
        },
      };
      setOnboardingState(prevState => ({ ...prevState, ...update }));
      persistData(update);
    },
    [onboardingState.progress, persistData]
  );

  const markStepComplete = useCallback(
    (step: OnboardingStep) => {
      const completedSteps = [...onboardingState.progress.completedSteps];
      if (!completedSteps.includes(step)) {
        completedSteps.push(step);
      }

      const update = {
        progress: {
          ...onboardingState.progress,
          completedSteps,
          canResume: true,
        },
      };
      setOnboardingState(prevState => ({ ...prevState, ...update }));
      persistData(update);
    },
    [onboardingState.progress, persistData]
  );

  const resetOnboardingState = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
      setOnboardingState(initialOnboardingState);
    } catch (error) {
      console.error('Failed to reset onboarding state:', error);
    }
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        ...onboardingState,
        setSelectedBankIds,
        setBiometricConsent,
        setCurrentStep,
        markStepComplete,
        resetOnboardingState,
        loadOnboardingData,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

// --- Custom Hook ---

export const useOnboarding = (): OnboardingContextValue => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
