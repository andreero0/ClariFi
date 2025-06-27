import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="biometric-setup" />
      <Stack.Screen name="bank-selection" />
      <Stack.Screen name="statement-instructions" />
      <Stack.Screen name="statement-capture" />
      <Stack.Screen name="statement-processing" />
      <Stack.Screen name="onboarding-complete" />
    </Stack>
  );
}
