import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import {
  Session,
  User,
  AuthError,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import {
  authService,
  AuthResponse as AuthServiceAuthResponse,
} from '../services/auth'; // Changed to relative path
import {
  socialAuthService,
  SocialAuthResponse,
} from '../services/auth/socialAuthService';
import biometricService from '../services/biometrics/biometricService'; // Direct import
import DataRetentionScheduler from '../services/privacy/DataRetentionScheduler';

// --- State and Context Value Definitions ---

// Key for AsyncStorage
const ONBOARDING_STATUS_KEY = '@clarifi_onboarding_status';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean; // General loading state for initial session check
  isSigningIn: boolean;
  isSigningUp: boolean;
  isSigningOut: boolean;
  isRequestingPasswordReset: boolean;
  isUpdatingPassword: boolean;
  error: AuthError | null | { name: string; message: string }; // Allow custom errors

  // Biometric state
  isCheckingBiometrics: boolean;
  isBiometricHardwareAvailable: boolean | null;
  isBiometricEnrolled: boolean | null;
  isSettingUpBiometrics: boolean;
  isLoggingInWithBiometrics: boolean;
  isBiometricLoginEnabled: boolean; // Is it enabled for the current/last user?

  // Onboarding state
  onboardingStatus: 'pending' | 'complete' | 'unknown'; // Added onboardingStatus
}

interface AuthContextValue extends AuthState {
  signIn: (
    credentials: SignInWithPasswordCredentials
  ) => Promise<AuthServiceAuthResponse>;
  signUp: (
    credentials: SignUpWithPasswordCredentials
  ) => Promise<AuthServiceAuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: AuthError | null }>;
  updateUserPassword: (
    newPassword_1: string
  ) => Promise<AuthServiceAuthResponse>;
  clearError: () => void;

  // Biometric functions
  checkBiometricSupport: () => Promise<void>;
  enableBiometricLogin: () => Promise<boolean>;
  attemptBiometricLogin: () => Promise<boolean>; // True if bio auth passes, session relies on Supabase
  disableBiometricLogin: () => Promise<boolean>;

  // Onboarding function
  markOnboardingComplete: () => Promise<void>; // Added markOnboardingComplete

  // Social auth functions
  signInWithGoogle: () => Promise<SocialAuthResponse>;
  signInWithApple: () => Promise<SocialAuthResponse>;
  signInWithFacebook: () => Promise<SocialAuthResponse>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// --- AuthProvider Component ---

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isSigningIn: false,
    isSigningUp: false,
    isSigningOut: false,
    isRequestingPasswordReset: false,
    isUpdatingPassword: false,
    error: null,
    // Biometric initial state
    isCheckingBiometrics: false,
    isBiometricHardwareAvailable: null,
    isBiometricEnrolled: null,
    isSettingUpBiometrics: false,
    isLoggingInWithBiometrics: false,
    isBiometricLoginEnabled: false,
    onboardingStatus: 'unknown', // Initialize onboardingStatus
  });

  const checkBiometricSupport = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isCheckingBiometrics: true }));
    const { supported, enrolled, error } =
      await biometricService.isBiometricSupported();
    setAuthState(prev => ({
      ...prev,
      isBiometricHardwareAvailable: supported,
      isBiometricEnrolled: enrolled,
      isCheckingBiometrics: false,
      error: error
        ? { name: 'BiometricSupportError', message: error }
        : prev.error,
    }));
  }, []);

  // Check and update biometric login enabled status based on stored user and current user
  const refreshBiometricEnabledStatus = useCallback(
    async (currentUserId: string | null) => {
      if (!currentUserId) {
        setAuthState(prev => ({ ...prev, isBiometricLoginEnabled: false }));
        return;
      }
      const biometricUser = await biometricService.getBiometricUser();
      setAuthState(prev => ({
        ...prev,
        isBiometricLoginEnabled:
          !!biometricUser && biometricUser.userId === currentUserId,
      }));
    },
    []
  );

  // Function to load onboarding status from AsyncStorage
  const loadOnboardingStatus = useCallback(async () => {
    try {
      const status = await AsyncStorage.getItem(ONBOARDING_STATUS_KEY);
      if (status === 'complete') {
        setAuthState(prev => ({ ...prev, onboardingStatus: 'complete' }));
      } else {
        setAuthState(prev => ({ ...prev, onboardingStatus: 'pending' }));
      }
    } catch (e) {
      console.error('Failed to load onboarding status from storage', e);
      setAuthState(prev => ({ ...prev, onboardingStatus: 'pending' })); // Default to pending on error
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await checkBiometricSupport(); // Check biometric support early
      await loadOnboardingStatus(); // Load onboarding status
      const { user, session, error } = await authService.getSession();
      setAuthState(prev => ({
        ...prev,
        user,
        session,
        isLoading: false,
        error: error || null,
      }));
      if (user) {
        refreshBiometricEnabledStatus(user.id);
      }
    };

    initAuth();

    const { data: authListener } = authService.onAuthStateChange(
      async (_event, session) => {
        setAuthState(prev => ({
          ...prev,
          session: session,
          user: session?.user ?? null,
          isLoading: false,
        }));
        if (session?.user) {
          refreshBiometricEnabledStatus(session.user.id);
          // If user changes, reload their onboarding status or reset if new user
          await loadOnboardingStatus();
        } else {
          // User logged out, reflect this in biometric status too if needed
          // For now, isBiometricLoginEnabled will be false if no current user on next check
          setAuthState(prev => ({
            ...prev,
            isBiometricLoginEnabled: false,
            onboardingStatus: 'pending',
          }));
        }
      }
    );
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [
    checkBiometricSupport,
    refreshBiometricEnabledStatus,
    loadOnboardingStatus,
  ]);

  const handleAuthOperation = async <
    T extends (...args: any[]) => Promise<any>,
  >(
    serviceFn: T,
    loadingStateKey: keyof AuthState,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> => {
    setAuthState(prev => ({ ...prev, [loadingStateKey]: true, error: null }));
    try {
      const response = await serviceFn(...args);
      // Update error state, other states (user, session) updated by onAuthStateChange
      setAuthState(prev => ({
        ...prev,
        [loadingStateKey]: false,
        error: response.error || null,
      }));
      return response;
    } catch (err) {
      const error = {
        name: 'UnhandledAuthError',
        message: (err as Error).message || 'An unexpected error occurred.',
      };
      setAuthState(prev => ({ ...prev, [loadingStateKey]: false, error }));
      return { error } as ReturnType<T>;
    }
  };

  const signIn = async (credentials: SignInWithPasswordCredentials) => {
    const response = await handleAuthOperation(
      authService.signIn,
      'isSigningIn',
      credentials
    );
    if (response.user) {
      refreshBiometricEnabledStatus(response.user.id);
      await loadOnboardingStatus(); // Reload onboarding status for the signed-in user
    }
    return response;
  };

  const signUp = async (credentials: SignUpWithPasswordCredentials) => {
    const response = await handleAuthOperation(
      authService.signUp,
      'isSigningUp',
      credentials
    );
    // For new sign-ups, onboarding is pending by default, no need to load, it will be set by `loadOnboardingStatus` or `markOnboardingComplete`
    if (response.user) {
      setAuthState(prev => ({ ...prev, onboardingStatus: 'pending' }));
    }
    return response;
  };

  const signOutUser = async () => {
    // Renamed to avoid conflict with service
    setAuthState(prev => ({
      ...prev,
      isBiometricLoginEnabled: false,
      onboardingStatus: 'pending',
    }));
    await biometricService.disableBiometricForUser(); // Also clear from secure store if desired
    return handleAuthOperation(authService.signOut, 'isSigningOut');
  };

  const requestPasswordReset = (email: string) =>
    handleAuthOperation(
      authService.requestPasswordReset,
      'isRequestingPasswordReset',
      email
    );

  const updateUserPassword = (newPassword_1: string) =>
    handleAuthOperation(
      authService.updateUserPassword,
      'isUpdatingPassword',
      newPassword_1
    );

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  // Biometric Functions
  const enableBiometricLogin = async (): Promise<boolean> => {
    if (!authState.user) {
      setAuthState(prev => ({
        ...prev,
        error: {
          name: 'BiometricSetupError',
          message: 'User must be logged in to set up biometrics.',
        },
      }));
      return false;
    }
    if (
      !authState.isBiometricHardwareAvailable ||
      !authState.isBiometricEnrolled
    ) {
      setAuthState(prev => ({
        ...prev,
        error: {
          name: 'BiometricSetupError',
          message: 'Biometrics not supported or not enrolled on this device.',
        },
      }));
      return false;
    }
    setAuthState(prev => ({
      ...prev,
      isSettingUpBiometrics: true,
      error: null,
    }));
    const authResult = await biometricService.authenticate(
      'Confirm identity to enable biometric login'
    );
    if (authResult.success && authState.user) {
      const stored = await biometricService.enableBiometricForUser(
        authState.user.id
      );
      setAuthState(prev => ({
        ...prev,
        isSettingUpBiometrics: false,
        isBiometricLoginEnabled: stored,
        error: stored
          ? null
          : {
              name: 'StorageError',
              message: 'Failed to save biometric preference.',
            },
      }));
      return stored;
    } else {
      setAuthState(prev => ({
        ...prev,
        isSettingUpBiometrics: false,
        error: {
          name: 'BiometricAuthError',
          message: authResult.error || 'Biometric authentication failed.',
        },
      }));
      return false;
    }
  };

  const attemptBiometricLogin = async (): Promise<boolean> => {
    setAuthState(prev => ({
      ...prev,
      isLoggingInWithBiometrics: true,
      error: null,
    }));
    const storedUser = await biometricService.getBiometricUser();
    if (!storedUser) {
      setAuthState(prev => ({
        ...prev,
        isLoggingInWithBiometrics: false,
        error: {
          name: 'BiometricLoginError',
          message: 'Biometric login not set up.',
        },
      }));
      return false;
    }

    const authResult = await biometricService.authenticate(
      'Login with biometrics'
    );
    if (authResult.success) {
      // Biometric authentication passed. Now, check if Supabase session is still valid.
      // The existing onAuthStateChange and initial getSession should handle setting the user/session state.
      // We just need to trigger a session check or rely on the one that happens at init.
      // Forcing a getSession() can be an option here if needed to ensure fresh state after bio.
      const { session } = await authService.getSession();
      if (session && session.user && session.user.id === storedUser.userId) {
        setAuthState(prev => ({
          ...prev,
          isLoggingInWithBiometrics: false,
          user: session.user,
          session,
          isBiometricLoginEnabled: true,
        }));
        return true;
      } else {
        // Biometric success, but no matching Supabase session or different user.
        // This could mean Supabase session expired or was for a different user.
        // Clear local biometric setup for this user as it might be stale or security risk.
        await biometricService.disableBiometricForUser();
        setAuthState(prev => ({
          ...prev,
          isLoggingInWithBiometrics: false,
          isBiometricLoginEnabled: false,
          error: {
            name: 'SessionError',
            message:
              'Biometric authentication succeeded, but no active session found. Please log in with your password.',
          },
        }));
        return false;
      }
    } else {
      setAuthState(prev => ({
        ...prev,
        isLoggingInWithBiometrics: false,
        error: {
          name: 'BiometricAuthError',
          message: authResult.error || 'Biometric login failed.',
        },
      }));
      return false;
    }
  };

  const disableBiometricLogin = async (): Promise<boolean> => {
    const disabled = await biometricService.disableBiometricForUser();
    setAuthState(prev => ({ ...prev, isBiometricLoginEnabled: !disabled }));
    return disabled;
  };

  // Onboarding Function Implementation
  const markOnboardingComplete = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STATUS_KEY, 'complete');
      setAuthState(prev => ({ ...prev, onboardingStatus: 'complete' }));
    } catch (e) {
      console.error('Failed to save onboarding status to storage', e);
      // Optionally, set an error state or re-throw
    }
  };

  // Social Authentication Functions
  const signInWithGoogle = async (): Promise<SocialAuthResponse> => {
    return handleAuthOperation(
      socialAuthService.signInWithGoogle,
      'isSigningIn'
    );
  };

  const signInWithApple = async (): Promise<SocialAuthResponse> => {
    return handleAuthOperation(
      socialAuthService.signInWithApple,
      'isSigningIn'
    );
  };

  const signInWithFacebook = async (): Promise<SocialAuthResponse> => {
    return handleAuthOperation(
      socialAuthService.signInWithFacebook,
      'isSigningIn'
    );
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signUp,
        signOut: signOutUser,
        requestPasswordReset,
        updateUserPassword,
        clearError,
        // Biometric
        checkBiometricSupport,
        enableBiometricLogin,
        attemptBiometricLogin,
        disableBiometricLogin,
        markOnboardingComplete, // Expose new function
        // Social Authentication
        signInWithGoogle,
        signInWithApple,
        signInWithFacebook,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// --- useAuth Hook ---

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
