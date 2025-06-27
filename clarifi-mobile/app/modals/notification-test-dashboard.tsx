import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { endToEndNotificationTestSuite } from '../../services/notifications/endToEndTestSuite';
import { notificationTestService } from '../../services/notifications/notificationTestService';

const { width } = Dimensions.get('window');

interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'pending';
  details: string;
  timestamp: Date;
  duration?: number;
  deviceInfo?: any;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  coverage: string;
  duration: number;
  deviceInfo: any;
}

type TestCategory =
  | 'permissions'
  | 'delivery'
  | 'integration'
  | 'performance'
  | 'accessibility'
  | 'compliance';

export default function NotificationTestDashboard() {
  const router = useRouter();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testSummary, setTestSummary] = useState<TestSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    TestCategory | 'all'
  >('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [currentTest, setCurrentTest] = useState<string>('');

  const testProgress = useRef(0);

  useEffect(() => {
    loadPreviousResults();
  }, []);

  const loadPreviousResults = async () => {
    // Load any previous test results from storage
    // This would be implemented with AsyncStorage
    console.log('Loading previous test results...');
  };

  const runCompleteTestSuite = async () => {
    setIsRunning(true);
    setCurrentTest('Initializing test suite...');

    try {
      const { results, summary } =
        await endToEndNotificationTestSuite.runCompleteTestSuite();
      setTestResults(results);
      setTestSummary(summary);
      setCurrentTest('');

      // Show completion alert
      Alert.alert(
        'Test Suite Complete',
        `Completed ${summary.total} tests\n✅ Passed: ${summary.passed}\n❌ Failed: ${summary.failed}\n⏸️ Pending: ${summary.pending}\n\nCoverage: ${summary.coverage}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Test Suite Error',
        `Failed to run test suite: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const runCategoryTests = async (category: TestCategory) => {
    setIsRunning(true);
    setCurrentTest(`Running ${category} tests...`);

    try {
      const results =
        await endToEndNotificationTestSuite.runTestCategory(category);
      setTestResults(prev => [
        ...prev.filter(r => !results.find(nr => nr.testName === r.testName)),
        ...results,
      ]);
      setCurrentTest('');

      const passed = results.filter(r => r.status === 'passed').length;
      const failed = results.filter(r => r.status === 'failed').length;

      Alert.alert(
        `${category.charAt(0).toUpperCase() + category.slice(1)} Tests Complete`,
        `✅ Passed: ${passed}\n❌ Failed: ${failed}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Category Test Error',
        `Failed to run ${category} tests: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const runExistingTestSuite = async () => {
    setIsRunning(true);
    setCurrentTest('Running existing notification tests...');

    try {
      await notificationTestService.runAllTests();
      setCurrentTest('');

      Alert.alert(
        'Existing Tests Complete',
        'All existing notification tests have been executed. Check the notification test service for detailed results.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Existing Test Error',
        `Failed to run existing tests: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return (
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        );
      case 'failed':
        return <Ionicons name="close-circle" size={20} color={colors.error} />;
      case 'pending':
        return (
          <Ionicons name="time-outline" size={20} color={colors.warning} />
        );
      default:
        return (
          <Ionicons name="help-circle" size={20} color={colors.textSecondary} />
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return colors.success;
      case 'failed':
        return colors.error;
      case 'pending':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const filteredResults =
    selectedCategory === 'all'
      ? testResults
      : testResults.filter(result => {
          // Filter logic would need to be enhanced with test metadata
          return true; // For now, show all
        });

  const renderTestCategories = () => {
    const categories: Array<{
      id: TestCategory | 'all';
      label: string;
      icon: string;
    }> = [
      { id: 'all', label: 'All Tests', icon: 'list' },
      { id: 'permissions', label: 'Permissions', icon: 'lock-closed' },
      { id: 'delivery', label: 'Delivery', icon: 'send' },
      { id: 'integration', label: 'Integration', icon: 'link' },
      { id: 'performance', label: 'Performance', icon: 'speedometer' },
      { id: 'accessibility', label: 'Accessibility', icon: 'accessibility' },
      { id: 'compliance', label: 'Compliance', icon: 'shield-checkmark' },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipSelected,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon as any}
              size={16}
              color={
                selectedCategory === category.id ? 'white' : colors.primary
              }
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.id &&
                  styles.categoryChipTextSelected,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderTestResult = (result: TestResult, index: number) => (
    <TouchableOpacity
      key={`${result.testName}-${index}`}
      style={styles.testResultCard}
      onPress={() => {
        setSelectedTest(result);
        setShowDetailModal(true);
      }}
    >
      <View style={styles.testResultHeader}>
        <View style={styles.testResultTitle}>
          {getStatusIcon(result.status)}
          <Text style={styles.testResultName}>{result.testName}</Text>
        </View>
        <Text
          style={[
            styles.testResultStatus,
            { color: getStatusColor(result.status) },
          ]}
        >
          {result.status.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.testResultDetails} numberOfLines={2}>
        {result.details}
      </Text>

      <View style={styles.testResultFooter}>
        <Text style={styles.testResultTime}>
          {result.timestamp.toLocaleTimeString()}
        </Text>
        {result.duration && (
          <Text style={styles.testResultDuration}>{result.duration}ms</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => {
    if (!selectedTest) return null;

    return (
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedTest.testName}</Text>
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.detailStatusContainer}>
                  {getStatusIcon(selectedTest.status)}
                  <Text
                    style={[
                      styles.detailStatus,
                      { color: getStatusColor(selectedTest.status) },
                    ]}
                  >
                    {selectedTest.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Details</Text>
                <Text style={styles.detailText}>{selectedTest.details}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Timestamp</Text>
                <Text style={styles.detailText}>
                  {selectedTest.timestamp.toLocaleString()}
                </Text>
              </View>

              {selectedTest.duration && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailText}>
                    {selectedTest.duration}ms
                  </Text>
                </View>
              )}

              {selectedTest.deviceInfo && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Device Info</Text>
                  <Text style={styles.detailText}>
                    {JSON.stringify(selectedTest.deviceInfo, null, 2)}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderSummary = () => {
    if (!testSummary) return null;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Test Summary</Text>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{testSummary.total}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {testSummary.passed}
            </Text>
            <Text style={styles.summaryLabel}>Passed</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              {testSummary.failed}
            </Text>
            <Text style={styles.summaryLabel}>Failed</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.warning }]}>
              {testSummary.pending}
            </Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.summaryMetrics}>
          <View style={styles.summaryMetric}>
            <Text style={styles.summaryMetricLabel}>Coverage</Text>
            <Text style={styles.summaryMetricValue}>
              {testSummary.coverage}
            </Text>
          </View>

          <View style={styles.summaryMetric}>
            <Text style={styles.summaryMetricLabel}>Duration</Text>
            <Text style={styles.summaryMetricValue}>
              {testSummary.duration}ms
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[colors.backgroundDefault, colors.backgroundSecondary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.title}>Notification Test Dashboard</Text>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Help',
                'This dashboard allows you to run comprehensive end-to-end tests for the notification system including permissions, delivery, integration, performance, and accessibility tests.'
              )
            }
            style={styles.helpButton}
          >
            <Ionicons
              name="help-circle-outline"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Test Categories */}
          {renderTestCategories()}

          {/* Control Buttons */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, isRunning && styles.buttonDisabled]}
              onPress={runCompleteTestSuite}
              disabled={isRunning}
            >
              <Text style={styles.primaryButtonText}>
                Run Complete Test Suite
              </Text>
            </TouchableOpacity>

            <View style={styles.secondaryButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  isRunning && styles.buttonDisabled,
                ]}
                onPress={runExistingTestSuite}
                disabled={isRunning}
              >
                <Text style={styles.secondaryButtonText}>
                  Run Existing Tests
                </Text>
              </TouchableOpacity>

              {selectedCategory !== 'all' && (
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    isRunning && styles.buttonDisabled,
                  ]}
                  onPress={() =>
                    runCategoryTests(selectedCategory as TestCategory)
                  }
                  disabled={isRunning}
                >
                  <Text style={styles.secondaryButtonText}>
                    Run {selectedCategory} Tests
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Loading State */}
          {isRunning && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>{currentTest}</Text>
            </View>
          )}

          {/* Test Summary */}
          {renderSummary()}

          {/* Test Results */}
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              Test Results ({filteredResults.length})
            </Text>

            {filteredResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="flask-outline"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyStateText}>No test results yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Run the test suite to see results here
                </Text>
              </View>
            ) : (
              <View style={styles.testResultsList}>
                {filteredResults.map(renderTestResult)}
              </View>
            )}
          </View>
        </ScrollView>

        {renderDetailModal()}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.backgroundSecondary,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  helpButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  categoryContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  categoryChipTextSelected: {
    color: 'white',
  },
  controlsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summaryContainer: {
    margin: 24,
    padding: 20,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  summaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  summaryMetric: {
    alignItems: 'center',
  },
  summaryMetricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryMetricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 4,
  },
  resultsContainer: {
    padding: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  testResultsList: {
    gap: 12,
  },
  testResultCard: {
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  testResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testResultTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  testResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  testResultStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  testResultDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  testResultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testResultTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  testResultDuration: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    padding: 24,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  detailStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
