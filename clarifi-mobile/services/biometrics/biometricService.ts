import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const SECURE_STORE_BIOMETRIC_USER_KEY = 'clarifi_biometric_user_id';

interface BiometricUser {
  userId: string;
  // email?: string; // Could store email if needed for display, but userId is key
}

const biometricService = {
  /**
   * Checks if biometric authentication is supported on the device and if biometrics are enrolled.
   */
  async isBiometricSupported(): Promise<{
    supported: boolean;
    enrolled: boolean;
    error?: string;
  }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return {
          supported: false,
          enrolled: false,
          error: 'No biometric hardware found.',
        };
      }
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return { supported: true, enrolled: isEnrolled };
    } catch (error) {
      console.error('[BiometricService] Error checking support:', error);
      return {
        supported: false,
        enrolled: false,
        error: (error as Error).message,
      };
    }
  },

  /**
   * Prompts the user for biometric authentication.
   */
  async authenticate(
    promptMessage: string = 'Authenticate to proceed'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        disableDeviceFallback: true, // Recommended to avoid PIN/Pattern fallback for this specific use case
        cancelLabel: 'Cancel',
      });
      return result;
    } catch (error) {
      console.error('[BiometricService] Error during authentication:', error);
      // Errors can be like 'user_cancel', 'system_cancel', 'lockout', etc.
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Enables biometric login for a given user ID by storing it securely.
   * This should be called AFTER a successful primary authentication (e.g., password)
   * AND a successful biometric prompt to confirm enabling biometrics.
   */
  async enableBiometricForUser(userId: string): Promise<boolean> {
    try {
      const userToStore: BiometricUser = { userId };
      await SecureStore.setItemAsync(
        SECURE_STORE_BIOMETRIC_USER_KEY,
        JSON.stringify(userToStore)
      );
      return true;
    } catch (error) {
      console.error('[BiometricService] Error enabling biometric user:', error);
      return false;
    }
  },

  /**
   * Retrieves the user ID for whom biometric login was enabled.
   * Returns null if no user is set up or if there's an error.
   * IMPORTANT: Accessing this should ideally be gated by a successful biometric prompt first.
   */
  async getBiometricUser(): Promise<BiometricUser | null> {
    try {
      const storedUser = await SecureStore.getItemAsync(
        SECURE_STORE_BIOMETRIC_USER_KEY
      );
      if (storedUser) {
        return JSON.parse(storedUser) as BiometricUser;
      }
      return null;
    } catch (error) {
      console.error(
        '[BiometricService] Error retrieving biometric user:',
        error
      );
      return null;
    }
  },

  /**
   * Disables biometric login by removing the stored user ID.
   */
  async disableBiometricForUser(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(SECURE_STORE_BIOMETRIC_USER_KEY);
      return true;
    } catch (error) {
      console.error(
        '[BiometricService] Error disabling biometric user:',
        error
      );
      return false;
    }
  },
};

export default biometricService;
