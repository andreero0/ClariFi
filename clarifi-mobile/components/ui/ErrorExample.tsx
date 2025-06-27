import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useErrorReporting } from '../../services/analytics/SentryProvider';

export const ErrorExample: React.FC = () => {
  const { reportError, reportMessage, addBreadcrumb, canReport } =
    useErrorReporting();

  const handleTestError = () => {
    try {
      throw new Error('This is a test error for Sentry integration');
    } catch (error) {
      reportError(error as Error, {
        test_context: 'manual_error_test',
        user_action: 'button_press',
        component: 'ErrorExample',
      });

      Alert.alert(
        'Error Reported',
        `Error has been ${canReport ? 'reported to Sentry' : 'logged locally'}`
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sentry Error Reporting Test</Text>
      <Text style={styles.status}>
        Error Reporting: {canReport ? '✅ Enabled' : '❌ Disabled'}
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleTestError}>
        <Text style={styles.buttonText}>Test Error Reporting</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorExample;
