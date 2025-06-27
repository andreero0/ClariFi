import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/spacing';
import { textStyles } from '../constants/typography';
import { HelpContentService } from '../services/support/HelpContentService';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

interface SupportCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  estimatedResponse: string;
  autoResolutionRate: number;
}

interface SupportTicket {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  userEmail: string;
  attachments: any[];
  deviceInfo: {
    platform: string;
    version: string;
    model: string;
  };
  appVersion: string;
  timestamp: string;
}

export default function ContactSupportModal() {
  const router = useRouter();
  const { theme } = useTheme();
  const [step, setStep] = useState<
    'category' | 'self-help' | 'ticket-form' | 'confirmation'
  >('category');
  const [selectedCategory, setSelectedCategory] =
    useState<SupportCategory | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [showingAllArticles, setShowingAllArticles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    userEmail: '',
    severity: 'medium' as const,
    attachments: [] as any[],
  });

  const supportCategories: SupportCategory[] = [
    {
      id: 'account',
      title: 'Account & Login',
      description:
        'Issues with account access, password reset, or profile settings',
      icon: '👤',
      severity: 'medium',
      estimatedResponse: '2-4 hours',
      autoResolutionRate: 75,
    },
    {
      id: 'transactions',
      title: 'Transaction Issues',
      description:
        'Problems with transaction categorization, import, or accuracy',
      icon: '💳',
      severity: 'medium',
      estimatedResponse: '4-8 hours',
      autoResolutionRate: 60,
    },
    {
      id: 'credit-cards',
      title: 'Credit Card Management',
      description: 'Adding cards, updating limits, or payment optimizer issues',
      icon: '💰',
      severity: 'low',
      estimatedResponse: '8-12 hours',
      autoResolutionRate: 80,
    },
    {
      id: 'privacy-data',
      title: 'Privacy & Data',
      description:
        'Data export, privacy controls, or account deletion requests',
      icon: '🔒',
      severity: 'high',
      estimatedResponse: '1-2 hours',
      autoResolutionRate: 45,
    },
    {
      id: 'technical',
      title: 'Technical Problems',
      description: 'App crashes, sync issues, or performance problems',
      icon: '⚙️',
      severity: 'high',
      estimatedResponse: '2-6 hours',
      autoResolutionRate: 55,
    },
    {
      id: 'billing',
      title: 'Billing & Subscriptions',
      description: 'Payment issues, subscription changes, or refund requests',
      icon: '💵',
      severity: 'urgent',
      estimatedResponse: '1-2 hours',
      autoResolutionRate: 70,
    },
    {
      id: 'feature-request',
      title: 'Feature Requests',
      description: 'Suggestions for new features or improvements',
      icon: '💡',
      severity: 'low',
      estimatedResponse: '1-3 days',
      autoResolutionRate: 90,
    },
    {
      id: 'other',
      title: 'Other Issues',
      description: 'Questions or issues not covered by other categories',
      icon: '❓',
      severity: 'medium',
      estimatedResponse: '4-8 hours',
      autoResolutionRate: 40,
    },
  ];

  const handleCategorySelect = (category: SupportCategory) => {
    setSelectedCategory(category);

    // Get related help articles
    const articles = HelpContentService.searchContent(
      category.title,
      category.id
    );
    setRelatedArticles(articles.slice(0, 3)); // Show top 3 initially

    setStep('self-help');
  };

  const handleArticlePress = (articleId: string) => {
    router.push(`/modals/help-article?id=${articleId}`);
  };

  const handleTryMoreArticles = () => {
    if (selectedCategory) {
      const allArticles = HelpContentService.searchContent(
        selectedCategory.title,
        selectedCategory.id
      );
      setRelatedArticles(allArticles.slice(0, 8));
      setShowingAllArticles(true);
    }
  };

  const handleBrowseAllHelp = () => {
    router.push('/modals/help-center');
  };

  const handleNeedMoreHelp = () => {
    setStep('ticket-form');
    // Pre-populate form based on category
    if (selectedCategory) {
      setTicketForm(prev => ({
        ...prev,
        subject: `${selectedCategory.title} - `,
        severity: selectedCategory.severity,
      }));
    }
  };

  const handleAttachImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Camera roll permission is needed to attach images.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setTicketForm(prev => ({
        ...prev,
        attachments: [
          ...prev.attachments,
          {
            type: 'image',
            uri: result.assets[0].uri,
            name: `screenshot_${Date.now()}.jpg`,
          },
        ],
      }));
    }
  };

  const handleAttachDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/json'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setTicketForm(prev => ({
          ...prev,
          attachments: [
            ...prev.attachments,
            {
              type: 'document',
              uri: result.assets[0].uri,
              name: result.assets[0].name,
              size: result.assets[0].size,
            },
          ],
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to attach document. Please try again.');
    }
  };

  const removeAttachment = (index: number) => {
    setTicketForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    if (!ticketForm.subject.trim()) {
      Alert.alert(
        'Missing Information',
        'Please provide a subject for your support request.'
      );
      return false;
    }
    if (!ticketForm.description.trim()) {
      Alert.alert(
        'Missing Information',
        'Please describe your issue in detail.'
      );
      return false;
    }
    if (!ticketForm.userEmail.trim() || !ticketForm.userEmail.includes('@')) {
      Alert.alert(
        'Invalid Email',
        'Please provide a valid email address for follow-up.'
      );
      return false;
    }
    return true;
  };

  const handleSubmitTicket = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Create support ticket object
      const ticket: SupportTicket = {
        category: selectedCategory?.id || 'other',
        severity: ticketForm.severity,
        subject: ticketForm.subject.trim(),
        description: ticketForm.description.trim(),
        userEmail: ticketForm.userEmail.trim(),
        attachments: ticketForm.attachments,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version.toString(),
          model: Platform.OS === 'ios' ? 'iPhone' : 'Android Device',
        },
        appVersion: '1.0.0', // Should be from app config
        timestamp: new Date().toISOString(),
      };

      // TODO: Submit to support API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      setStep('confirmation');
    } catch (error) {
      Alert.alert(
        'Submission Failed',
        'There was an error submitting your support request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('category');
    setSelectedCategory(null);
    setRelatedArticles([]);
    setShowingAllArticles(false);
    setTicketForm({
      subject: '',
      description: '',
      userEmail: '',
      severity: 'medium',
      attachments: [],
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundPrimary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      ...textStyles.h3,
      color: theme.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    closeButton: {
      padding: spacing.sm,
    },
    closeButtonText: {
      ...textStyles.bodyLarge,
      color: theme.primary,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.md,
    },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      marginBottom: spacing.md,
    },
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.border,
      marginHorizontal: spacing.xs,
    },
    stepDotActive: {
      backgroundColor: theme.primary,
    },
    sectionTitle: {
      ...textStyles.h4,
      color: theme.textPrimary,
      marginBottom: spacing.md,
    },
    sectionSubtitle: {
      ...textStyles.bodyRegular,
      color: theme.textSecondary,
      marginBottom: spacing.lg,
      lineHeight: 20,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    categoryCard: {
      width: '48%',
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    categoryCardSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + '10',
    },
    categoryIcon: {
      fontSize: 24,
      marginBottom: spacing.sm,
    },
    categoryTitle: {
      ...textStyles.bodyMedium,
      color: theme.textPrimary,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    categoryDescription: {
      ...textStyles.bodySmall,
      color: theme.textSecondary,
      lineHeight: 16,
    },
    categoryMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    categoryResponse: {
      ...textStyles.caption,
      color: theme.textTertiary,
    },
    categoryRate: {
      ...textStyles.caption,
      color: theme.primary,
      fontWeight: '600',
    },
    articlesSection: {
      marginBottom: spacing.lg,
    },
    articleCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
    },
    articleTitle: {
      ...textStyles.bodyMedium,
      color: theme.textPrimary,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    articleSummary: {
      ...textStyles.bodySmall,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    actionButton: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    actionButtonSecondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.border,
    },
    actionButtonText: {
      ...textStyles.bodyMedium,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    actionButtonTextSecondary: {
      color: theme.textPrimary,
    },
    formGroup: {
      marginBottom: spacing.lg,
    },
    formLabel: {
      ...textStyles.bodyMedium,
      color: theme.textPrimary,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    formInput: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
      ...textStyles.bodyRegular,
      color: theme.textPrimary,
    },
    formTextArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    severityOptions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    severityOption: {
      flex: 1,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 8,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      marginHorizontal: 2,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    severityOptionSelected: {
      backgroundColor: theme.primary + '20',
      borderColor: theme.primary,
    },
    severityText: {
      ...textStyles.bodySmall,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    severityTextSelected: {
      color: theme.primary,
    },
    attachmentsSection: {
      marginBottom: spacing.lg,
    },
    attachmentButtons: {
      flexDirection: 'row',
      marginBottom: spacing.md,
    },
    attachmentButton: {
      flex: 1,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 8,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      marginHorizontal: spacing.xs,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    attachmentButtonText: {
      ...textStyles.bodySmall,
      color: theme.textPrimary,
      marginTop: spacing.xs,
    },
    attachmentsList: {
      marginTop: spacing.sm,
    },
    attachmentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 8,
      padding: spacing.sm,
      marginBottom: spacing.xs,
    },
    attachmentName: {
      ...textStyles.bodySmall,
      color: theme.textPrimary,
      flex: 1,
      marginLeft: spacing.sm,
    },
    removeAttachmentButton: {
      padding: spacing.xs,
    },
    removeAttachmentText: {
      ...textStyles.bodySmall,
      color: theme.error,
    },
    confirmationContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    confirmationIcon: {
      fontSize: 64,
      marginBottom: spacing.lg,
    },
    confirmationTitle: {
      ...textStyles.h3,
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    confirmationMessage: {
      ...textStyles.bodyRegular,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContent: {
      backgroundColor: theme.backgroundPrimary,
      borderRadius: 12,
      padding: spacing.xl,
      alignItems: 'center',
    },
    loadingText: {
      ...textStyles.bodyMedium,
      color: theme.textPrimary,
      marginTop: spacing.md,
    },
  });

  const renderStepIndicator = () => {
    const steps = ['category', 'self-help', 'ticket-form', 'confirmation'];
    const currentStepIndex = steps.indexOf(step);

    return (
      <View style={styles.stepIndicator}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.stepDot,
              index <= currentStepIndex && styles.stepDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderCategorySelection = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>How can we help you?</Text>
      <Text style={styles.sectionSubtitle}>
        Select the category that best describes your issue to get targeted help
        and faster resolution.
      </Text>

      <View style={styles.categoryGrid}>
        {supportCategories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              selectedCategory?.id === category.id &&
                styles.categoryCardSelected,
            ]}
            onPress={() => handleCategorySelect(category)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <Text style={styles.categoryDescription}>
              {category.description}
            </Text>
            <View style={styles.categoryMeta}>
              <Text style={styles.categoryResponse}>
                {category.estimatedResponse}
              </Text>
              <Text style={styles.categoryRate}>
                {category.autoResolutionRate}% self-solve
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderSelfHelp = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Try these solutions first</Text>
      <Text style={styles.sectionSubtitle}>
        {selectedCategory?.autoResolutionRate}% of{' '}
        {selectedCategory?.title.toLowerCase()} issues are resolved using these
        resources.
      </Text>

      {relatedArticles.length > 0 && (
        <View style={styles.articlesSection}>
          {relatedArticles.map((article, index) => (
            <TouchableOpacity
              key={index}
              style={styles.articleCard}
              onPress={() => handleArticlePress(article.id)}
            >
              <Text style={styles.articleTitle}>{article.title}</Text>
              <Text style={styles.articleSummary}>{article.summary}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!showingAllArticles && relatedArticles.length >= 3 && (
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={handleTryMoreArticles}
        >
          <Text
            style={[styles.actionButtonText, styles.actionButtonTextSecondary]}
          >
            Show More Articles
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.actionButton, styles.actionButtonSecondary]}
        onPress={handleBrowseAllHelp}
      >
        <Text
          style={[styles.actionButtonText, styles.actionButtonTextSecondary]}
        >
          Browse All Help Topics
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleNeedMoreHelp}
      >
        <Text style={styles.actionButtonText}>
          Still Need Help? Contact Support
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderTicketForm = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Contact Support</Text>
      <Text style={styles.sectionSubtitle}>
        Our support team will respond within{' '}
        {selectedCategory?.estimatedResponse || '4-8 hours'}.
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Your Email</Text>
        <TextInput
          style={styles.formInput}
          placeholder="Enter your email address"
          placeholderTextColor={theme.textTertiary}
          value={ticketForm.userEmail}
          onChangeText={text =>
            setTicketForm(prev => ({ ...prev, userEmail: text }))
          }
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Subject</Text>
        <TextInput
          style={styles.formInput}
          placeholder="Brief description of your issue"
          placeholderTextColor={theme.textTertiary}
          value={ticketForm.subject}
          onChangeText={text =>
            setTicketForm(prev => ({ ...prev, subject: text }))
          }
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Priority Level</Text>
        <View style={styles.severityOptions}>
          {(['low', 'medium', 'high', 'urgent'] as const).map(severity => (
            <TouchableOpacity
              key={severity}
              style={[
                styles.severityOption,
                ticketForm.severity === severity &&
                  styles.severityOptionSelected,
              ]}
              onPress={() => setTicketForm(prev => ({ ...prev, severity }))}
            >
              <Text
                style={[
                  styles.severityText,
                  ticketForm.severity === severity &&
                    styles.severityTextSelected,
                ]}
              >
                {severity.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Detailed Description</Text>
        <TextInput
          style={[styles.formInput, styles.formTextArea]}
          placeholder="Please describe your issue in detail. Include any error messages, steps you've tried, and when the problem started."
          placeholderTextColor={theme.textTertiary}
          value={ticketForm.description}
          onChangeText={text =>
            setTicketForm(prev => ({ ...prev, description: text }))
          }
          multiline
          numberOfLines={6}
        />
      </View>

      <View style={styles.attachmentsSection}>
        <Text style={styles.formLabel}>Attachments (Optional)</Text>
        <View style={styles.attachmentButtons}>
          <TouchableOpacity
            style={styles.attachmentButton}
            onPress={handleAttachImage}
          >
            <Text>📷</Text>
            <Text style={styles.attachmentButtonText}>Add Screenshot</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.attachmentButton}
            onPress={handleAttachDocument}
          >
            <Text>📄</Text>
            <Text style={styles.attachmentButtonText}>Add Document</Text>
          </TouchableOpacity>
        </View>

        {ticketForm.attachments.length > 0 && (
          <View style={styles.attachmentsList}>
            {ticketForm.attachments.map((attachment, index) => (
              <View key={index} style={styles.attachmentItem}>
                <Text>{attachment.type === 'image' ? '📷' : '📄'}</Text>
                <Text style={styles.attachmentName}>{attachment.name}</Text>
                <TouchableOpacity
                  style={styles.removeAttachmentButton}
                  onPress={() => removeAttachment(index)}
                >
                  <Text style={styles.removeAttachmentText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleSubmitTicket}
        disabled={isSubmitting}
      >
        <Text style={styles.actionButtonText}>
          {isSubmitting ? 'Submitting...' : 'Submit Support Request'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderConfirmation = () => (
    <View style={styles.confirmationContainer}>
      <Text style={styles.confirmationIcon}>✅</Text>
      <Text style={styles.confirmationTitle}>Support Request Submitted</Text>
      <Text style={styles.confirmationMessage}>
        We've received your support request and will respond to{' '}
        {ticketForm.userEmail} within{' '}
        {selectedCategory?.estimatedResponse || '4-8 hours'}.{'\n\n'}
        Your ticket reference number is: #{Date.now().toString().slice(-6)}
      </Text>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => router.back()}
      >
        <Text style={styles.actionButtonText}>Done</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.actionButtonSecondary]}
        onPress={resetForm}
      >
        <Text
          style={[styles.actionButtonText, styles.actionButtonTextSecondary]}
        >
          Submit Another Request
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={styles.closeButton} />
      </View>

      {step !== 'confirmation' && renderStepIndicator()}

      {step === 'category' && renderCategorySelection()}
      {step === 'self-help' && renderSelfHelp()}
      {step === 'ticket-form' && renderTicketForm()}
      {step === 'confirmation' && renderConfirmation()}

      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Submitting your request...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
