import { Alert } from 'react-native';
import { freeTierService } from '../subscription/freeTierService';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  showUpgrade?: boolean;
}

class LimitValidationService {
  /**
   * Validate bank connection attempt
   */
  async validateBankConnection(userId: string): Promise<ValidationResult> {
    const canConnect = await freeTierService.canPerformAction(
      userId,
      'connect_bank'
    );

    if (!canConnect.allowed) {
      return {
        isValid: false,
        error: canConnect.reason,
        showUpgrade: canConnect.upgradeRequired,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate document upload attempt
   */
  async validateDocumentUpload(userId: string): Promise<ValidationResult> {
    const canUpload = await freeTierService.canPerformAction(
      userId,
      'upload_document'
    );

    if (!canUpload.allowed) {
      return {
        isValid: false,
        error: canUpload.reason,
        showUpgrade: canUpload.upgradeRequired,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate AI query attempt
   */
  async validateAIQuery(userId: string): Promise<ValidationResult> {
    const canQuery = await freeTierService.canPerformAction(userId, 'ai_query');

    if (!canQuery.allowed) {
      return {
        isValid: false,
        error: canQuery.reason,
        showUpgrade: canQuery.upgradeRequired,
      };
    }

    return { isValid: true };
  }

  /**
   * Show upgrade prompt with options
   */
  showUpgradePrompt(
    message: string,
    onUpgrade?: () => void,
    onCancel?: () => void
  ): void {
    Alert.alert(
      'Upgrade Required',
      `${message}\n\nUpgrade to Premium for unlimited access to all features.`,
      [
        {
          text: 'Maybe Later',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: 'Upgrade Now',
          style: 'default',
          onPress:
            onUpgrade ||
            (() => {
              // Navigate to upgrade screen
              console.log('Navigate to upgrade screen');
            }),
        },
      ]
    );
  }

  /**
   * Record successful action and update usage
   */
  async recordSuccessfulAction(
    userId: string,
    action: 'connect_bank' | 'upload_document' | 'ai_query'
  ): Promise<void> {
    await freeTierService.recordUsage(userId, action);
  }

  /**
   * Check and enforce limits before performing an action
   */
  async enforceLimit(
    userId: string,
    action: 'connect_bank' | 'upload_document' | 'ai_query',
    onSuccess: () => Promise<void> | void,
    onUpgrade?: () => void
  ): Promise<void> {
    let validation: ValidationResult;

    switch (action) {
      case 'connect_bank':
        validation = await this.validateBankConnection(userId);
        break;
      case 'upload_document':
        validation = await this.validateDocumentUpload(userId);
        break;
      case 'ai_query':
        validation = await this.validateAIQuery(userId);
        break;
    }

    if (!validation.isValid) {
      if (validation.showUpgrade) {
        this.showUpgradePrompt(validation.error!, onUpgrade);
      } else {
        Alert.alert('Limit Reached', validation.error!);
      }
      return;
    }

    try {
      await onSuccess();
      await this.recordSuccessfulAction(userId, action);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  }

  /**
   * Get usage summary for display
   */
  async getUsageSummary(userId: string): Promise<{
    banks: { used: number; limit: number };
    documents: { used: number; limit: number };
    aiQueries: { used: number; limit: number };
    isPremium: boolean;
  }> {
    const [tier, usage] = await Promise.all([
      freeTierService.getUserTier(userId),
      freeTierService.getUserUsage(userId),
    ]);

    return {
      banks: {
        used: usage.banksConnected,
        limit: tier.limits.maxBanks,
      },
      documents: {
        used: usage.documentsUploaded,
        limit: tier.limits.maxDocuments,
      },
      aiQueries: {
        used: usage.aiQueriesUsed,
        limit: tier.limits.maxAIQueries,
      },
      isPremium: tier.limits.hasPremiumFeatures,
    };
  }
}

export const limitValidationService = new LimitValidationService();
