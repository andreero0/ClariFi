import { supabase } from '../supabase';
import { AuthError, Provider } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// For Apple Sign-In (iOS only)
let AppleAuthentication: any = null;
if (Platform.OS === 'ios') {
  try {
    AppleAuthentication = require('@invertase/react-native-apple-authentication');
  } catch (error) {
    console.log('Apple Authentication not available:', error);
  }
}

// For Google Sign-In
let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin');
} catch (error) {
  console.log('Google Sign-In not available:', error);
}

export interface SocialAuthResponse {
  user: any;
  session: any;
  error: AuthError | null;
}

class SocialAuthService {
  /**
   * Initialize Google Sign-In (call this in your app startup)
   */
  async initializeGoogleSignIn() {
    if (!GoogleSignin?.GoogleSignin) return;

    try {
      await GoogleSignin.GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // From Google Cloud Console
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        scopes: ['profile', 'email'],
      });
    } catch (error) {
      console.error('Google Sign-In initialization failed:', error);
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<SocialAuthResponse> {
    if (!GoogleSignin?.GoogleSignin) {
      return {
        user: null,
        session: null,
        error: {
          message: 'Google Sign-In not available',
          name: 'GoogleSignInError',
          status: 0,
        } as AuthError,
      };
    }

    try {
      // Check if device supports Google Play
      await GoogleSignin.GoogleSignin.hasPlayServices();

      // Get user info
      const userInfo = await GoogleSignin.GoogleSignin.signIn();

      if (!userInfo.idToken) {
        throw new Error('No ID token received from Google');
      }

      // Sign in with Supabase using the Google ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.idToken,
      });

      return {
        user: data.user,
        session: data.session,
        error,
      };
    } catch (error: any) {
      return {
        user: null,
        session: null,
        error: {
          message: error.message || 'Google Sign-In failed',
          name: 'GoogleSignInError',
          status: 0,
        } as AuthError,
      };
    }
  }

  /**
   * Sign in with Apple (iOS only)
   */
  async signInWithApple(): Promise<SocialAuthResponse> {
    if (Platform.OS !== 'ios' || !AppleAuthentication?.appleAuth) {
      return {
        user: null,
        session: null,
        error: {
          message: 'Apple Sign-In only available on iOS',
          name: 'AppleSignInError',
          status: 0,
        } as AuthError,
      };
    }

    try {
      // Generate a nonce for security
      const nonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString()
      );

      // Perform Apple authentication
      const appleAuthRequestResponse =
        await AppleAuthentication.appleAuth.performRequest({
          requestedOperation: AppleAuthentication.appleAuth.Operation.LOGIN,
          requestedScopes: [
            AppleAuthentication.appleAuth.Scope.FULL_NAME,
            AppleAuthentication.appleAuth.Scope.EMAIL,
          ],
          nonce,
        });

      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Sign in with Supabase using Apple ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: appleAuthRequestResponse.identityToken,
        nonce,
      });

      return {
        user: data.user,
        session: data.session,
        error,
      };
    } catch (error: any) {
      return {
        user: null,
        session: null,
        error: {
          message: error.message || 'Apple Sign-In failed',
          name: 'AppleSignInError',
          status: 0,
        } as AuthError,
      };
    }
  }

  /**
   * Sign in with OAuth provider using web browser (Facebook, etc.)
   */
  async signInWithOAuth(provider: Provider): Promise<SocialAuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'clarifi://auth/callback',
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      // Open the OAuth URL in a web browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'clarifi://auth/callback'
      );

      if (result.type === 'success') {
        // Extract the session from the URL
        const url = new URL(result.url);
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } =
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

          return {
            user: sessionData.user,
            session: sessionData.session,
            error: sessionError,
          };
        }
      }

      throw new Error('OAuth authentication was cancelled or failed');
    } catch (error: any) {
      return {
        user: null,
        session: null,
        error: {
          message: error.message || `${provider} Sign-In failed`,
          name: 'OAuthSignInError',
          status: 0,
        } as AuthError,
      };
    }
  }

  /**
   * Sign in with Facebook
   */
  async signInWithFacebook(): Promise<SocialAuthResponse> {
    return this.signInWithOAuth('facebook');
  }
}

export const socialAuthService = new SocialAuthService();
