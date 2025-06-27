import { supabase } from '../supabase';
import { api } from '../../constants/api';

export interface StatementUploadResult {
  statementId: string;
  message: string;
  success: boolean;
  error?: string;
}

export interface ProcessingStatus {
  id: string;
  status: 'processing' | 'completed' | 'failed' | 'pending';
  bankName?: string;
  statementDate?: string;
  transactionCount?: number;
  errorMessage?: string;
  transactions?: ProcessedTransaction[];
  createdAt: string;
  processedAt?: string;
}

export interface ProcessedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit' | 'payment';
  category?: {
    id: string;
    name: string;
    color_hex?: string;
  };
  merchant?: {
    id: string;
    display_name: string;
  };
  confidence?: number;
}

export interface StatementHistory {
  statements: Array<{
    id: string;
    bank_name: string;
    statement_date: string;
    status: string;
    file_name: string;
    transaction_count: number;
    created_at: string;
    processed_at?: string;
    error_message?: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}

class StatementProcessingService {
  private baseUrl = api.baseURL;

  /**
   * Upload and process a statement file
   */
  async uploadStatement(file: {
    uri: string;
    name: string;
    type: string;
  }): Promise<StatementUploadResult> {
    try {
      // Get current session for authentication
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);

      const response = await fetch(`${this.baseUrl}/statements/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      return {
        statementId: result.statementId,
        message: result.message,
        success: true,
      };
    } catch (error) {
      console.error('Statement upload failed:', error);
      return {
        statementId: '',
        message: error.message || 'Upload failed',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get processing status for a statement
   */
  async getProcessingStatus(
    statementId: string
  ): Promise<ProcessingStatus | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(
        `${this.baseUrl}/statements/${statementId}/status`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch processing status');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get processing status:', error);
      return null;
    }
  }

  /**
   * Get user's statement history
   */
  async getStatementHistory(
    limit = 20,
    offset = 0
  ): Promise<StatementHistory | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`${this.baseUrl}/statements?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statement history');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get statement history:', error);
      return null;
    }
  }

  /**
   * Get pre-signed URL for direct file upload
   */
  async getUploadUrl(): Promise<{
    uploadUrl: string;
    filePath: string;
  } | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${this.baseUrl}/statements/upload-url`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get upload URL:', error);
      return null;
    }
  }

  /**
   * Poll processing status until completion
   */
  async pollProcessingStatus(
    statementId: string,
    onUpdate?: (status: ProcessingStatus) => void,
    maxRetries = 30,
    interval = 2000
  ): Promise<ProcessingStatus | null> {
    let retries = 0;

    while (retries < maxRetries) {
      const status = await this.getProcessingStatus(statementId);

      if (!status) {
        break;
      }

      if (onUpdate) {
        onUpdate(status);
      }

      // Stop polling if processing is complete
      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));
      retries++;
    }

    return null;
  }

  /**
   * Check if user can upload more statements (free tier validation)
   */
  async canUploadStatement(): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // This would integrate with the free tier service
      // For now, always allow uploads
      return { allowed: true };
    } catch (error) {
      console.error('Failed to check upload limits:', error);
      return { allowed: false, reason: 'Unable to verify upload limits' };
    }
  }
}

export const statementProcessingService = new StatementProcessingService();
