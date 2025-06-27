import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';

interface LegalDocumentsScreenProps {
  onClose?: () => void;
  initialDocument?: 'privacy' | 'terms';
}

const LegalDocumentsScreen: React.FC<LegalDocumentsScreenProps> = ({
  onClose,
  initialDocument = 'privacy',
}) => {
  const { theme } = useTheme();
  const [selectedDocument, setSelectedDocument] =
    useState<string>(initialDocument);
  const [acknowledgments, setAcknowledgments] = useState<
    Record<string, boolean>
  >({});

  const privacyContent = `ClariFi Privacy Policy

Version 2.1 • Effective January 1, 2024

1. PRIVACY OVERVIEW
ClariFi is committed to protecting your privacy and personal information in accordance with the Personal Information Protection and Electronic Documents Act (PIPEDA) and all applicable Canadian privacy laws.

This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our financial management application.

2. INFORMATION WE COLLECT
We collect the following types of information:

Personal Information:
• Name, email address, and contact information
• Financial account information (encrypted)
• Banking transactions and spending patterns
• Device information and app usage data

Technical Information:
• Device identifiers and operating system
• IP address and location data (if permitted)
• App performance and error logs
• Usage analytics and interaction patterns

Optional Information:
• Profile preferences and settings
• Feedback and support communications
• Survey responses and user research data

3. HOW WE USE YOUR INFORMATION
We use your personal information for the following purposes:

Core Functionality:
• Providing financial categorization services
• Generating spending insights and reports
• Processing OCR for receipt and document scanning
• Synchronizing data across your devices

Service Improvement:
• Enhancing AI categorization accuracy
• Improving app performance and user experience
• Developing new features and capabilities
• Conducting security monitoring and fraud prevention

Communication:
• Sending important account notifications
• Providing customer support assistance
• Sharing relevant financial tips and insights (with consent)

All uses are limited to the purposes for which consent was given and in compliance with PIPEDA requirements.

4. INFORMATION SHARING AND DISCLOSURE
We do not sell, rent, or trade your personal information to third parties.

Limited sharing may occur in the following circumstances:

Service Providers:
• Encrypted cloud storage services (AWS, Google Cloud)
• AI processing services for categorization (with data minimization)
• Analytics services (with anonymized data only)
• Customer support platforms (for support requests only)

Legal Requirements:
• When required by Canadian law or court order
• To protect our rights or prevent fraud
• In emergency situations to protect safety
• During business transfers (with strict data protection requirements)

All third-party service providers are contractually bound to protect your information and use it only for specified purposes.

5. DATA STORAGE AND SECURITY
Your data is stored securely using industry-standard practices:

Storage Locations:
• Primary servers located in Canada
• Encrypted backup systems in Canadian data centers
• Local device storage (encrypted)

Security Measures:
• End-to-end encryption for sensitive financial data
• Multi-factor authentication for account access
• Regular security audits and penetration testing
• SOC 2 Type II compliant infrastructure
• PCI DSS compliance for payment data handling

Data Retention:
• Active account data: Retained while account is active
• Deleted account data: Securely purged within 30 days
• Legal compliance data: Retained as required by law (typically 7 years)
• Analytics data: Anonymized and retained for service improvement

6. YOUR PRIVACY RIGHTS
Under PIPEDA and Canadian privacy laws, you have the following rights:

Access Rights:
• Request copies of your personal information
• Understand how your information is being used
• Receive information in a structured, machine-readable format

Control Rights:
• Withdraw consent for optional data processing
• Correct inaccurate personal information
• Request deletion of your personal information
• Opt-out of non-essential communications

Portability Rights:
• Export your data in common formats (CSV, JSON, PDF)
• Transfer your information to other services
• Receive regular data summaries

To exercise these rights, contact our Privacy Officer at privacy@clarifi.ca or use the in-app privacy controls.

7. CONTACT INFORMATION
For privacy-related questions or concerns:

Privacy Officer
Email: privacy@clarifi.ca
Phone: 1-800-CLARIFI
Address: 123 Financial St, Toronto, ON M5H 2N3

Office of the Privacy Commissioner of Canada
Website: priv.gc.ca
Phone: 1-800-282-1376

We will respond to privacy inquiries within 30 days as required by PIPEDA.`;

  const termsContent = `ClariFi Terms of Service

Version 1.8 • Effective January 1, 2024

1. ACCEPTANCE OF TERMS
By downloading, installing, or using the ClariFi application, you agree to be bound by these Terms of Service and all applicable laws and regulations.

If you do not agree with any of these terms, you are prohibited from using or accessing this application.

These terms constitute a legally binding agreement between you and ClariFi Inc., a corporation incorporated under the laws of Canada.

2. SERVICE DESCRIPTION
ClariFi provides:

Core Services:
• Personal financial management tools
• AI-powered transaction categorization
• Receipt and document OCR processing
• Spending analytics and insights
• Educational financial content

Limitations:
• ClariFi is not a financial institution or bank
• We do not provide financial advice or investment recommendations
• The service is for personal use only
• We do not store banking credentials or account numbers

Availability:
• Service availability is not guaranteed 24/7
• Maintenance windows may cause temporary interruptions
• Features may be added or removed at our discretion

3. USER RESPONSIBILITIES
As a user of ClariFi, you agree to:

Account Security:
• Maintain the confidentiality of your login credentials
• Use strong passwords and enable two-factor authentication
• Immediately notify us of any unauthorized access
• Not share your account with others

Appropriate Use:
• Provide accurate and truthful information
• Use the service only for lawful purposes
• Not attempt to reverse engineer or hack the application
• Not upload malicious content or viruses

Data Accuracy:
• Review and verify categorizations and insights
• Report any errors or discrepancies promptly
• Understand that AI categorization may not be 100% accurate
• Take responsibility for your financial decisions

4. LIMITATIONS OF LIABILITY
ClariFi's liability is limited as follows:

Service Limitations:
• We provide the service "as is" without warranties
• We are not liable for financial decisions made using our insights
• We are not responsible for third-party service interruptions
• Maximum liability is limited to fees paid in the last 12 months

Excluded Damages:
• Indirect, incidental, or consequential damages
• Lost profits or business opportunities
• Data loss not caused by our negligence
• Damages from unauthorized access by third parties

Force Majeure:
• We are not liable for delays or failures due to circumstances beyond our control
• This includes natural disasters, government actions, or internet outages

5. TERMINATION
Either party may terminate this agreement:

User Termination:
• You may delete your account at any time through the app
• Upon termination, your data will be deleted within 30 days
• Some data may be retained for legal compliance purposes

ClariFi Termination:
• We may suspend or terminate accounts for terms violations
• We may discontinue the service with 30 days notice
• In case of service discontinuation, we will provide data export options

Effect of Termination:
• Your license to use the app immediately expires
• Data deletion will proceed according to our Privacy Policy
• These terms will survive termination where legally required

6. GOVERNING LAW
These terms are governed by:

Jurisdiction:
• Laws of the Province of Ontario, Canada
• Federal laws of Canada
• Disputes will be resolved in Ontario courts

Consumer Protection:
• Consumer protection laws may provide additional rights
• These terms do not limit rights provided by law
• If any provision is unenforceable, the remainder remains in effect

Changes to Terms:
• We may update these terms from time to time
• Changes will be communicated through the app
• Continued use constitutes acceptance of new terms

7. CONTACT INFORMATION
For questions about these terms:

ClariFi Inc.
Email: legal@clarifi.ca
Phone: 1-800-CLARIFI
Address: 123 Financial St, Toronto, ON M5H 2N3`;

  useEffect(() => {
    loadAcknowledgments();
  }, []);

  const loadAcknowledgments = async () => {
    try {
      const stored = await AsyncStorage.getItem('legal_acknowledgments');
      if (stored) {
        setAcknowledgments(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading acknowledgments:', error);
    }
  };

  const acknowledgeDocument = async (documentId: string) => {
    try {
      const newAcknowledgments = {
        ...acknowledgments,
        [`${documentId}_${new Date().toISOString()}`]: true,
      };
      setAcknowledgments(newAcknowledgments);
      await AsyncStorage.setItem(
        'legal_acknowledgments',
        JSON.stringify(newAcknowledgments)
      );

      Alert.alert(
        'Document Acknowledged',
        `Thank you for reviewing the ${documentId === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}. Your acknowledgment has been recorded.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving acknowledgment:', error);
      Alert.alert('Error', 'Failed to save acknowledgment. Please try again.');
    }
  };

  const isDocumentAcknowledged = (documentId: string) => {
    return Object.keys(acknowledgments).some(key => key.startsWith(documentId));
  };

  const renderDocumentTab = (docId: string, title: string) => {
    const isActive = selectedDocument === docId;

    return (
      <TouchableOpacity
        key={docId}
        style={[
          styles.documentTab,
          isActive && styles.activeDocumentTab,
          { borderBottomColor: theme.primary },
        ]}
        onPress={() => setSelectedDocument(docId)}
      >
        <Text
          style={[
            styles.documentTabText,
            isActive && styles.activeDocumentTabText,
            { color: isActive ? theme.primary : theme.textSecondary },
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDocumentContent = (
    content: string,
    documentId: string,
    title: string
  ) => {
    return (
      <ScrollView
        style={styles.contentScrollView}
        showsVerticalScrollIndicator={true}
      >
        <Card style={styles.documentCard}>
          <Text style={[styles.documentContent, { color: theme.textPrimary }]}>
            {content}
          </Text>
        </Card>

        <Card style={styles.acknowledgmentCard}>
          <Text
            style={[styles.acknowledgmentTitle, { color: theme.textPrimary }]}
          >
            Document Acknowledgment
          </Text>
          <Text
            style={[styles.acknowledgmentText, { color: theme.textSecondary }]}
          >
            By acknowledging this document, you confirm that you have read,
            understood, and agree to be bound by the terms outlined above.
          </Text>

          {isDocumentAcknowledged(documentId) ? (
            <View
              style={[
                styles.acknowledgedStatus,
                {
                  backgroundColor: theme.success + '20',
                  borderColor: theme.success,
                },
              ]}
            >
              <Text style={[styles.acknowledgedText, { color: theme.success }]}>
                ✓ Acknowledged on {new Date().toLocaleDateString()}
              </Text>
            </View>
          ) : (
            <Button
              title={`I Acknowledge the ${title}`}
              onPress={() => acknowledgeDocument(documentId)}
              variant="primary"
              style={styles.acknowledgeButton}
            />
          )}
        </Card>

        <Card style={styles.footerCard}>
          <Text style={[styles.footerTitle, { color: theme.textPrimary }]}>
            Questions or Concerns?
          </Text>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            If you have any questions about this document or ClariFi's privacy
            practices:
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Linking.openURL('mailto:privacy@clarifi.ca')}
          >
            <Text style={[styles.contactButtonText, { color: theme.primary }]}>
              📧 Contact our Privacy Officer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Linking.openURL('https://priv.gc.ca')}
          >
            <Text style={[styles.contactButtonText, { color: theme.primary }]}>
              🏛️ Office of the Privacy Commissioner
            </Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Legal Documents
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: theme.primary }]}>
              Close
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.documentTabs}
        contentContainerStyle={styles.documentTabsContent}
      >
        {renderDocumentTab('privacy', 'Privacy Policy')}
        {renderDocumentTab('terms', 'Terms of Service')}
      </ScrollView>

      <View style={styles.content}>
        {selectedDocument === 'privacy'
          ? renderDocumentContent(privacyContent, 'privacy', 'Privacy Policy')
          : renderDocumentContent(termsContent, 'terms', 'Terms of Service')}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  documentTabs: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  documentTabsContent: {
    paddingHorizontal: 20,
  },
  documentTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeDocumentTab: {
    borderBottomWidth: 2,
  },
  documentTabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeDocumentTabText: {
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentScrollView: {
    flex: 1,
    padding: 16,
  },
  documentCard: {
    marginBottom: 20,
  },
  documentContent: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  acknowledgmentCard: {
    marginBottom: 16,
  },
  acknowledgmentTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  acknowledgmentText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  acknowledgeButton: {
    marginTop: 8,
  },
  acknowledgedStatus: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  acknowledgedText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerCard: {
    marginBottom: 40,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  footerText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  contactButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    marginBottom: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default LegalDocumentsScreen;
