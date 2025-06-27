import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Transaction,
  AppSettings,
  CreditCard,
  EducationModuleProgress,
  AIUsageStats,
} from '../storage/dataModels';
import { CATEGORIES, getCategoryById } from '../../constants/categories';
import { useTransactions } from '../../hooks/useTransactions';
import { supabase } from '../supabase/client';
import { getObject, getString, STORAGE_KEYS } from '../storage/asyncStorage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SecureFileService } from './SecureFileService';
import { PrivacyAuditService, PrivacyAction } from './PrivacyAuditService';

interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dateRange: string;
  includePersonalInfo: boolean;
  includeTransactions: boolean;
  includeCategories: boolean;
  includeSettings: boolean;
  includeQAHistory: boolean;
}

interface ExportPreview {
  transactionCount: number;
  categoryCount: number;
  personalInfoFields: number;
  estimatedSize: string;
  dateRange: string;
}

interface ExportResult {
  exportId: string;
  estimatedCompletion: string;
  filePath?: string;
  fileSize?: string;
  success?: boolean;
  error?: string;
  downloadUrl?: string;
}

export class DataExportService {
  async getExportPreview(options: ExportOptions): Promise<ExportPreview> {
    // Simulate API call with realistic data calculation
    await new Promise(resolve => setTimeout(resolve, 500));

    // Calculate estimated counts based on date range and included data types
    let transactionCount = 0;
    let categoryCount = 0;
    let personalInfoFields = 0;
    let estimatedSize = 0;

    if (options.includeTransactions) {
      // Estimate based on date range (rough calculation)
      const monthsInRange = this.calculateMonthsInRange(options.dateRange);
      transactionCount = Math.floor(monthsInRange * 120); // ~120 transactions per month
      estimatedSize += transactionCount * 0.5; // ~0.5KB per transaction
    }

    if (options.includeCategories) {
      categoryCount = 24; // Standard number of categories
      estimatedSize += categoryCount * 0.1; // ~0.1KB per category
    }

    if (options.includePersonalInfo) {
      personalInfoFields = 8; // Name, email, preferences, etc.
      estimatedSize += 2; // ~2KB for personal info
    }

    if (options.includeSettings) {
      estimatedSize += 5; // ~5KB for settings
    }

    if (options.includeQAHistory) {
      estimatedSize += 10; // ~10KB for Q&A history
    }

    return {
      transactionCount,
      categoryCount,
      personalInfoFields,
      estimatedSize: this.formatFileSize(estimatedSize * 1024), // Convert to bytes then format
      dateRange: this.formatDateRange(options.dateRange),
    };
  }

  async initiateExport(options: ExportOptions): Promise<ExportResult> {
    // For CSV format, generate immediately
    if (options.format === 'csv') {
      return this.generateCSVExport(options);
    }

    // For JSON format, generate immediately
    if (options.format === 'json') {
      return this.generateJSONExport(options);
    }

    // For PDF format, generate immediately
    if (options.format === 'pdf') {
      return this.generatePDFExport(options);
    }

    // For other formats, simulate longer processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      exportId: 'EXP-' + Date.now(),
      estimatedCompletion: '5-10 minutes',
    };
  }

  private async generateCSVExport(
    options: ExportOptions
  ): Promise<ExportResult> {
    const exportId = 'CSV-' + Date.now();
    let userId = 'anonymous';

    try {
      // Get user ID for audit logging
      const {
        data: { session },
      } = await supabase.auth.getSession();
      userId = session?.user?.id || 'anonymous';

      // Log export request
      await PrivacyAuditService.logEvent(
        userId,
        PrivacyAction.EXPORT_REQUEST,
        `csv_export_${exportId}`,
        { format: 'csv', options }
      );

      const csvData = await this.buildCSVData(options);

      // Create and save the CSV file
      const filePath = await this.createCsvFile(exportId, csvData);

      // Encrypt file and create secure download token
      const secureInfo = await SecureFileService.encryptFile(
        filePath,
        userId,
        exportId
      );

      const fileSize = this.formatFileSize(csvData.length);

      // Log successful export generation
      await PrivacyAuditService.logDataExport(userId, 'csv', options, {
        success: true,
        fileSize,
      });

      // Log file encryption
      await PrivacyAuditService.logFileOperation(userId, 'encrypt', exportId, {
        success: true,
      });

      return {
        exportId,
        estimatedCompletion: 'Ready for download',
        filePath: secureInfo.encryptedPath,
        fileSize,
        success: true,
        downloadUrl: secureInfo.downloadToken, // Use token as download URL
      };
    } catch (error) {
      console.error('CSV export generation failed:', error);

      // Log failed export
      await PrivacyAuditService.logDataExport(userId, 'csv', options, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        exportId,
        estimatedCompletion: 'Failed',
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate CSV export',
      };
    }
  }

  private async generateJSONExport(
    options: ExportOptions
  ): Promise<ExportResult> {
    const exportId = 'JSON-' + Date.now();
    let userId = 'anonymous';

    try {
      // Get user ID for audit logging
      const {
        data: { session },
      } = await supabase.auth.getSession();
      userId = session?.user?.id || 'anonymous';

      // Log export request
      await PrivacyAuditService.logEvent(
        userId,
        PrivacyAction.EXPORT_REQUEST,
        `json_export_${exportId}`,
        { format: 'json', options }
      );

      const jsonData = await this.buildJSONData(options);

      // Create and save the JSON file
      const filePath = await this.createJsonFile(exportId, jsonData);

      // Encrypt file and create secure download token
      const secureInfo = await SecureFileService.encryptFile(
        filePath,
        userId,
        exportId
      );

      const fileSize = this.formatFileSize(JSON.stringify(jsonData).length);

      // Log successful export generation
      await PrivacyAuditService.logDataExport(userId, 'json', options, {
        success: true,
        fileSize,
      });

      // Log file encryption
      await PrivacyAuditService.logFileOperation(userId, 'encrypt', exportId, {
        success: true,
      });

      return {
        exportId,
        estimatedCompletion: 'Ready for download',
        filePath: secureInfo.encryptedPath,
        fileSize,
        success: true,
        downloadUrl: secureInfo.downloadToken,
      };
    } catch (error) {
      console.error('JSON export generation failed:', error);

      // Log failed export
      await PrivacyAuditService.logDataExport(userId, 'json', options, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        exportId,
        estimatedCompletion: 'Failed',
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate JSON export',
      };
    }
  }

  private async generatePDFExport(
    options: ExportOptions
  ): Promise<ExportResult> {
    const exportId = 'PDF-' + Date.now();
    let userId = 'anonymous';

    try {
      // Get user ID for audit logging
      const {
        data: { session },
      } = await supabase.auth.getSession();
      userId = session?.user?.id || 'anonymous';

      // Log export request
      await PrivacyAuditService.logEvent(
        userId,
        PrivacyAction.EXPORT_REQUEST,
        `pdf_export_${exportId}`,
        { format: 'pdf', options }
      );

      const htmlContent = await this.buildPDFData(options);

      // Create and save the HTML file (for PDF conversion)
      const filePath = await this.createPdfFile(exportId, htmlContent);

      // Encrypt file and create secure download token
      const secureInfo = await SecureFileService.encryptFile(
        filePath,
        userId,
        exportId
      );

      const fileSize = this.formatFileSize(htmlContent.length);

      // Log successful export generation
      await PrivacyAuditService.logDataExport(userId, 'pdf', options, {
        success: true,
        fileSize,
      });

      // Log file encryption
      await PrivacyAuditService.logFileOperation(userId, 'encrypt', exportId, {
        success: true,
      });

      return {
        exportId,
        estimatedCompletion: 'Ready for download',
        filePath: secureInfo.encryptedPath,
        fileSize,
        success: true,
        downloadUrl: secureInfo.downloadToken,
      };
    } catch (error) {
      console.error('PDF export generation failed:', error);

      // Log failed export
      await PrivacyAuditService.logDataExport(userId, 'pdf', options, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        exportId,
        estimatedCompletion: 'Failed',
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate PDF export',
      };
    }
  }

  private async buildPDFData(options: ExportOptions): Promise<string> {
    // Get data first
    const personalInfo = options.includePersonalInfo
      ? await this.generatePersonalInfoJSON()
      : null;
    const transactions = options.includeTransactions
      ? await this.generateTransactionsJSON(options.dateRange)
      : null;
    const categories = options.includeCategories
      ? await this.generateCategoriesJSON()
      : null;
    const settings = options.includeSettings
      ? await this.generateSettingsJSON()
      : null;
    const qaHistory = options.includeQAHistory
      ? await this.generateQAHistoryJSON()
      : null;

    // Generate HTML content
    let html = this.generatePDFHeader();

    if (personalInfo) {
      html += this.generatePersonalInfoPDF(personalInfo);
    }

    if (transactions) {
      html += this.generateTransactionsPDF(transactions);
    }

    if (categories) {
      html += this.generateCategoriesPDF(categories);
    }

    if (settings) {
      html += this.generateSettingsPDF(settings);
    }

    if (qaHistory) {
      html += this.generateQAHistoryPDF(qaHistory);
    }

    html += this.generatePDFFooter();

    return html;
  }

  private generatePDFHeader(): string {
    const now = new Date();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ClariFi Data Export</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #007AFF;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007AFF;
            margin: 0;
            font-size: 2.5em;
        }
        .header .subtitle {
            color: #666;
            margin: 10px 0;
        }
        .section {
            margin: 30px 0;
            page-break-inside: avoid;
        }
        .section h2 {
            color: #007AFF;
            border-bottom: 2px solid #E5E5E5;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .section h3 {
            color: #333;
            margin-top: 25px;
            margin-bottom: 15px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 15px 0;
        }
        .info-item {
            display: flex;
            flex-direction: column;
        }
        .info-label {
            font-weight: 600;
            color: #666;
            font-size: 0.9em;
            margin-bottom: 5px;
        }
        .info-value {
            color: #333;
            font-size: 1em;
        }
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background: #F8F9FA;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #E5E5E5;
        }
        .stat-value {
            font-size: 1.5em;
            font-weight: 700;
            color: #007AFF;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 0.9em;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #E5E5E5;
        }
        th {
            background-color: #F8F9FA;
            font-weight: 600;
            color: #333;
        }
        tr:hover {
            background-color: #F8F9FA;
        }
        .amount {
            font-weight: 600;
        }
        .amount.positive {
            color: #34C759;
        }
        .amount.negative {
            color: #FF3B30;
        }
        .category {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: 500;
            color: white;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #E5E5E5;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        .privacy-notice {
            background: #FFF3CD;
            border: 1px solid #FFEAA7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .privacy-notice h4 {
            color: #856404;
            margin: 0 0 10px 0;
        }
        .privacy-notice p {
            color: #856404;
            margin: 0;
            font-size: 0.9em;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ClariFi</h1>
        <div class="subtitle">Personal Financial Data Export</div>
        <div class="subtitle">Generated on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}</div>
    </div>
    
    <div class="privacy-notice">
        <h4>🔒 Privacy & Security Notice</h4>
        <p>This document contains your personal financial information exported in compliance with PIPEDA (Personal Information Protection and Electronic Documents Act). Please store this document securely and delete it when no longer needed.</p>
    </div>
`;
  }

  private generatePersonalInfoPDF(personalInfo: any): string {
    if (personalInfo.error) {
      return `
    <div class="section">
        <h2>Personal Information</h2>
        <p>Error: ${personalInfo.error}</p>
    </div>`;
    }

    return `
    <div class="section">
        <h2>Personal Information</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Export Date</div>
                <div class="info-value">${new Date(personalInfo.exportDate).toLocaleDateString()}</div>
            </div>
            <div class="info-item">
                <div class="info-label">User ID</div>
                <div class="info-value">${personalInfo.userId || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${personalInfo.email || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Account Created</div>
                <div class="info-value">${personalInfo.accountCreated ? new Date(personalInfo.accountCreated).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Last Login</div>
                <div class="info-value">${personalInfo.lastLogin ? new Date(personalInfo.lastLogin).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Language</div>
                <div class="info-value">${personalInfo.preferences?.language || 'en'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Theme</div>
                <div class="info-value">${personalInfo.preferences?.theme || 'system'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Biometric Enabled</div>
                <div class="info-value">${personalInfo.preferences?.biometricEnabled ? 'Yes' : 'No'}</div>
            </div>
        </div>
    </div>`;
  }

  private generateTransactionsPDF(transactions: any): string {
    if (transactions.error) {
      return `
    <div class="section">
        <h2>Transactions</h2>
        <p>Error: ${transactions.error}</p>
    </div>`;
    }

    const { summary } = transactions;

    let html = `
    <div class="section">
        <h2>Transactions</h2>
        <h3>Summary (${transactions.dateRange?.description})</h3>
        <div class="summary-stats">
            <div class="stat-card">
                <div class="stat-value">${summary.totalCount}</div>
                <div class="stat-label">Total Transactions</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">$${Math.abs(summary.totalAmount || 0).toFixed(2)}</div>
                <div class="stat-label">Total Amount</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">$${(summary.totalIncome || 0).toFixed(2)}</div>
                <div class="stat-label">Total Income</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">$${(summary.totalExpenses || 0).toFixed(2)}</div>
                <div class="stat-label">Total Expenses</div>
            </div>
        </div>`;

    if (transactions.transactions && transactions.transactions.length > 0) {
      html += `
        <h3>Transaction Details</h3>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Merchant</th>
                </tr>
            </thead>
            <tbody>`;

      transactions.transactions.forEach((transaction: any) => {
        const amountClass = transaction.amount >= 0 ? 'positive' : 'negative';
        const amountSymbol = transaction.amount >= 0 ? '+' : '';
        html += `
                <tr>
                    <td>${new Date(transaction.date).toLocaleDateString()}</td>
                    <td>${transaction.description || 'N/A'}</td>
                    <td>${transaction.category?.name || 'Uncategorized'}</td>
                    <td class="amount ${amountClass}">${amountSymbol}$${Math.abs(transaction.amount).toFixed(2)}</td>
                    <td>${transaction.merchant || 'N/A'}</td>
                </tr>`;
      });

      html += `
            </tbody>
        </table>`;
    }

    html += `</div>`;
    return html;
  }

  private generateCategoriesPDF(categories: any): string {
    if (categories.error) {
      return `
    <div class="section">
        <h2>Categories</h2>
        <p>Error: ${categories.error}</p>
    </div>`;
    }

    let html = `
    <div class="section">
        <h2>Categories</h2>
        <h3>Category Summary</h3>
        <div class="summary-stats">
            <div class="stat-card">
                <div class="stat-value">${categories.summary?.totalCategories || 0}</div>
                <div class="stat-label">Total Categories</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${categories.summary?.totalTransactions || 0}</div>
                <div class="stat-label">Total Transactions</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">$${Math.abs(categories.summary?.totalAmount || 0).toFixed(2)}</div>
                <div class="stat-label">Total Amount</div>
            </div>
        </div>`;

    if (categories.categories && categories.categories.length > 0) {
      html += `
        <h3>Category Breakdown</h3>
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Total Spent</th>
                    <th>Transaction Count</th>
                    <th>Average Transaction</th>
                </tr>
            </thead>
            <tbody>`;

      categories.categories.forEach((category: any) => {
        html += `
                <tr>
                    <td>
                        <span class="category" style="background-color: ${category.color}">
                            ${category.name}
                        </span>
                    </td>
                    <td class="amount">$${Math.abs(category.statistics.totalSpent).toFixed(2)}</td>
                    <td>${category.statistics.transactionCount}</td>
                    <td class="amount">$${Math.abs(category.statistics.averageTransaction).toFixed(2)}</td>
                </tr>`;
      });

      html += `
            </tbody>
        </table>`;
    }

    html += `</div>`;
    return html;
  }

  private generateSettingsPDF(settings: any): string {
    if (settings.error) {
      return `
    <div class="section">
        <h2>Settings</h2>
        <p>Error: ${settings.error}</p>
    </div>`;
    }

    return `
    <div class="section">
        <h2>Application Settings</h2>
        
        <h3>Application Preferences</h3>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Language</div>
                <div class="info-value">${settings.application?.language || 'en'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Theme</div>
                <div class="info-value">${settings.application?.theme || 'system'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Biometric Authentication</div>
                <div class="info-value">${settings.application?.biometricAuthentication ? 'Enabled' : 'Disabled'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Onboarding Completed</div>
                <div class="info-value">${settings.application?.onboardingCompleted ? 'Yes' : 'No'}</div>
            </div>
        </div>

        <h3>Notification Settings</h3>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Notifications Enabled</div>
                <div class="info-value">${settings.notifications?.enabled ? 'Yes' : 'No'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Quiet Hours</div>
                <div class="info-value">${
                  settings.notifications?.quietHours?.enabled
                    ? `${settings.notifications.quietHours.startHour}:00 - ${settings.notifications.quietHours.endHour}:00`
                    : 'Disabled'
                }</div>
            </div>
        </div>

        <h3>Credit Card Settings</h3>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Utilization Alert Threshold</div>
                <div class="info-value">${settings.creditCardSettings?.utilizationAlertThreshold || 70}%</div>
            </div>
            <div class="info-item">
                <div class="info-label">Target Overall Utilization</div>
                <div class="info-value">${settings.creditCardSettings?.targetOverallUtilization || 30}%</div>
            </div>
        </div>
    </div>`;
  }

  private generateQAHistoryPDF(qaHistory: any): string {
    if (qaHistory.error) {
      return `
    <div class="section">
        <h2>Q&A History</h2>
        <p>Error: ${qaHistory.error}</p>
    </div>`;
    }

    return `
    <div class="section">
        <h2>AI Assistant Usage</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Queries This Month</div>
                <div class="info-value">${qaHistory.summary?.currentMonthQueries || 0}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Monthly Query Limit</div>
                <div class="info-value">${qaHistory.summary?.queryLimitPerMonth || 50}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Last Query</div>
                <div class="info-value">${
                  qaHistory.summary?.lastQueryTimestamp
                    ? new Date(
                        qaHistory.summary.lastQueryTimestamp
                      ).toLocaleDateString()
                    : 'N/A'
                }</div>
            </div>
        </div>
        <p><em>${qaHistory.note || ''}</em></p>
    </div>`;
  }

  private generatePDFFooter(): string {
    return `
    <div class="footer">
        <p>This report was generated by ClariFi - Personal Financial Management</p>
        <p>Data exported in compliance with PIPEDA privacy regulations</p>
        <p>For questions about your data, please contact our privacy officer</p>
    </div>
</body>
</html>`;
  }

  private async createPdfFile(
    exportId: string,
    htmlContent: string
  ): Promise<string> {
    try {
      // Create filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `clarifi_export_${timestamp}_${exportId}.html`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;

      // Write HTML content to file
      await FileSystem.writeAsStringAsync(filePath, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      console.log(`PDF export (HTML) saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error creating PDF file:', error);
      throw error;
    }
  }

  private async buildJSONData(options: ExportOptions): Promise<any> {
    const jsonData: any = {
      metadata: {
        exportId: 'JSON-' + Date.now(),
        exportDate: new Date().toISOString(),
        exportFormat: 'json',
        dataVersion: '1.0',
        applicationName: 'ClariFi',
        applicationVersion: '1.0.0',
        exportOptions: {
          dateRange: options.dateRange,
          includePersonalInfo: options.includePersonalInfo,
          includeTransactions: options.includeTransactions,
          includeCategories: options.includeCategories,
          includeSettings: options.includeSettings,
          includeQAHistory: options.includeQAHistory,
        },
      },
      data: {},
    };

    if (options.includePersonalInfo) {
      jsonData.data.personalInfo = await this.generatePersonalInfoJSON();
    }

    if (options.includeTransactions) {
      jsonData.data.transactions = await this.generateTransactionsJSON(
        options.dateRange
      );
    }

    if (options.includeCategories) {
      jsonData.data.categories = await this.generateCategoriesJSON();
    }

    if (options.includeSettings) {
      jsonData.data.settings = await this.generateSettingsJSON();
    }

    if (options.includeQAHistory) {
      jsonData.data.qaHistory = await this.generateQAHistoryJSON();
    }

    return jsonData;
  }

  private async generatePersonalInfoJSON(): Promise<any> {
    try {
      // Get user data from Supabase session and local storage
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const appSettings = await getObject<AppSettings>(
        STORAGE_KEYS.APP_SETTINGS
      );

      return {
        exportDate: new Date().toISOString(),
        userId: session?.user?.id || null,
        email: session?.user?.email || null,
        accountCreated: session?.user?.created_at || null,
        lastLogin: session?.user?.last_sign_in_at || null,
        preferences: {
          language: appSettings?.preferred_language || 'en',
          theme: appSettings?.theme || 'system',
          biometricEnabled: appSettings?.is_biometric_enabled || false,
          onboardingCompleted: appSettings?.onboarding_completed || false,
        },
      };
    } catch (error) {
      console.error('Error generating personal info JSON:', error);
      return {
        error: 'Failed to retrieve personal information',
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async generateTransactionsJSON(dateRange: string): Promise<any> {
    try {
      // Get real transactions from Supabase
      const { startDate, endDate } = this.parseDateRange(dateRange);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        dateRange: {
          start: startDate,
          end: endDate,
          description: this.formatDateRange(dateRange),
        },
        summary: {
          totalCount: transactions?.length || 0,
          totalAmount: transactions?.reduce((sum, t) => sum + t.amount, 0) || 0,
          incomeCount: transactions?.filter(t => t.amount > 0).length || 0,
          expenseCount: transactions?.filter(t => t.amount < 0).length || 0,
          totalIncome:
            transactions
              ?.filter(t => t.amount > 0)
              .reduce((sum, t) => sum + t.amount, 0) || 0,
          totalExpenses:
            transactions
              ?.filter(t => t.amount < 0)
              .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0,
        },
        transactions:
          transactions?.map(transaction => ({
            id: transaction.id,
            date: transaction.date,
            amount: transaction.amount,
            description: transaction.description,
            category: {
              id: transaction.category_id,
              name: transaction.category_name,
            },
            merchant: transaction.merchant_name,
            isRecurring: transaction.is_recurring,
            userVerified: transaction.user_verified,
            statementImportId: transaction.statement_import_id,
            tags: transaction.tags || [],
          })) || [],
      };
    } catch (error) {
      console.error('Error generating transactions JSON:', error);
      return {
        error: 'Failed to retrieve transaction data',
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async generateCategoriesJSON(): Promise<any> {
    try {
      // Get transaction summary data by category from Supabase
      const { data: categoryStats, error } = await supabase
        .from('transactions')
        .select('category_id, category_name, amount')
        .not('category_id', 'is', null);

      if (error) {
        throw error;
      }

      // Aggregate data by category
      const categoryMap = new Map<
        string,
        {
          name: string;
          total: number;
          count: number;
          color: string;
          icon?: string;
        }
      >();

      categoryStats?.forEach(transaction => {
        const categoryId = transaction.category_id;
        const categoryInfo = getCategoryById(parseInt(categoryId)) || {
          name: transaction.category_name || 'Unknown',
          color: '#9E9E9E',
          icon: 'help-circle-outline',
        };

        if (categoryMap.has(categoryId)) {
          const existing = categoryMap.get(categoryId)!;
          existing.total += transaction.amount;
          existing.count += 1;
        } else {
          categoryMap.set(categoryId, {
            name: categoryInfo.name,
            total: transaction.amount,
            count: 1,
            color: categoryInfo.color,
            icon: categoryInfo.icon,
          });
        }
      });

      const categoriesArray = Array.from(categoryMap.entries()).map(
        ([id, category]) => ({
          id: parseInt(id),
          name: category.name,
          color: category.color,
          icon: category.icon,
          statistics: {
            totalSpent: category.total,
            transactionCount: category.count,
            averageTransaction:
              category.count > 0 ? category.total / category.count : 0,
          },
        })
      );

      return {
        summary: {
          totalCategories: categoriesArray.length,
          totalTransactions: categoryStats?.length || 0,
          totalAmount: categoriesArray.reduce(
            (sum, cat) => sum + cat.statistics.totalSpent,
            0
          ),
        },
        categories: categoriesArray,
      };
    } catch (error) {
      console.error('Error generating categories JSON:', error);
      return {
        error: 'Failed to retrieve category data',
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async generateSettingsJSON(): Promise<any> {
    try {
      // Get real app settings from AsyncStorage
      const appSettings = await getObject<AppSettings>(
        STORAGE_KEYS.APP_SETTINGS
      );
      const notificationPrefs = await getObject(
        STORAGE_KEYS.NOTIFICATION_PREFERENCES
      );
      const utilizationSettings = await getObject(
        STORAGE_KEYS.UTILIZATION_SETTINGS
      );

      return {
        application: {
          language: appSettings?.preferred_language || 'en',
          theme: appSettings?.theme || 'system',
          biometricAuthentication: appSettings?.is_biometric_enabled || false,
          onboardingCompleted: appSettings?.onboarding_completed || false,
        },
        notifications: {
          enabled: notificationPrefs?.enabled || true,
          quietHours: {
            enabled: !!notificationPrefs?.quiet_hours,
            startHour: notificationPrefs?.quiet_hours?.start_hour || null,
            endHour: notificationPrefs?.quiet_hours?.end_hour || null,
          },
          paymentReminders:
            notificationPrefs?.days_before_statement_alert || null,
          utilizationAlerts:
            notificationPrefs?.min_utilization_for_alert || null,
        },
        creditCardSettings: {
          utilizationAlertThreshold:
            utilizationSettings?.alert_individual_card_threshold || 70,
          targetOverallUtilization:
            utilizationSettings?.target_overall_utilization || 30,
          optimizationStrategy:
            utilizationSettings?.optimization_strategy || 'minimize_interest',
          notificationDaysBeforeStatement:
            utilizationSettings?.notification_days_before_statement || 3,
        },
      };
    } catch (error) {
      console.error('Error generating settings JSON:', error);
      return {
        error: 'Failed to retrieve settings data',
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async generateQAHistoryJSON(): Promise<any> {
    try {
      // Get AI usage stats from AsyncStorage
      const aiUsage = await getObject<AIUsageStats>(STORAGE_KEYS.AI_USAGE);

      return {
        summary: {
          currentMonthQueries: aiUsage?.current_month_queries || 0,
          queryLimitPerMonth: aiUsage?.query_limit_per_month || 50,
          lastQueryTimestamp: aiUsage?.last_query_timestamp || null,
        },
        note: 'Detailed Q&A history would require additional storage implementation in the app architecture',
      };
    } catch (error) {
      console.error('Error generating Q&A history JSON:', error);
      return {
        error: 'Failed to retrieve Q&A data',
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async createJsonFile(
    exportId: string,
    jsonData: any
  ): Promise<string> {
    try {
      // Create filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `clarifi_export_${timestamp}_${exportId}.json`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;

      // Write JSON data to file with pretty formatting
      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(jsonData, null, 2),
        {
          encoding: FileSystem.EncodingType.UTF8,
        }
      );

      console.log(`JSON export saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error creating JSON file:', error);
      throw error;
    }
  }

  private async buildCSVData(options: ExportOptions): Promise<string> {
    const csvSections: string[] = [];

    if (options.includePersonalInfo) {
      csvSections.push(await this.generatePersonalInfoCSV());
    }

    if (options.includeTransactions) {
      csvSections.push(await this.generateTransactionsCSV(options.dateRange));
    }

    if (options.includeCategories) {
      csvSections.push(await this.generateCategoriesCSV());
    }

    if (options.includeSettings) {
      csvSections.push(await this.generateSettingsCSV());
    }

    if (options.includeQAHistory) {
      csvSections.push(await this.generateQAHistoryCSV());
    }

    return csvSections.join('\n\n');
  }

  private async generatePersonalInfoCSV(): Promise<string> {
    try {
      // Get user data from Supabase session and local storage
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const appSettings = await getObject<AppSettings>(
        STORAGE_KEYS.APP_SETTINGS
      );

      const personalInfo = {
        'Export Date': new Date().toISOString(),
        'User ID': session?.user?.id || 'N/A',
        Email: session?.user?.email || 'N/A',
        'Account Created': session?.user?.created_at || 'N/A',
        'Language Preference': appSettings?.preferred_language || 'en',
        'Theme Preference': appSettings?.theme || 'system',
        'Biometric Enabled':
          appSettings?.is_biometric_enabled?.toString() || 'false',
        'Last Login': session?.user?.last_sign_in_at || 'N/A',
        'Onboarding Completed':
          appSettings?.onboarding_completed?.toString() || 'false',
      };

      let csv = 'PERSONAL INFORMATION\n';
      csv += 'Field,Value\n';

      for (const [field, value] of Object.entries(personalInfo)) {
        csv += `"${field}","${this.escapeCsvValue(String(value))}"\n`;
      }

      return csv;
    } catch (error) {
      console.error('Error generating personal info CSV:', error);
      return 'PERSONAL INFORMATION\nField,Value\n"Error","Failed to retrieve personal information"\n';
    }
  }

  private async generateTransactionsCSV(dateRange: string): Promise<string> {
    try {
      // Get real transactions from Supabase
      const { startDate, endDate } = this.parseDateRange(dateRange);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      let csv = 'TRANSACTIONS\n';
      csv +=
        'Date,Amount,Description,Category,Merchant,Verified,Recurring,Tags\n';

      for (const transaction of transactions || []) {
        csv += `"${transaction.date}","${transaction.amount}","${this.escapeCsvValue(transaction.description)}","${this.escapeCsvValue(transaction.category_name || '')}","${this.escapeCsvValue(transaction.merchant_name || '')}","${transaction.user_verified}","${transaction.is_recurring}","${this.escapeCsvValue((transaction.tags || []).join(';'))}"\n`;
      }

      return csv;
    } catch (error) {
      console.error('Error generating transactions CSV:', error);
      return 'TRANSACTIONS\nError,Failed to retrieve transaction data\n';
    }
  }

  private async generateCategoriesCSV(): Promise<string> {
    try {
      // Get transaction summary data by category from Supabase
      const { data: categoryStats, error } = await supabase
        .from('transactions')
        .select('category_id, category_name, amount')
        .not('category_id', 'is', null);

      if (error) {
        throw error;
      }

      // Aggregate data by category
      const categoryMap = new Map<
        string,
        { name: string; total: number; count: number; color: string }
      >();

      categoryStats?.forEach(transaction => {
        const categoryId = transaction.category_id;
        const categoryInfo = getCategoryById(parseInt(categoryId)) || {
          name: transaction.category_name || 'Unknown',
          color: '#9E9E9E',
        };

        if (categoryMap.has(categoryId)) {
          const existing = categoryMap.get(categoryId)!;
          existing.total += transaction.amount;
          existing.count += 1;
        } else {
          categoryMap.set(categoryId, {
            name: categoryInfo.name,
            total: transaction.amount,
            count: 1,
            color: categoryInfo.color,
          });
        }
      });

      let csv = 'CATEGORIES\n';
      csv += 'ID,Name,Color,Total Spent,Transaction Count\n';

      for (const [id, category] of categoryMap.entries()) {
        csv += `"${id}","${this.escapeCsvValue(category.name)}","${category.color}","${category.total.toFixed(2)}","${category.count}"\n`;
      }

      return csv;
    } catch (error) {
      console.error('Error generating categories CSV:', error);
      return 'CATEGORIES\nError,Failed to retrieve category data\n';
    }
  }

  private async generateSettingsCSV(): Promise<string> {
    try {
      // Get real app settings from AsyncStorage
      const appSettings = await getObject<AppSettings>(
        STORAGE_KEYS.APP_SETTINGS
      );
      const notificationPrefs = await getObject(
        STORAGE_KEYS.NOTIFICATION_PREFERENCES
      );
      const utilizationSettings = await getObject(
        STORAGE_KEYS.UTILIZATION_SETTINGS
      );

      const settings = {
        'Language Preference': appSettings?.preferred_language || 'en',
        Theme: appSettings?.theme || 'system',
        'Biometric Authentication':
          appSettings?.is_biometric_enabled?.toString() || 'false',
        'Onboarding Completed':
          appSettings?.onboarding_completed?.toString() || 'false',
        'Notifications Enabled':
          notificationPrefs?.enabled?.toString() || 'true',
        'Quiet Hours Start':
          notificationPrefs?.quiet_hours?.start_hour?.toString() || 'N/A',
        'Quiet Hours End':
          notificationPrefs?.quiet_hours?.end_hour?.toString() || 'N/A',
        'Utilization Alert Threshold':
          utilizationSettings?.alert_individual_card_threshold?.toString() ||
          '70',
        'Target Overall Utilization':
          utilizationSettings?.target_overall_utilization?.toString() || '30',
      };

      let csv = 'APP SETTINGS\n';
      csv += 'Setting,Value\n';

      for (const [setting, value] of Object.entries(settings)) {
        csv += `"${setting}","${value}"\n`;
      }

      return csv;
    } catch (error) {
      console.error('Error generating settings CSV:', error);
      return 'APP SETTINGS\nError,Failed to retrieve settings data\n';
    }
  }

  private async generateQAHistoryCSV(): Promise<string> {
    try {
      // Get AI usage stats from AsyncStorage
      const aiUsage = await getObject<AIUsageStats>(STORAGE_KEYS.AI_USAGE);

      // Note: This is a simplified implementation as detailed Q&A history
      // would need to be stored separately in the app design
      const qaHistory = [
        {
          date: new Date().toISOString(),
          summary: `Total queries this month: ${aiUsage?.current_month_queries || 0}`,
          category: 'usage_summary',
          queries_count: aiUsage?.current_month_queries || 0,
        },
      ];

      let csv = 'Q&A HISTORY\n';
      csv += 'Date,Summary,Category,Queries Count\n';

      for (const qa of qaHistory) {
        csv += `"${qa.date}","${this.escapeCsvValue(qa.summary)}","${qa.category}","${qa.queries_count}"\n`;
      }

      return csv;
    } catch (error) {
      console.error('Error generating Q&A history CSV:', error);
      return 'Q&A HISTORY\nError,Failed to retrieve Q&A data\n';
    }
  }

  private parseDateRange(dateRange: string): {
    startDate: string;
    endDate: string;
  } {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    let startDate: string;

    switch (dateRange) {
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          .toISOString()
          .split('T')[0];
        break;
      case 'last-3-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
          .toISOString()
          .split('T')[0];
        break;
      case 'last-6-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
          .toISOString()
          .split('T')[0];
        break;
      case 'last-year':
        startDate = new Date(now.getFullYear() - 1, 0, 1)
          .toISOString()
          .split('T')[0];
        break;
      case 'all':
      default:
        startDate = '2020-01-01'; // Reasonable start date for all data
        break;
    }

    return { startDate, endDate };
  }

  private async createCsvFile(
    exportId: string,
    csvData: string
  ): Promise<string> {
    try {
      // Create filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `clarifi_export_${timestamp}_${exportId}.csv`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;

      // Write CSV data to file
      await FileSystem.writeAsStringAsync(filePath, csvData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      console.log(`CSV export saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error creating CSV file:', error);
      throw error;
    }
  }

  private calculateMonthsInRange(dateRange: string): number {
    // Parse date range and calculate months
    // For now, return a default value
    if (dateRange === 'all') return 12;
    if (dateRange === 'last-year') return 12;
    if (dateRange === 'last-6-months') return 6;
    if (dateRange === 'last-3-months') return 3;
    if (dateRange === 'last-month') return 1;
    return 6; // Default
  }

  private formatDateRange(dateRange: string): string {
    switch (dateRange) {
      case 'all':
        return 'All available data';
      case 'last-year':
        return 'Last 12 months';
      case 'last-6-months':
        return 'Last 6 months';
      case 'last-3-months':
        return 'Last 3 months';
      case 'last-month':
        return 'Last month';
      default:
        return 'Selected period';
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private escapeCsvValue(value: string): string {
    if (typeof value !== 'string') {
      value = String(value);
    }
    // Escape quotes by doubling them and wrap in quotes if contains comma, quote, or newline
    if (value.includes('"') || value.includes(',') || value.includes('\n')) {
      return value.replace(/"/g, '""');
    }
    return value;
  }

  async downloadExport(exportId: string): Promise<string | null> {
    try {
      // Find the file by exportId (could be CSV, JSON, or HTML for PDF)
      const files = await FileSystem.readDirectoryAsync(
        FileSystem.documentDirectory || ''
      );
      const exportFile = files.find(
        file =>
          file.includes(exportId) &&
          (file.endsWith('.csv') ||
            file.endsWith('.json') ||
            file.endsWith('.html'))
      );

      if (!exportFile) {
        console.error('Export file not found for ID:', exportId);
        return null;
      }

      const filePath = `${FileSystem.documentDirectory}${exportFile}`;
      const fileExtension = exportFile.split('.').pop();

      let mimeType = 'text/plain';
      if (fileExtension === 'json') {
        mimeType = 'application/json';
      } else if (fileExtension === 'csv') {
        mimeType = 'text/csv';
      } else if (fileExtension === 'html') {
        mimeType = 'text/html';
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType,
          dialogTitle: 'Share ClariFi Data Export',
        });
        return filePath;
      } else {
        console.log('Sharing not available on this device');
        return filePath; // Return path for other handling
      }
    } catch (error) {
      console.error('Error downloading/sharing export:', error);
      return null;
    }
  }

  /**
   * Secure download using download token (new method)
   */
  async secureDownload(downloadToken: string): Promise<string | null> {
    let userId = 'anonymous';

    try {
      // Get user ID for audit logging
      const {
        data: { session },
      } = await supabase.auth.getSession();
      userId = session?.user?.id || 'anonymous';

      if (!userId || userId === 'anonymous') {
        await PrivacyAuditService.logEvent(
          userId,
          PrivacyAction.EXPORT_DOWNLOADED,
          `download_${downloadToken}`,
          { error: 'User not authenticated' },
          false,
          'Authentication required for secure download'
        );
        throw new Error('Authentication required for secure download');
      }

      // Log download attempt
      await PrivacyAuditService.logEvent(
        userId,
        PrivacyAction.EXPORT_DOWNLOADED,
        `download_${downloadToken}`,
        { downloadToken }
      );

      // Decrypt file using secure service
      const { filePath, integrity } =
        await SecureFileService.decryptFileForDownload(downloadToken, userId);

      if (!integrity.isValid) {
        await PrivacyAuditService.logEvent(
          userId,
          PrivacyAction.EXPORT_DOWNLOADED,
          `download_${downloadToken}`,
          { error: 'File integrity check failed' },
          false,
          'File integrity verification failed'
        );
        throw new Error('File integrity verification failed');
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      // Determine file type and share
      const mimeType = this.getMimeTypeFromToken(downloadToken);

      await Sharing.shareAsync(filePath, {
        mimeType,
        dialogTitle: 'Your Secure Data Export',
        UTI: this.getUTIFromMimeType(mimeType),
      });

      // Log successful download
      await PrivacyAuditService.logFileOperation(
        userId,
        'download',
        downloadToken,
        { success: true }
      );

      // Revoke download token after successful use
      await SecureFileService.revokeDownloadToken(downloadToken);

      // Log token revocation
      await PrivacyAuditService.logEvent(
        userId,
        PrivacyAction.TOKEN_REVOKED,
        `token_${downloadToken}`,
        { reason: 'Single-use download completed' }
      );

      return filePath;
    } catch (error) {
      console.error('Secure download failed:', error);

      // Log failed download
      await PrivacyAuditService.logFileOperation(
        userId,
        'download',
        downloadToken,
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );

      return null;
    }
  }

  /**
   * Verify download token integrity
   */
  async verifyDownloadToken(downloadToken: string): Promise<boolean> {
    try {
      return await SecureFileService.verifyFileIntegrity(downloadToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  /**
   * Initialize automatic cleanup
   */
  async initializeSecureCleanup(): Promise<void> {
    try {
      // Schedule automatic cleanup every 6 hours
      setInterval(
        async () => {
          await SecureFileService.cleanupExpiredFiles();
          await this.cleanupOldExports(24); // Legacy cleanup for non-encrypted files
        },
        6 * 60 * 60 * 1000
      );

      // Run initial cleanup
      await SecureFileService.cleanupExpiredFiles();
    } catch (error) {
      console.error('Failed to initialize secure cleanup:', error);
    }
  }

  /**
   * Get MIME type from download token (helper method)
   */
  private getMimeTypeFromToken(downloadToken: string): string {
    // In a real implementation, this could be stored with the token
    // For now, default to application/octet-stream for encrypted files
    if (downloadToken.includes('CSV')) return 'text/csv';
    if (downloadToken.includes('JSON')) return 'application/json';
    if (downloadToken.includes('PDF')) return 'text/html';
    return 'application/octet-stream';
  }

  /**
   * Get UTI from MIME type (helper method)
   */
  private getUTIFromMimeType(mimeType: string): string {
    const utiMap: Record<string, string> = {
      'text/csv': 'public.comma-separated-values-text',
      'application/json': 'public.json',
      'text/html': 'public.html',
      'application/octet-stream': 'public.data',
    };
    return utiMap[mimeType] || 'public.data';
  }

  async getExportFileInfo(
    exportId: string
  ): Promise<{ filePath: string; fileSize: string } | null> {
    try {
      const files = await FileSystem.readDirectoryAsync(
        FileSystem.documentDirectory || ''
      );
      const exportFile = files.find(
        file =>
          file.includes(exportId) &&
          (file.endsWith('.csv') ||
            file.endsWith('.json') ||
            file.endsWith('.html'))
      );

      if (!exportFile) {
        return null;
      }

      const filePath = `${FileSystem.documentDirectory}${exportFile}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (fileInfo.exists) {
        return {
          filePath,
          fileSize: this.formatFileSize(fileInfo.size || 0),
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting export file info:', error);
      return null;
    }
  }

  async cleanupOldExports(maxAgeHours: number = 24): Promise<void> {
    try {
      const files = await FileSystem.readDirectoryAsync(
        FileSystem.documentDirectory || ''
      );
      const exportFiles = files.filter(
        file =>
          file.startsWith('clarifi_export_') &&
          (file.endsWith('.csv') ||
            file.endsWith('.json') ||
            file.endsWith('.html'))
      );

      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert hours to milliseconds

      for (const file of exportFiles) {
        const filePath = `${FileSystem.documentDirectory}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (fileInfo.exists && fileInfo.modificationTime) {
          const fileAge = now - fileInfo.modificationTime * 1000; // modificationTime is in seconds

          if (fileAge > maxAge) {
            await FileSystem.deleteAsync(filePath);
            console.log(`Cleaned up old export file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old exports:', error);
    }
  }

  /**
   * Secure download using download token (new method)
   */
  async secureDownload(downloadToken: string): Promise<string | null> {
    let userId = 'anonymous';

    try {
      // Get user ID for audit logging
      const {
        data: { session },
      } = await supabase.auth.getSession();
      userId = session?.user?.id || 'anonymous';

      if (!userId || userId === 'anonymous') {
        await PrivacyAuditService.logEvent(
          userId,
          PrivacyAction.EXPORT_DOWNLOADED,
          `download_${downloadToken}`,
          { error: 'User not authenticated' },
          false,
          'Authentication required for secure download'
        );
        throw new Error('Authentication required for secure download');
      }

      // Log download attempt
      await PrivacyAuditService.logEvent(
        userId,
        PrivacyAction.EXPORT_DOWNLOADED,
        `download_${downloadToken}`,
        { downloadToken }
      );

      // Decrypt file using secure service
      const { filePath, integrity } =
        await SecureFileService.decryptFileForDownload(downloadToken, userId);

      if (!integrity.isValid) {
        await PrivacyAuditService.logEvent(
          userId,
          PrivacyAction.EXPORT_DOWNLOADED,
          `download_${downloadToken}`,
          { error: 'File integrity check failed' },
          false,
          'File integrity verification failed'
        );
        throw new Error('File integrity verification failed');
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      // Determine file type and share
      const mimeType = this.getMimeTypeFromToken(downloadToken);

      await Sharing.shareAsync(filePath, {
        mimeType,
        dialogTitle: 'Your Secure Data Export',
        UTI: this.getUTIFromMimeType(mimeType),
      });

      // Log successful download
      await PrivacyAuditService.logFileOperation(
        userId,
        'download',
        downloadToken,
        { success: true }
      );

      // Revoke download token after successful use
      await SecureFileService.revokeDownloadToken(downloadToken);

      // Log token revocation
      await PrivacyAuditService.logEvent(
        userId,
        PrivacyAction.TOKEN_REVOKED,
        `token_${downloadToken}`,
        { reason: 'Single-use download completed' }
      );

      return filePath;
    } catch (error) {
      console.error('Secure download failed:', error);

      // Log failed download
      await PrivacyAuditService.logFileOperation(
        userId,
        'download',
        downloadToken,
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );

      return null;
    }
  }

  /**
   * Verify download token integrity
   */
  async verifyDownloadToken(downloadToken: string): Promise<boolean> {
    try {
      return await SecureFileService.verifyFileIntegrity(downloadToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  /**
   * Initialize automatic cleanup
   */
  async initializeSecureCleanup(): Promise<void> {
    try {
      // Schedule automatic cleanup every 6 hours
      setInterval(
        async () => {
          await SecureFileService.cleanupExpiredFiles();
          await this.cleanupOldExports(24); // Legacy cleanup for non-encrypted files
        },
        6 * 60 * 60 * 1000
      );

      // Run initial cleanup
      await SecureFileService.cleanupExpiredFiles();
    } catch (error) {
      console.error('Failed to initialize secure cleanup:', error);
    }
  }

  /**
   * Get MIME type from download token (helper method)
   */
  private getMimeTypeFromToken(downloadToken: string): string {
    // In a real implementation, this could be stored with the token
    // For now, default to application/octet-stream for encrypted files
    if (downloadToken.includes('CSV')) return 'text/csv';
    if (downloadToken.includes('JSON')) return 'application/json';
    if (downloadToken.includes('PDF')) return 'text/html';
    return 'application/octet-stream';
  }

  /**
   * Get UTI from MIME type (helper method)
   */
  private getUTIFromMimeType(mimeType: string): string {
    const utiMap: Record<string, string> = {
      'text/csv': 'public.comma-separated-values-text',
      'application/json': 'public.json',
      'text/html': 'public.html',
      'application/octet-stream': 'public.data',
    };
    return utiMap[mimeType] || 'public.data';
  }
}
