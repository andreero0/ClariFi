// Example component demonstrating Sentry error reporting integration

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useErrorReporting } from '../../services/analytics/SentryProvider';

export const ErrorReportingExample: React.FC = () => {
  const { reportError, reportMessage, addBreadcrumb, canReport } =
    useErrorReporting();

  const handleTestError = () => {
    try {
      throw new Error('This is a test error for Sentry integration');
    } catch (error) {
      reportError(error as Error, {
        test_context: 'manual_error_test',
        user_action: 'button_press',
        component: 'ErrorReportingExample',
      });

      Alert.alert(
        'Error Reported',
        `Error has been ${canReport ? 'reported to Sentry' : 'logged locally'}`
      );
    }
  };

  const handleTestMessage = () => {
    reportMessage('Test message for Sentry integration', 'info', {
      test_context: 'manual_message_test',
      user_action: 'message_button_press',
    });

    Alert.alert(
      'Message Sent',
      `Message has been ${canReport ? 'sent to Sentry' : 'logged locally'}`
    );
  };

  const handleAddBreadcrumb = () => {
    addBreadcrumb({
      message: 'User tested breadcrumb functionality',
      category: 'test',
      level: 'info',
      data: {
        component: 'ErrorReportingExample',
        action: 'breadcrumb_test',
      },
    });

    Alert.alert(
      'Breadcrumb Added',
      `Breadcrumb has been ${canReport ? 'added to Sentry' : 'logged locally'}`
    );
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

      <TouchableOpacity style={styles.button} onPress={handleTestMessage}>
        <Text style={styles.buttonText}>Test Message Reporting</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleAddBreadcrumb}>
        <Text style={styles.buttonText}>Add Breadcrumb</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        {canReport
          ? 'Errors and messages will be sent to Sentry with privacy compliance.'
          : 'Error reporting is disabled due to privacy settings or configuration.'}
      </Text>
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
  note: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ErrorReportingExample;
