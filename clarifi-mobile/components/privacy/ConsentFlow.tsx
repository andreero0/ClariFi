import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import PrivacyManager, {
  ConsentLevel,
} from '../../services/privacy/PrivacyManager';

interface ConsentFlowProps {
  isVisible: boolean;
  onComplete: (granted: boolean) => void;
}

const ConsentFlow: React.FC<ConsentFlowProps> = ({ isVisible, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [consentLevels, setConsentLevels] = useState({
    [ConsentLevel.ESSENTIAL]: true, // Always required
    [ConsentLevel.ANALYTICS]: false,
    [ConsentLevel.PERSONALIZATION]: false,
    [ConsentLevel.MARKETING]: false, // Disabled by default for PIPEDA compliance
  });
  const [hasReadPolicy, setHasReadPolicy] = useState(false);
  const [hasAcknowledgedRights, setHasAcknowledgedRights] = useState(false);
  const privacyManager = PrivacyManager.getInstance();

  const steps = ['welcome', 'essential', 'optional', 'rights', 'confirmation'];

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
      setHasReadPolicy(false);
      setHasAcknowledgedRights(false);
    }
  }, [isVisible]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConsentToggle = (level: ConsentLevel, value: boolean) => {
    if (level === ConsentLevel.ESSENTIAL) {
      Alert.alert(
        'Essential Data Required',
        "Essential data collection cannot be disabled as it's required for the app to function properly.",
        [{ text: 'OK' }]
      );
      return;
    }

    setConsentLevels(prev => ({
      ...prev,
      [level]: value,
    }));
  };

  const handleComplete = async () => {
    try {
      await privacyManager.grantConsent(consentLevels);
      onComplete(true);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to save privacy settings. Please try again.'
      );
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Unable to Continue',
      'ClariFi requires essential data collection for security and functionality. Without this consent, the app cannot operate properly.',
      [
        { text: 'Review Settings', style: 'cancel' },
        {
          text: 'Exit App',
          style: 'destructive',
          onPress: () => onComplete(false),
        },
      ]
    );
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Welcome to ClariFi</Text>
      <Text style={styles.stepDescription}>
        We respect your privacy and are committed to protecting your personal
        information in accordance with the Personal Information Protection and
        Electronic Documents Act (PIPEDA).
      </Text>
      <Text style={styles.stepDescription}>
        This setup will help you understand what data we collect and how you can
        control it.
      </Text>

      <View style={styles.highlightBox}>
        <Text style={styles.highlightText}>📋 What you'll learn:</Text>
        <Text style={styles.bulletPoint}>• What essential data we need</Text>
        <Text style={styles.bulletPoint}>
          • Optional features you can enable
        </Text>
        <Text style={styles.bulletPoint}>• Your privacy rights</Text>
        <Text style={styles.bulletPoint}>• How to change settings anytime</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEssentialStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Essential Data Collection</Text>
      <Text style={styles.stepDescription}>
        For ClariFi to function properly and securely, we need to collect some
        essential data. This cannot be disabled.
      </Text>

      <View style={styles.consentItem}>
        <View style={styles.consentInfo}>
          <Text style={styles.consentTitle}>✅ Essential Functionality</Text>
          <Text style={styles.consentDescription}>
            • App security and fraud prevention{'\n'}• Core financial
            calculations{'\n'}• Error reporting for app stability{'\n'}• Basic
            usage for regulatory compliance
          </Text>
        </View>
        <Switch
          value={consentLevels[ConsentLevel.ESSENTIAL]}
          disabled={true}
          trackColor={{ false: '#767577', true: '#28a745' }}
        />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 This data is anonymized where possible and retained according to
          Canadian financial regulations (7 years for compliance data).
        </Text>
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOptionalStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Optional Features</Text>
      <Text style={styles.stepDescription}>
        These features enhance your experience but are completely optional. You
        can enable or disable them at any time.
      </Text>

      <View style={styles.consentItem}>
        <View style={styles.consentInfo}>
          <Text style={styles.consentTitle}>📊 Analytics & Performance</Text>
          <Text style={styles.consentDescription}>
            Help us improve the app by sharing anonymous usage data and
            performance metrics.
          </Text>
        </View>
        <Switch
          value={consentLevels[ConsentLevel.ANALYTICS]}
          onValueChange={value =>
            handleConsentToggle(ConsentLevel.ANALYTICS, value)
          }
          trackColor={{ false: '#767577', true: '#007bff' }}
        />
      </View>

      <View style={styles.consentItem}>
        <View style={styles.consentInfo}>
          <Text style={styles.consentTitle}>🎯 Personalization</Text>
          <Text style={styles.consentDescription}>
            Customize features and recommendations based on your usage patterns.
          </Text>
        </View>
        <Switch
          value={consentLevels[ConsentLevel.PERSONALIZATION]}
          onValueChange={value =>
            handleConsentToggle(ConsentLevel.PERSONALIZATION, value)
          }
          trackColor={{ false: '#767577', true: '#007bff' }}
        />
      </View>

      <View style={styles.consentItem}>
        <View style={styles.consentInfo}>
          <Text style={styles.consentTitle}>📧 Marketing & Tips</Text>
          <Text style={styles.consentDescription}>
            Receive financial tips and promotional content (disabled by
            default).
          </Text>
        </View>
        <Switch
          value={consentLevels[ConsentLevel.MARKETING]}
          onValueChange={value =>
            handleConsentToggle(ConsentLevel.MARKETING, value)
          }
          trackColor={{ false: '#767577', true: '#007bff' }}
        />
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRightsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Your Privacy Rights</Text>
      <Text style={styles.stepDescription}>
        Under PIPEDA, you have important rights regarding your personal
        information:
      </Text>

      <View style={styles.rightsContainer}>
        <Text style={styles.rightItem}>
          🔍 <Text style={styles.rightTitle}>Access:</Text> Request a copy of
          your data
        </Text>
        <Text style={styles.rightItem}>
          ✏️ <Text style={styles.rightTitle}>Correction:</Text> Update incorrect
          information
        </Text>
        <Text style={styles.rightItem}>
          🗑️ <Text style={styles.rightTitle}>Deletion:</Text> Request data
          removal
        </Text>
        <Text style={styles.rightItem}>
          📤 <Text style={styles.rightTitle}>Portability:</Text> Export your
          data
        </Text>
        <Text style={styles.rightItem}>
          🚫 <Text style={styles.rightTitle}>Opt-out:</Text> Withdraw consent
          anytime
        </Text>
        <Text style={styles.rightItem}>
          ❓ <Text style={styles.rightTitle}>Information:</Text> Understand how
          data is used
        </Text>
      </View>

      <View style={styles.acknowledgmentContainer}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setHasAcknowledgedRights(!hasAcknowledgedRights)}
        >
          <View
            style={[
              styles.checkbox,
              hasAcknowledgedRights && styles.checkboxChecked,
            ]}
          >
            {hasAcknowledgedRights && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I understand my privacy rights and how to exercise them
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            !hasAcknowledgedRights && styles.disabledButton,
          ]}
          onPress={handleNext}
          disabled={!hasAcknowledgedRights}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConfirmationStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review Your Choices</Text>
      <Text style={styles.stepDescription}>
        Please review your privacy settings below. You can change these at any
        time in the app settings.
      </Text>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Essential Data:</Text>
          <Text style={styles.summaryValue}>✅ Required</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Analytics:</Text>
          <Text style={styles.summaryValue}>
            {consentLevels[ConsentLevel.ANALYTICS]
              ? '✅ Enabled'
              : '❌ Disabled'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Personalization:</Text>
          <Text style={styles.summaryValue}>
            {consentLevels[ConsentLevel.PERSONALIZATION]
              ? '✅ Enabled'
              : '❌ Disabled'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Marketing:</Text>
          <Text style={styles.summaryValue}>
            {consentLevels[ConsentLevel.MARKETING]
              ? '✅ Enabled'
              : '❌ Disabled'}
          </Text>
        </View>
      </View>

      <View style={styles.finalButtons}>
        <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={handleComplete}>
          <Text style={styles.acceptButtonText}>Accept & Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (steps[currentStep]) {
      case 'welcome':
        return renderWelcomeStep();
      case 'essential':
        return renderEssentialStep();
      case 'optional':
        return renderOptionalStep();
      case 'rights':
        return renderRightsStep();
      case 'confirmation':
        return renderConfirmationStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Privacy Setup</Text>
          <Text style={styles.headerSubtitle}>
            Step {currentStep + 1} of {steps.length}
          </Text>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / steps.length) * 100}%` },
            ]}
          />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {renderCurrentStep()}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  highlightBox: {
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  highlightText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 4,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  consentInfo: {
    flex: 1,
    marginRight: 16,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  consentDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 18,
  },
  rightsContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  rightItem: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 12,
    lineHeight: 22,
  },
  rightTitle: {
    fontWeight: '600',
  },
  acknowledgmentContainer: {
    marginBottom: 30,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#6c757d',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  checkmark: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 22,
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#2c3e50',
  },
  stepButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  primaryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6c757d',
    flex: 1,
    marginRight: 10,
  },
  secondaryButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  finalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  declineButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  declineButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  acceptButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ConsentFlow;
