import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface QAError {
  id: string;
  timestamp: number;
  type: 'network' | 'api' | 'cache' | 'search' | 'parsing' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userMessage: string;
  context: {
    query?: string;
    userId?: string;
    action?: string;
    responseTime?: number;
    [key: string]: any;
  };
  recovered: boolean;
  retryCount?: number;
}

export interface ErrorRecoveryStrategy {
  type: string;
  maxRetries: number;
  backoffMs: number;
  fallbackAction: () => Promise<any>;
  shouldRetry: (error: any) => boolean;
}

export interface OfflineQueueItem {
  id: string;
  timestamp: number;
  action: 'query' | 'feedback' | 'analytics';
  data: any;
  retryCount: number;
}

const STORAGE_KEYS = {
  ERROR_LOG: 'qa_error_log',
  OFFLINE_QUEUE: 'qa_offline_queue',
  ERROR_PREFERENCES: 'qa_error_preferences',
};

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private offlineQueue: OfflineQueueItem[] = [];
  private isOnline: boolean = true;
  private errorLog: QAError[] = [];

  // Recovery strategies for different error types
  private readonly recoveryStrategies: {
    [key: string]: ErrorRecoveryStrategy;
  } = {
    network_timeout: {
      type: 'network_timeout',
      maxRetries: 3,
      backoffMs: 1000,
      shouldRetry: error => error.code === 'NETWORK_TIMEOUT',
      fallbackAction: async () => this.getFallbackResponse('network_issue'),
    },
    api_rate_limit: {
      type: 'api_rate_limit',
      maxRetries: 1,
      backoffMs: 5000,
      shouldRetry: error => error.status === 429,
      fallbackAction: async () => this.getFallbackResponse('rate_limited'),
    },
    server_error: {
      type: 'server_error',
      maxRetries: 2,
      backoffMs: 2000,
      shouldRetry: error => error.status >= 500 && error.status < 600,
      fallbackAction: async () => this.getFallbackResponse('server_error'),
    },
    search_failed: {
      type: 'search_failed',
      maxRetries: 1,
      backoffMs: 500,
      shouldRetry: () => true,
      fallbackAction: async () => this.getFallbackResponse('search_failed'),
    },
  };

  // User-friendly error messages
  private readonly userErrorMessages = {
    network_issue: {
      title: 'Connection Issue',
      message:
        'Having trouble connecting. Please check your internet connection and try again.',
      action: 'Try Again',
    },
    rate_limited: {
      title: 'Too Many Questions',
      message:
        "You've reached your question limit. Please wait a moment before asking another question.",
      action: 'Wait',
    },
    server_error: {
      title: 'Service Temporarily Unavailable',
      message:
        'Our service is experiencing issues. Please try again in a few moments.',
      action: 'Try Again',
    },
    search_failed: {
      title: 'Search Error',
      message:
        'Unable to search FAQs right now. Try browsing categories instead.',
      action: 'Browse FAQs',
    },
    parsing_error: {
      title: 'Response Error',
      message:
        'There was an issue processing the response. Please try rephrasing your question.',
      action: 'Try Again',
    },
    cache_error: {
      title: 'Storage Issue',
      message:
        'Unable to save your data locally. Your session may not be preserved.',
      action: 'Continue',
    },
    offline: {
      title: "You're Offline",
      message: 'No internet connection. You can still browse saved FAQs.',
      action: 'Browse Offline',
    },
    quota_exceeded: {
      title: 'Question Limit Reached',
      message:
        "You've used all your AI questions for this month. FAQ search is still available.",
      action: 'Browse FAQs',
    },
    unknown: {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again.',
      action: 'Try Again',
    },
  };

  private constructor() {
    this.initializeErrorHandling();
  }

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Initialize error handling system
   */
  private async initializeErrorHandling(): Promise<void> {
    try {
      // Load stored error log
      await this.loadErrorLog();

      // Load offline queue
      await this.loadOfflineQueue();

      // Set up network monitoring
      this.setupNetworkMonitoring();

      // Process any queued offline items
      await this.processOfflineQueue();

      console.log('[Error Handling] Service initialized successfully');
    } catch (error) {
      console.error('[Error Handling] Failed to initialize:', error);
    }
  }

  /**
   * Handle an error with automatic recovery
   */
  async handleError(
    error: any,
    context: {
      query?: string;
      userId?: string;
      action?: string;
      [key: string]: any;
    }
  ): Promise<{
    recovered: boolean;
    userMessage: any;
    fallbackData?: any;
    shouldRetry?: boolean;
  }> {
    try {
      // Create error record
      const qaError: QAError = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type: this.determineErrorType(error),
        severity: this.determineSeverity(error),
        message: error.message || error.toString(),
        userMessage: this.getUserFriendlyMessage(error),
        context,
        recovered: false,
        retryCount: 0,
      };

      // Log the error
      await this.logError(qaError);

      // Attempt recovery
      const recoveryResult = await this.attemptRecovery(error, qaError);

      return {
        recovered: recoveryResult.success,
        userMessage:
          this.userErrorMessages[qaError.userMessage] ||
          this.userErrorMessages.unknown,
        fallbackData: recoveryResult.fallbackData,
        shouldRetry: recoveryResult.shouldRetry,
      };
    } catch (handlingError) {
      console.error('[Error Handling] Failed to handle error:', handlingError);

      return {
        recovered: false,
        userMessage: this.userErrorMessages.unknown,
        shouldRetry: false,
      };
    }
  }

  /**
   * Queue action for offline processing
   */
  async queueOfflineAction(
    action: 'query' | 'feedback' | 'analytics',
    data: any
  ): Promise<void> {
    try {
      const queueItem: OfflineQueueItem = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        action,
        data,
        retryCount: 0,
      };

      this.offlineQueue.push(queueItem);
      await this.saveOfflineQueue();

      console.log(`[Error Handling] Queued offline action: ${action}`);
    } catch (error) {
      console.error('[Error Handling] Failed to queue offline action:', error);
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStatistics(): Promise<{
    totalErrors: number;
    errorsByType: { [key: string]: number };
    errorsBySeverity: { [key: string]: number };
    recoveryRate: number;
    recentErrors: QAError[];
  }> {
    try {
      const totalErrors = this.errorLog.length;
      const recoveredErrors = this.errorLog.filter(
        error => error.recovered
      ).length;

      const errorsByType = this.errorLog.reduce(
        (acc, error) => {
          acc[error.type] = (acc[error.type] || 0) + 1;
          return acc;
        },
        {} as { [key: string]: number }
      );

      const errorsBySeverity = this.errorLog.reduce(
        (acc, error) => {
          acc[error.severity] = (acc[error.severity] || 0) + 1;
          return acc;
        },
        {} as { [key: string]: number }
      );

      // Get recent errors (last 10)
      const recentErrors = this.errorLog
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);

      return {
        totalErrors,
        errorsByType,
        errorsBySeverity,
        recoveryRate:
          totalErrors > 0 ? (recoveredErrors / totalErrors) * 100 : 0,
        recentErrors,
      };
    } catch (error) {
      console.error('[Error Handling] Failed to get error statistics:', error);
      return {
        totalErrors: 0,
        errorsByType: {},
        errorsBySeverity: {},
        recoveryRate: 0,
        recentErrors: [],
      };
    }
  }

  /**
   * Clear error log
   */
  async clearErrorLog(): Promise<void> {
    try {
      this.errorLog = [];
      await AsyncStorage.removeItem(STORAGE_KEYS.ERROR_LOG);
      console.log('[Error Handling] Error log cleared');
    } catch (error) {
      console.error('[Error Handling] Failed to clear error log:', error);
    }
  }

  /**
   * Check if device is online
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get offline queue status
   */
  getOfflineQueueStatus(): {
    itemCount: number;
    oldestItem?: Date;
    queueSize: number;
  } {
    const itemCount = this.offlineQueue.length;
    const oldestItem =
      itemCount > 0
        ? new Date(Math.min(...this.offlineQueue.map(item => item.timestamp)))
        : undefined;

    return {
      itemCount,
      oldestItem,
      queueSize: JSON.stringify(this.offlineQueue).length,
    };
  }

  // Private helper methods

  private async setupNetworkMonitoring(): Promise<void> {
    try {
      // Initial network state
      const netInfo = await NetInfo.fetch();
      this.isOnline = netInfo.isConnected === true;

      // Monitor network changes
      NetInfo.addEventListener(state => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected === true;

        if (!wasOnline && this.isOnline) {
          // Came back online, process queue
          this.processOfflineQueue();
        }
      });
    } catch (error) {
      console.error(
        '[Error Handling] Failed to setup network monitoring:',
        error
      );
    }
  }

  private async attemptRecovery(
    originalError: any,
    qaError: QAError
  ): Promise<{
    success: boolean;
    fallbackData?: any;
    shouldRetry: boolean;
  }> {
    try {
      const errorKey = this.getErrorKey(originalError);
      const strategy = this.recoveryStrategies[errorKey];

      if (!strategy) {
        return { success: false, shouldRetry: false };
      }

      // Check if we should retry
      if (!strategy.shouldRetry(originalError)) {
        return { success: false, shouldRetry: false };
      }

      // Check retry count
      const retryCount = qaError.retryCount || 0;
      if (retryCount >= strategy.maxRetries) {
        // Max retries reached, use fallback
        const fallbackData = await strategy.fallbackAction();
        qaError.recovered = true;

        return {
          success: true,
          fallbackData,
          shouldRetry: false,
        };
      }

      // Increment retry count
      qaError.retryCount = retryCount + 1;

      return {
        success: false,
        shouldRetry: true,
      };
    } catch (error) {
      console.error('[Error Handling] Recovery attempt failed:', error);
      return { success: false, shouldRetry: false };
    }
  }

  private async getFallbackResponse(errorType: string): Promise<any> {
    switch (errorType) {
      case 'network_issue':
        return {
          response:
            "I'm having trouble connecting to our servers right now. You can browse our FAQ section for common financial questions, or try again when your connection improves.",
          source: 'fallback',
          suggestions: [
            'How do I check my credit score?',
            "What's the difference between TFSA and RRSP?",
            'How can I improve my credit score?',
          ],
        };

      case 'rate_limited':
        return {
          response:
            "You've reached your question limit for now. While you wait, you can browse our comprehensive FAQ section for answers to common Canadian financial questions.",
          source: 'fallback',
          suggestions: [
            'Browse Credit Score FAQs',
            'Explore Budgeting Tips',
            'Learn About Canadian Banking',
          ],
        };

      case 'server_error':
        return {
          response:
            'Our AI assistant is temporarily unavailable. You can still access our FAQ database with hundreds of Canadian financial answers.',
          source: 'fallback',
          suggestions: [
            'Search FAQ Database',
            'Browse Categories',
            'Try Again Later',
          ],
        };

      case 'search_failed':
        return {
          response:
            'Search is temporarily unavailable. Try browsing our organized FAQ categories instead.',
          source: 'fallback',
          suggestions: [
            'Credit Scores & Reports',
            'Budgeting & Saving',
            'Banking in Canada',
            'Using ClariFi',
          ],
        };

      default:
        return {
          response:
            'Something went wrong, but you can still browse our FAQ section for financial guidance.',
          source: 'fallback',
          suggestions: ['Browse FAQs'],
        };
    }
  }

  private determineErrorType(error: any): QAError['type'] {
    if (!navigator.onLine || error.message?.includes('network'))
      return 'network';
    if (error.status >= 400 && error.status < 500) return 'api';
    if (error.status >= 500) return 'api';
    if (error.message?.includes('cache') || error.message?.includes('storage'))
      return 'cache';
    if (error.message?.includes('search') || error.message?.includes('find'))
      return 'search';
    if (error.message?.includes('parse') || error.message?.includes('JSON'))
      return 'parsing';
    return 'system';
  }

  private determineSeverity(error: any): QAError['severity'] {
    if (error.status >= 500 || error.message?.includes('critical'))
      return 'critical';
    if (error.status === 429 || error.message?.includes('limit')) return 'high';
    if (error.status >= 400 || !navigator.onLine) return 'medium';
    return 'low';
  }

  private getUserFriendlyMessage(error: any): string {
    if (!navigator.onLine) return 'offline';
    if (error.status === 429) return 'rate_limited';
    if (error.status >= 500) return 'server_error';
    if (
      error.message?.includes('network') ||
      error.message?.includes('timeout')
    )
      return 'network_issue';
    if (error.message?.includes('search')) return 'search_failed';
    if (error.message?.includes('parse')) return 'parsing_error';
    if (error.message?.includes('cache') || error.message?.includes('storage'))
      return 'cache_error';
    if (error.message?.includes('quota') || error.message?.includes('limit'))
      return 'quota_exceeded';
    return 'unknown';
  }

  private getErrorKey(error: any): string {
    if (error.message?.includes('timeout')) return 'network_timeout';
    if (error.status === 429) return 'api_rate_limit';
    if (error.status >= 500) return 'server_error';
    if (error.message?.includes('search')) return 'search_failed';
    return 'unknown';
  }

  private async logError(error: QAError): Promise<void> {
    try {
      this.errorLog.push(error);

      // Keep only last 100 errors
      if (this.errorLog.length > 100) {
        this.errorLog = this.errorLog.slice(-100);
      }

      await this.saveErrorLog();

      console.log(
        `[Error Handling] Logged ${error.severity} error: ${error.type}`
      );
    } catch (storageError) {
      console.error('[Error Handling] Failed to log error:', storageError);
    }
  }

  private async loadErrorLog(): Promise<void> {
    try {
      const errorLogData = await AsyncStorage.getItem(STORAGE_KEYS.ERROR_LOG);
      if (errorLogData) {
        this.errorLog = JSON.parse(errorLogData);
      }
    } catch (error) {
      console.error('[Error Handling] Failed to load error log:', error);
      this.errorLog = [];
    }
  }

  private async saveErrorLog(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ERROR_LOG,
        JSON.stringify(this.errorLog)
      );
    } catch (error) {
      console.error('[Error Handling] Failed to save error log:', error);
    }
  }

  private async loadOfflineQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('[Error Handling] Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  private async saveOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_QUEUE,
        JSON.stringify(this.offlineQueue)
      );
    } catch (error) {
      console.error('[Error Handling] Failed to save offline queue:', error);
    }
  }

  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    console.log(
      `[Error Handling] Processing ${this.offlineQueue.length} offline items`
    );

    const processedItems: string[] = [];

    for (const item of this.offlineQueue) {
      try {
        // Process based on action type
        await this.processOfflineItem(item);
        processedItems.push(item.id);
      } catch (error) {
        console.error(
          `[Error Handling] Failed to process offline item ${item.id}:`,
          error
        );

        // Increment retry count
        item.retryCount++;

        // Remove if too many retries
        if (item.retryCount >= 3) {
          processedItems.push(item.id);
        }
      }
    }

    // Remove processed items
    this.offlineQueue = this.offlineQueue.filter(
      item => !processedItems.includes(item.id)
    );
    await this.saveOfflineQueue();

    console.log(
      `[Error Handling] Processed ${processedItems.length} offline items`
    );
  }

  private async processOfflineItem(item: OfflineQueueItem): Promise<void> {
    switch (item.action) {
      case 'query':
        // Re-attempt the query
        // This would integrate with the actual QA service
        console.log(`[Error Handling] Re-attempting query: ${item.data.query}`);
        break;

      case 'feedback':
        // Submit feedback
        console.log(
          `[Error Handling] Submitting feedback: ${item.data.rating}`
        );
        break;

      case 'analytics':
        // Send analytics data
        console.log(`[Error Handling] Sending analytics: ${item.data.event}`);
        break;
    }
  }
}

export default ErrorHandlingService;
