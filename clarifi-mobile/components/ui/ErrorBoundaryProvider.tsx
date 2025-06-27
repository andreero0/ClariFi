import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import ErrorBoundary from './ErrorBoundary';

// Screen-level error boundary for major failures
export const ScreenErrorBoundary: React.FC<{
  children: ReactNode;
  screenName: string;
}> = ({ children, screenName }) => {
  const handleError = (error: Error) => {
    console.error(`Screen error in ${screenName}:`, error);
  };

  return (
    <ErrorBoundary level="screen" context={screenName} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};

// Feature-level error boundary for specific features
export const FeatureErrorBoundary: React.FC<{
  children: ReactNode;
  featureName: string;
}> = ({ children, featureName }) => {
  const handleError = (error: Error) => {
    console.error(`Feature error in ${featureName}:`, error);
  };

  const fallbackRenderer = (error: Error, resetError: () => void) => (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 10,
          textAlign: 'center',
        }}
      >
        Feature temporarily unavailable
      </Text>
      <Text style={{ marginBottom: 15, textAlign: 'center' }}>
        The {featureName} feature is experiencing issues.
      </Text>
      <TouchableOpacity
        onPress={resetError}
        style={{
          backgroundColor: '#007bff',
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 5,
        }}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ErrorBoundary
      level="feature"
      context={featureName}
      onError={handleError}
      fallback={fallbackRenderer}
    >
      {children}
    </ErrorBoundary>
  );
};

// Component-level error boundary for individual components
export const ComponentErrorBoundary: React.FC<{
  children: ReactNode;
  componentName: string;
}> = ({ children, componentName }) => {
  const handleError = (error: Error) => {
    console.warn(`Component error in ${componentName}:`, error);
  };

  const fallbackRenderer = (error: Error, resetError: () => void) => (
    <View
      style={{
        padding: 10,
        backgroundColor: '#ffeaa7',
        borderWidth: 1,
        borderColor: '#fdcb6e',
        borderRadius: 4,
        margin: 5,
      }}
    >
      <Text style={{ fontSize: 14 }}>Component unavailable</Text>
      <TouchableOpacity
        onPress={resetError}
        style={{
          marginTop: 5,
          paddingHorizontal: 8,
          paddingVertical: 2,
          backgroundColor: '#fdcb6e',
          borderRadius: 2,
        }}
      >
        <Text style={{ fontSize: 12 }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ErrorBoundary
      level="component"
      context={componentName}
      onError={handleError}
      fallback={fallbackRenderer}
    >
      {children}
    </ErrorBoundary>
  );
};

// Network operation error boundary
export const NetworkErrorBoundary: React.FC<{
  children: ReactNode;
  operation: string;
}> = ({ children, operation }) => {
  const handleError = (error: Error) => {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      Alert.alert(
        'Connection Issue',
        `Unable to ${operation}. Please check your internet connection and try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ErrorBoundary
      level="feature"
      context={`network_${operation}`}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
};

// Authentication error boundary
export const AuthErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const handleError = (error: Error) => {
    if (
      error.message.includes('auth') ||
      error.message.includes('unauthorized')
    ) {
      console.error('Authentication error:', error);
    }
  };

  return (
    <ErrorBoundary
      level="feature"
      context="authentication"
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
};

// Critical operations error boundary (payments, data modification)
export const CriticalErrorBoundary: React.FC<{
  children: ReactNode;
  operation: string;
}> = ({ children, operation }) => {
  const handleError = (error: Error) => {
    Alert.alert(
      'Critical Error',
      `A critical error occurred during ${operation}. Please contact support if this continues.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ErrorBoundary
      level="screen"
      context={`critical_${operation}`}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
