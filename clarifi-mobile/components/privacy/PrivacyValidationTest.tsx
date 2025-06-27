import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import PrivacyManager, {
  ConsentLevel,
} from '../../services/privacy/PrivacyManager';

interface ValidationResult {
  test: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
}

const PrivacyValidationTest: React.FC = () => {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const privacyManager = PrivacyManager.getInstance();

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    const testResults: ValidationResult[] = [];

    try {
      // Test 1: Privacy Manager Initialization
      testResults.push(await testPrivacyManagerInitialization());

      // Test 2: Consent Level Validation
      testResults.push(await testConsentLevelValidation());

      // Test 3: Analytics Opt-Out Functionality
      testResults.push(await testAnalyticsOptOut());

      // Test 4: Data Sanitization
      testResults.push(await testDataSanitization());

      // Test 5: Marketing Opt-Out (Default Disabled)
      testResults.push(await testMarketingOptOut());
    } catch (error) {
      testResults.push({
        test: 'Test Suite Execution',
        status: 'fail',
        message: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    setResults(testResults);
    setIsRunning(false);

    const passed = testResults.filter(r => r.status === 'pass').length;
    const total = testResults.length;

    Alert.alert(
      'Privacy Validation Complete',
      `Results: ${passed}/${total} tests passed`,
      [{ text: 'OK' }]
    );
  };

  const testPrivacyManagerInitialization =
    async (): Promise<ValidationResult> => {
      try {
        await privacyManager.initialize();
        const settings = await privacyManager.getPrivacySettings();

        return {
          test: 'Privacy Manager Initialization',
          status: settings !== null ? 'pass' : 'fail',
          message:
            settings !== null
              ? 'Privacy manager initialized successfully'
              : 'Failed to initialize privacy manager',
        };
      } catch (error) {
        return {
          test: 'Privacy Manager Initialization',
          status: 'fail',
          message: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    };

  const testConsentLevelValidation = async (): Promise<ValidationResult> => {
    try {
      const marketingConsent = await privacyManager.hasConsent(
        ConsentLevel.MARKETING
      );

      return {
        test: 'Consent Level Validation',
        status: !marketingConsent ? 'pass' : 'fail',
        message: !marketingConsent
          ? 'Marketing properly disabled by default (PIPEDA compliant)'
          : 'Marketing should be disabled by default for privacy compliance',
      };
    } catch (error) {
      return {
        test: 'Consent Level Validation',
        status: 'fail',
        message: `Consent validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };

  const testAnalyticsOptOut = async (): Promise<ValidationResult> => {
    try {
      const canTrackAnalytics = await privacyManager.canTrackAnalytics();
      const analyticsConsent = await privacyManager.hasConsent(
        ConsentLevel.ANALYTICS
      );

      const consistent = canTrackAnalytics === analyticsConsent;

      return {
        test: 'Analytics Opt-Out Functionality',
        status: consistent ? 'pass' : 'fail',
        message: consistent
          ? `Analytics tracking properly respects consent: ${canTrackAnalytics ? 'enabled' : 'disabled'}`
          : 'Analytics tracking not consistent with consent settings',
      };
    } catch (error) {
      return {
        test: 'Analytics Opt-Out Functionality',
        status: 'fail',
        message: `Analytics opt-out test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };

  const testDataSanitization = async (): Promise<ValidationResult> => {
    try {
      const testData = {
        email: 'user@example.com',
        name: 'John Doe',
        userAction: 'button_click',
        timestamp: new Date().toISOString(),
      };

      const sanitized = privacyManager.sanitizeAnalyticsData(testData);

      const hasSensitiveData = sanitized.email || sanitized.name;
      const hasNonSensitiveData = sanitized.userAction && sanitized.timestamp;

      const sanitizationWorking = !hasSensitiveData && hasNonSensitiveData;

      return {
        test: 'Data Sanitization',
        status: sanitizationWorking ? 'pass' : 'fail',
        message: sanitizationWorking
          ? 'Data sanitization working correctly - PII removed, safe data preserved'
          : 'Data sanitization failed - sensitive data may not be properly filtered',
      };
    } catch (error) {
      return {
        test: 'Data Sanitization',
        status: 'fail',
        message: `Data sanitization test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };

  const testMarketingOptOut = async (): Promise<ValidationResult> => {
    try {
      const marketingConsent = await privacyManager.hasConsent(
        ConsentLevel.MARKETING
      );

      return {
        test: 'Marketing Opt-Out Default',
        status: !marketingConsent ? 'pass' : 'fail',
        message: !marketingConsent
          ? 'Marketing properly disabled by default (PIPEDA compliant)'
          : 'Marketing should be disabled by default for privacy compliance',
      };
    } catch (error) {
      return {
        test: 'Marketing Opt-Out Default',
        status: 'fail',
        message: `Marketing opt-out test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };

  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'pass':
        return '✅';
      case 'fail':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Privacy Controls Validation</Text>
        <Text style={styles.subtitle}>
          Verify that all privacy controls are working correctly
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.runButton, isRunning && styles.runButtonDisabled]}
        onPress={runAllTests}
        disabled={isRunning}
      >
        <Text style={styles.runButtonText}>
          {isRunning ? '🔄 Running Tests...' : '🧪 Run Privacy Tests'}
        </Text>
      </TouchableOpacity>

      {results.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Test Results</Text>

          {results.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultIcon}>
                  {getStatusIcon(result.status)}
                </Text>
                <Text style={styles.resultTest}>{result.test}</Text>
              </View>
              <Text style={styles.resultMessage}>{result.message}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  runButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  runButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  runButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  resultItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  resultIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  resultTest: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  resultMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 30,
    color: '#6c757d',
  },
});

export default PrivacyValidationTest;
