import { supabase } from '../supabase';
import {
  AuthError,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
  User,
  Session,
  Subscription,
} from '@supabase/supabase-js';

// --- Type Definitions ---

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface UpdatePasswordCredentials {
  newPassword_1: string;
  newPassword_2: string;
}

// --- Authentication Service ---

const authService = {
  /**
   * Handles user sign-up with email and password.
   */
  signUp: async (
    credentials: SignUpWithPasswordCredentials
  ): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp(credentials);
      return { user: data.user, session: data.session, error };
    } catch (err) {
      return {
        user: null,
        session: null,
        error: {
          name: 'SignUpError',
          message:
            (err as Error).message ||
            'An unknown error occurred during sign up.',
          status: 0, // Or some other appropriate status
        } as AuthError,
      };
    }
  },

  /**
   * Handles user sign-in with email and password.
   */
  signIn: async (
    credentials: SignInWithPasswordCredentials
  ): Promise<AuthResponse> => {
    try {
      const { data, error } =
        await supabase.auth.signInWithPassword(credentials);
      return { user: data.user, session: data.session, error };
    } catch (err) {
      return {
        user: null,
        session: null,
        error: {
          name: 'SignInError',
          message:
            (err as Error).message ||
            'An unknown error occurred during sign in.',
          status: 0,
        } as AuthError,
      };
    }
  },

  /**
   * Handles user sign-out.
   */
  signOut: async (): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      return {
        error: {
          name: 'SignOutError',
          message:
            (err as Error).message ||
            'An unknown error occurred during sign out.',
          status: 0,
        } as AuthError,
      };
    }
  },

  /**
   * Sends a password reset email to the user.
   */
  requestPasswordReset: async (
    email: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // TODO: Configure redirect URL if needed, or remove if Supabase handles it
        // redirectTo: 'clarifi-mobile://reset-password',
      });
      return { error };
    } catch (err) {
      return {
        error: {
          name: 'PasswordResetError',
          message:
            (err as Error).message ||
            'An unknown error occurred during password reset request.',
          status: 0,
        } as AuthError,
      };
    }
  },

  /**
   * Updates the user's password. Typically used after a password reset.
   * Supabase client's updateUser is used for this when the user is logged in.
   * If handling password update via a recovery link, the user might already be in a session
   * provided by Supabase after clicking the link.
   */
  updateUserPassword: async (
    newPassword_1: string // Supabase updateUser takes a single 'password' field
  ): Promise<AuthResponse> => {
    try {
      // Password update usually happens when user is authenticated
      // or has a valid recovery session.
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword_1,
      });
      return { user: data.user, session: null, error }; // Session might not be directly returned/updated here
    } catch (err) {
      return {
        user: null,
        session: null,
        error: {
          name: 'UpdatePasswordError',
          message:
            (err as Error).message ||
            'An unknown error occurred during password update.',
          status: 0,
        } as AuthError,
      };
    }
  },

  /**
   * Gets the current session.
   */
  getSession: async (): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      return { user: data.session?.user ?? null, session: data.session, error };
    } catch (err) {
      return {
        user: null,
        session: null,
        error: {
          name: 'GetSessionError',
          message:
            (err as Error).message ||
            'An unknown error occurred while fetching session.',
          status: 0,
        } as AuthError,
      };
    }
  },

  /**
   * Listens to authentication state changes.
   * The callback will receive an event string and the session object.
   * It's up to the consuming part of the app (e.g., AuthContext) to manage the subscription.
   */
  onAuthStateChange: (
    callback: (event: string, session: Session | null) => void
  ): { data: { subscription: Subscription } } => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

export default authService;
