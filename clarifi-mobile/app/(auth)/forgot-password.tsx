import { View, Text, StyleSheet, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useAuth } from '../../context';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const {
    requestPasswordReset,
    isRequestingPasswordReset,
    error: authError,
    clearError,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const handlePasswordReset = async () => {
    if (authError) clearError();
    setMessageSent(false);

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    const response = await requestPasswordReset(email);
    if (response && !response.error) {
      Alert.alert(
        'Check Your Email',
        'If an account exists for this email, a password reset link has been sent.'
      );
      setMessageSent(true);
      // setEmail(''); // Optionally clear email field
    } else if (response && response.error) {
      Alert.alert('Error', response.error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter your email address below and we'll send you a link to reset your
        password.
      </Text>
      <Input
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
      />
      {authError && !messageSent && (
        <Text style={styles.errorText}>{authError.message}</Text>
      )}
      {messageSent && (
        <Text style={styles.successText}>
          Reset link sent! Please check your email (including spam folder).
        </Text>
      )}
      <Button
        title={
          isRequestingPasswordReset ? 'Sending Link...' : 'Send Reset Link'
        }
        onPress={handlePasswordReset}
        disabled={isRequestingPasswordReset || messageSent}
        style={styles.button}
      />
      <View style={styles.linksContainer}>
        <Link href="/(auth)/login" style={styles.link}>
          <Text>Back to Login</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surface,
  },
  title: {
    ...textStyles.h1,
    color: colors.textPrimary,
    marginBottom: 20,
  },
  subtitle: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    width: '90%',
  },
  input: {
    width: '90%',
    marginBottom: 20,
  },
  button: {
    width: '90%',
    marginTop: 10,
  },
  linksContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  link: {
    fontSize: 16,
    color: '#2563eb',
    marginVertical: 8,
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    color: '#16a34a', // Green color for success
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
