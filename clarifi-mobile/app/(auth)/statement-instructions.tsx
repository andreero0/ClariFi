import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  ChevronUp,
  Shield,
  Lock,
  Eye,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { translate } from '../../i18n';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

export default function StatementInstructionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isDataProtectionExpanded, setIsDataProtectionExpanded] =
    useState(false);
  // const { selectedBanks } = params; // Potentially use selectedBanks to show bank-specific tips if available

  const handleImportStatement = async () => {
    // Haptic feedback on import button
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // PRD: Navigate to camera interface for document capture
    router.push('/(auth)/statement-camera');
  };

  const handleUploadPDF = () => {
    // PRD: Navigate to file picker for PDF upload
    router.push('/(auth)/statement-capture');
  };

  const toggleDataProtection = async () => {
    // Haptic feedback on expand/collapse
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsDataProtectionExpanded(!isDataProtectionExpanded);
  };

  return (
    <View style={styles.container}>
      {/* PRD: Header with back arrow and logo */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.logoText}>ClariFi</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* PRD: "Import your first statement" H2 header */}
        <Text style={styles.title}>Import your first statement</Text>

        {/* PRD: "Choose how you'd like to import" subtitle */}
        <Text style={styles.subtitle}>
          Choose how you'd like to import your bank statement
        </Text>

        {/* PRD: Tab selector for "Scan Document" vs "Upload PDF" */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, styles.activeTab]}
            onPress={handleImportStatement}
          >
            <Camera size={20} color={colors.surface} style={styles.tabIcon} />
            <Text style={[styles.tabText, styles.activeTabText]}>
              Scan Document
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab} onPress={handleUploadPDF}>
            <Text style={styles.tabText}>Upload PDF</Text>
          </TouchableOpacity>
        </View>

        {/* PRD: Step-by-step visual guide with numbered circles (1, 2, 3) */}
        <View style={styles.stepsContainer}>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>
                Open your banking app or grab a paper statement
              </Text>
            </View>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>
                Take a clear photo of the full statement
              </Text>
            </View>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>
                We'll extract and categorize everything automatically
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* PRD: "Import Statement" primary button with camera icon */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.importButton}
          onPress={handleImportStatement}
        >
          <Camera size={20} color={colors.surface} style={styles.buttonIcon} />
          <Text style={styles.importButtonText}>Import Statement</Text>
        </TouchableOpacity>

        {/* PRD: "How we protect your data" expandable section at bottom */}
        <TouchableOpacity
          style={styles.dataProtectionButton}
          onPress={toggleDataProtection}
        >
          <Text style={styles.dataProtectionText}>
            How we protect your data
          </Text>
          {isDataProtectionExpanded ? (
            <ChevronUp
              size={16}
              color={colors.primary}
              style={styles.chevronIcon}
            />
          ) : (
            <ChevronDown
              size={16}
              color={colors.primary}
              style={styles.chevronIcon}
            />
          )}
        </TouchableOpacity>

        {/* PRD: Expandable data protection content */}
        {isDataProtectionExpanded && (
          <View style={styles.dataProtectionContent}>
            <View style={styles.protectionItem}>
              <Shield
                size={20}
                color={colors.primary}
                style={styles.protectionIcon}
              />
              <View style={styles.protectionTextContainer}>
                <Text style={styles.protectionTitle}>
                  Bank-level encryption
                </Text>
                <Text style={styles.protectionDescription}>
                  Your statements are encrypted with the same 256-bit AES
                  encryption used by major Canadian banks.
                </Text>
              </View>
            </View>

            <View style={styles.protectionItem}>
              <Lock
                size={20}
                color={colors.primary}
                style={styles.protectionIcon}
              />
              <View style={styles.protectionTextContainer}>
                <Text style={styles.protectionTitle}>No data storage</Text>
                <Text style={styles.protectionDescription}>
                  We process your data locally and delete original documents
                  immediately after analysis.
                </Text>
              </View>
            </View>

            <View style={styles.protectionItem}>
              <Eye
                size={20}
                color={colors.primary}
                style={styles.protectionIcon}
              />
              <View style={styles.protectionTextContainer}>
                <Text style={styles.protectionTitle}>Privacy by design</Text>
                <Text style={styles.protectionDescription}>
                  Only essential transaction data is extracted. Personal details
                  like account numbers are anonymized.
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface, // PRD Pure White
  },
  // PRD: Header with logo and back arrow
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    marginBottom: 48,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  // PRD: "Import your first statement" H2 header
  title: {
    ...textStyles.h2,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  // PRD: Subtitle
  subtitle: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  // PRD: Tab selector for "Scan Document" vs "Upload PDF"
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.lightest,
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.surface,
  },
  // PRD: Step-by-step visual guide with numbered circles
  stepsContainer: {
    marginBottom: 40,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  stepNumberText: {
    ...textStyles.bodyRegular,
    color: colors.surface,
    fontWeight: '600',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  // PRD: "Import Statement" primary button with camera icon
  importButton: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  importButtonText: {
    ...textStyles.button,
    color: colors.surface,
  },
  // PRD: "How we protect your data" expandable section at bottom
  dataProtectionButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataProtectionText: {
    ...textStyles.bodySmall,
    color: colors.primary,
    textDecorationLine: 'underline',
    marginRight: 4,
  },
  chevronIcon: {
    marginLeft: 4,
  },
  dataProtectionContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  protectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  protectionIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  protectionTextContainer: {
    flex: 1,
  },
  protectionTitle: {
    ...textStyles.bodyRegular,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  protectionDescription: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
