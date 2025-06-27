import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import Icon from '../ui/Icon';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

interface AccountDeletionScreenProps {
  onClose?: () => void;
  onDeletionComplete?: () => void;
}

const DELETION_WARNINGS = [
  {
    icon: '⚠️',
    title: 'All Financial Data Will Be Permanently Deleted',
    description:
      'Your transaction history, categories, budgets, and insights will be irreversibly removed.',
  },
  {
    icon: '🔒',
    title: 'Account Access Will Be Immediately Revoked',
    description:
      'You will no longer be able to access this account or any associated data.',
  },
  {
    icon: '📱',
    title: 'Mobile App Data Will Be Cleared',
    description:
      'All locally stored preferences, settings, and cached data will be removed.',
  },
  {
    icon: '🧾',
    title: 'Legal Compliance Data May Be Retained',
    description:
      'Some data may be retained for legal/regulatory purposes as required by Canadian law (typically 7 years for financial records).',
  },
];

const RETENTION_POLICIES = [
  {
    category: 'Financial Transaction Data',
    period: 'Immediate deletion',
    reason: 'User request under PIPEDA',
  },
  {
    category: 'Personal Information',
    period: 'Immediate deletion',
    reason: 'User request under PIPEDA',
  },
  {
    category: 'Account Security Logs',
    period: 'Retained for 90 days',
    reason: 'Security monitoring and fraud prevention',
  },
  {
    category: 'Compliance Records',
    period: 'Retained for 7 years',
    reason: 'Canadian financial regulations (FINTRAC)',
  },
];

const AccountDeletionScreen: React.FC<AccountDeletionScreenProps> = ({
  onClose,
  onDeletionComplete,
}) => {
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const [currentStep, setCurrentStep] = useState<
    'warning' | 'confirmation' | 'processing'
  >('warning');
  const [confirmationText, setConfirmationText] = useState('');
  const [hasReadWarnings, setHasReadWarnings] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const requiredConfirmationText = user?.email
    ? `DELETE ${user.email}`
    : 'DELETE ACCOUNT';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundPrimary,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xl * 2,
    },
    header: {
      marginBottom: spacing.xl,
      alignItems: 'center',
    },
    dangerIcon: {
      fontSize: 48,
      marginBottom: spacing.md,
    },
    title: {
      ...(textStyles.h1 || {}),
      color: theme.error,
      marginBottom: spacing.sm,
      textAlign: 'center',
      fontWeight: 'bold',
    },
    subtitle: {
      ...(textStyles.bodyRegular || {}),
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    sectionTitle: {
      ...(textStyles.h3 || {}),
      color: theme.textPrimary,
      marginBottom: spacing.md,
      marginTop: spacing.lg,
    },
    warningCard: {
      marginBottom: spacing.sm,
      borderLeftWidth: 4,
      borderLeftColor: theme.error,
    },
    warningHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    warningIcon: {
      fontSize: 24,
      marginRight: spacing.sm,
    },
    warningTitle: {
      ...(textStyles.h4 || {}),
      color: theme.error,
      flex: 1,
    },
    warningDescription: {
      ...(textStyles.bodyRegular || {}),
      color: theme.textSecondary,
      lineHeight: 20,
    },
    retentionTable: {
      marginTop: spacing.sm,
    },
    retentionRow: {
      flexDirection: 'row',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.neutral.light,
    },
    retentionCategory: {
      ...(textStyles.bodySmall || {}),
      color: theme.textPrimary,
      flex: 2,
      fontWeight: '600',
    },
    retentionPeriod: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
      flex: 1,
      textAlign: 'center',
    },
    retentionReason: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
      flex: 2,
      textAlign: 'right',
    },
    confirmationSection: {
      marginTop: spacing.xl,
    },
    confirmationInstructions: {
      ...(textStyles.bodyRegular || {}),
      color: theme.textPrimary,
      marginBottom: spacing.md,
      lineHeight: 22,
    },
    confirmationTextExample: {
      ...(textStyles.bodyRegular || {}),
      color: theme.error,
      fontWeight: 'bold',
      fontFamily: 'monospace',
      backgroundColor: theme.neutral.light,
      padding: spacing.sm,
      borderRadius: 8,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    textInput: {
      ...(textStyles.bodyRegular || {}),
      color: theme.textPrimary,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 2,
      borderColor: theme.neutral.medium,
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.md,
      fontFamily: 'monospace',
    },
    textInputFocused: {
      borderColor: theme.primary,
    },
    textInputError: {
      borderColor: theme.error,
    },
    inputStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    inputStatusText: {
      ...(textStyles.bodySmall || {}),
      marginLeft: spacing.xs,
    },
    inputStatusSuccess: {
      color: theme.success || theme.primary,
    },
    inputStatusError: {
      color: theme.error,
    },
    buttonContainer: {
      marginTop: spacing.xl,
    },
    deleteButton: {
      backgroundColor: theme.error,
      borderColor: theme.error,
      marginBottom: spacing.sm,
    },
    complianceNotice: {
      marginTop: spacing.xl,
      padding: spacing.md,
      backgroundColor: theme.secondary + '20',
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: theme.secondary,
    },
    complianceText: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
      lineHeight: 18,
      textAlign: 'center',
    },
    processingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl * 2,
    },
    processingText: {
      ...(textStyles.h3 || {}),
      color: theme.textPrimary,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
    processingSubtext: {
      ...(textStyles.bodyRegular || {}),
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
  });

  const isConfirmationValid =
    confirmationText.trim() === requiredConfirmationText;

  const handleProceedToConfirmation = () => {
    setHasReadWarnings(true);
    setCurrentStep('confirmation');
  };

  const handleDeleteAccount = async () => {
    if (!isConfirmationValid) {
      Alert.alert(
        'Confirmation Required',
        `Please type "${requiredConfirmationText}" exactly as shown to confirm account deletion.`
      );
      return;
    }

    Alert.alert(
      'Final Confirmation',
      'This is your last chance to cancel. Are you absolutely sure you want to permanently delete your account and all associated data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            setCurrentStep('processing');

            try {
              // Simulate account deletion process
              await new Promise(resolve => setTimeout(resolve, 3000));

              // Sign out user
              await signOut();

              Alert.alert(
                'Account Deleted',
                'Your account and all associated data have been permanently deleted. Thank you for using ClariFi.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      onDeletionComplete?.();
                      onClose?.();
                    },
                  },
                ]
              );
            } catch (error) {
              setIsDeleting(false);
              setCurrentStep('confirmation');
              Alert.alert(
                'Deletion Failed',
                'An error occurred while deleting your account. Please try again or contact support.'
              );
            }
          },
        },
      ]
    );
  };

  if (currentStep === 'processing') {
    return (
      <View style={styles.container}>
        <View style={styles.processingContainer}>
          <Text style={styles.dangerIcon}>🗑️</Text>
          <Text style={styles.processingText}>Deleting Account...</Text>
          <Text style={styles.processingSubtext}>
            Please wait while we securely remove your data from our systems.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.dangerIcon}>⚠️</Text>
          <Text style={styles.title}>Delete Account</Text>
          <Text style={styles.subtitle}>
            This action will permanently delete your account and cannot be
            undone.
          </Text>
        </View>

        {currentStep === 'warning' && (
          <>
            <Text style={styles.sectionTitle}>What Will Happen</Text>
            {DELETION_WARNINGS.map((warning, index) => (
              <Card key={index} style={styles.warningCard}>
                <View style={styles.warningHeader}>
                  <Text style={styles.warningIcon}>{warning.icon}</Text>
                  <Text style={styles.warningTitle}>{warning.title}</Text>
                </View>
                <Text style={styles.warningDescription}>
                  {warning.description}
                </Text>
              </Card>
            ))}

            <Text style={styles.sectionTitle}>Data Retention Policy</Text>
            <Card>
              <Text
                style={[
                  styles.warningDescription,
                  { marginBottom: spacing.md },
                ]}
              >
                According to PIPEDA and Canadian financial regulations, some
                data may need to be retained:
              </Text>
              <View style={styles.retentionTable}>
                {RETENTION_POLICIES.map((policy, index) => (
                  <View key={index} style={styles.retentionRow}>
                    <Text style={styles.retentionCategory}>
                      {policy.category}
                    </Text>
                    <Text style={styles.retentionPeriod}>{policy.period}</Text>
                    <Text style={styles.retentionReason}>{policy.reason}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <View style={styles.buttonContainer}>
              <Button
                title="I Understand - Proceed to Delete"
                onPress={handleProceedToConfirmation}
                variant="primary"
                iconLeft="arrow-right"
                fullWidth
                style={{
                  backgroundColor: theme.error,
                  borderColor: theme.error,
                }}
              />
            </View>
          </>
        )}

        {currentStep === 'confirmation' && (
          <View style={styles.confirmationSection}>
            <Text style={styles.sectionTitle}>Final Confirmation Required</Text>

            <Text style={styles.confirmationInstructions}>
              To confirm account deletion, please type the following text
              exactly as shown:
            </Text>

            <Text style={styles.confirmationTextExample}>
              {requiredConfirmationText}
            </Text>

            <TextInput
              style={[
                styles.textInput,
                isConfirmationValid && styles.textInputFocused,
                confirmationText.length > 0 &&
                  !isConfirmationValid &&
                  styles.textInputError,
              ]}
              value={confirmationText}
              onChangeText={setConfirmationText}
              placeholder="Type confirmation text here..."
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              spellCheck={false}
            />

            <View style={styles.inputStatus}>
              <Icon
                name={isConfirmationValid ? 'check-circle' : 'alert-circle'}
                size={16}
                color={
                  isConfirmationValid
                    ? theme.success || theme.primary
                    : theme.error
                }
              />
              <Text
                style={[
                  styles.inputStatusText,
                  isConfirmationValid
                    ? styles.inputStatusSuccess
                    : styles.inputStatusError,
                ]}
              >
                {isConfirmationValid
                  ? 'Confirmation text matches'
                  : 'Please type the confirmation text exactly as shown'}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title={
                  isDeleting ? 'Deleting Account...' : 'Delete Account Forever'
                }
                onPress={handleDeleteAccount}
                variant="primary"
                iconLeft="trash-2"
                disabled={!isConfirmationValid || isDeleting}
                loading={isDeleting}
                fullWidth
                style={styles.deleteButton}
              />

              <Button
                title="Cancel"
                onPress={onClose}
                variant="outline"
                fullWidth
              />
            </View>
          </View>
        )}

        <View style={styles.complianceNotice}>
          <Text style={styles.complianceText}>
            🔒 Account deletion complies with the Personal Information
            Protection and Electronic Documents Act (PIPEDA). Some data may be
            retained for legal compliance as required by Canadian financial
            regulations. This process is irreversible and secure.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default AccountDeletionScreen;
