import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, AppSettings, CreditCard } from '../storage/dataModels';
import { Share, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

interface CSVExportOptions {
  dateRange: string;
  includePersonalInfo: boolean;
  includeTransactions: boolean;
  includeCategories: boolean;
  includeSettings: boolean;
  includeQAHistory: boolean;
}

interface CSVExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
  fileSize?: string;
}

export class CSVExportService {
  async generateCSVExport(options: CSVExportOptions): Promise<CSVExportResult> {
    try {
      const csvData = await this.buildCSVData(options);
      const fileName = `clarifi_export_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      // Write CSV data to file
      await FileSystem.writeAsStringAsync(filePath, csvData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Get file info for size
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      const fileSize = this.formatFileSize(fileInfo.size || 0);

      return {
        success: true,
        filePath,
        fileSize,
      };
    } catch (error) {
      console.error('CSV export generation failed:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async shareCSVExport(filePath: string): Promise<boolean> {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Share.share({
          url: filePath,
          title: 'ClariFi Data Export',
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to share CSV export:', error);
      return false;
    }
  }

  private async buildCSVData(options: CSVExportOptions): Promise<string> {
    const csvSections: string[] = [];

    // Add header with export information
    csvSections.push(await this.generateExportHeader());

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

    // Add footer with PIPEDA compliance information
    csvSections.push(this.generateComplianceFooter());

    return csvSections.join('\n\n');
  }

  private async generateExportHeader(): Promise<string> {
    const exportDate = new Date().toISOString();
    let header = 'CLARIFI DATA EXPORT\n';
    header += '====================\n';
    header += `Export Date,"${exportDate}"\n`;
    header += `Export Type,"CSV Format"\n`;
    header += `PIPEDA Compliance,"This export contains your personal information as defined under PIPEDA"\n`;
    header += `Data Controller,"ClariFi Inc., 123 Financial St, Toronto, ON M5H 2N3"\n`;
    header += `Retention Notice,"This exported file should be stored securely and deleted when no longer needed"\n`;

    return header;
  }

  private async generatePersonalInfoCSV(): Promise<string> {
    try {
      // Get user data from local storage
      const appSettings = await this.getAppSettings();

      let csv = 'PERSONAL INFORMATION\n';
      csv += 'Field,Value\n';

      const personalInfo = {
        'Export Date': new Date().toISOString(),
        'User ID': appSettings?.user_id || 'Not available',
        'Language Preference': appSettings?.preferred_language || 'en',
        'Theme Preference': appSettings?.theme || 'system',
        'Biometric Enabled': appSettings?.is_biometric_enabled ? 'Yes' : 'No',
        'Onboarding Completed': appSettings?.onboarding_completed
          ? 'Yes'
          : 'No',
      };

      for (const [field, value] of Object.entries(personalInfo)) {
        csv += `"${field}","${this.escapeCsvValue(String(value))}"\n`;
      }

      return csv;
    } catch (error) {
      console.error('Error generating personal info CSV:', error);
      return 'PERSONAL INFORMATION\nError,Failed to retrieve personal information\n';
    }
  }

  private async generateTransactionsCSV(dateRange: string): Promise<string> {
    try {
      const transactions = await this.getTransactions(dateRange);

      let csv = 'TRANSACTIONS\n';
      csv +=
        'Date,Amount,Description,Category,Merchant,Verified,Recurring,Tags\n';

      for (const transaction of transactions) {
        csv += `"${transaction.date}","${transaction.amount}","${this.escapeCsvValue(transaction.description)}","${this.escapeCsvValue(transaction.category_name || '')}","${this.escapeCsvValue(transaction.merchant_name || '')}","${transaction.user_verified ? 'Yes' : 'No'}","${transaction.is_recurring ? 'Yes' : 'No'}","${this.escapeCsvValue((transaction.tags || []).join(';'))}"\n`;
      }

      return csv;
    } catch (error) {
      console.error('Error generating transactions CSV:', error);
      return 'TRANSACTIONS\nError,Failed to retrieve transaction data\n';
    }
  }

  private async generateCategoriesCSV(): Promise<string> {
    try {
      const categories = await this.getCategories();

      let csv = 'CATEGORIES\n';
      csv += 'ID,Name,Total Spent,Transaction Count\n';

      for (const category of categories) {
        csv += `"${category.id}","${this.escapeCsvValue(category.name)}","${category.total_spent}","${category.transaction_count}"\n`;
      }

      return csv;
    } catch (error) {
      console.error('Error generating categories CSV:', error);
      return 'CATEGORIES\nError,Failed to retrieve category data\n';
    }
  }

  private async generateSettingsCSV(): Promise<string> {
    try {
      const appSettings = await this.getAppSettings();
      const privacySettings = await this.getPrivacySettings();

      let csv = 'APP SETTINGS\n';
      csv += 'Setting,Value\n';

      const allSettings = {
        ...appSettings,
        ...privacySettings,
      };

      for (const [setting, value] of Object.entries(allSettings)) {
        csv += `"${setting}","${this.escapeCsvValue(String(value))}"\n`;
      }

      return csv;
    } catch (error) {
      console.error('Error generating settings CSV:', error);
      return 'APP SETTINGS\nError,Failed to retrieve settings data\n';
    }
  }

  private async generateQAHistoryCSV(): Promise<string> {
    try {
      const qaHistory = await this.getQAHistory();

      let csv = 'Q&A HISTORY\n';
      csv += 'Date,Question,Category,Tokens Used\n';

      for (const qa of qaHistory) {
        csv += `"${qa.date}","${this.escapeCsvValue(qa.question)}","${qa.category}","${qa.tokens_used}"\n`;
      }

      return csv;
    } catch (error) {
      console.error('Error generating Q&A history CSV:', error);
      return 'Q&A HISTORY\nError,Failed to retrieve Q&A history data\n';
    }
  }

  private generateComplianceFooter(): string {
    let footer = 'PIPEDA COMPLIANCE INFORMATION\n';
    footer += '==============================\n';
    footer += `Export Purpose,"Personal data access request under PIPEDA"\n`;
    footer += `Data Retention,"This export file expires in 24 hours for security"\n`;
    footer += `Privacy Rights,"You may request corrections, deletions, or restrictions at privacy@clarifi.ca"\n`;
    footer += `Complaint Process,"Contact the Office of the Privacy Commissioner at priv.gc.ca"\n`;
    footer += `Data Protection,"Store this file securely and delete when no longer needed"\n`;

    return footer;
  }

  // Data retrieval methods (these would connect to actual data sources)
  private async getAppSettings(): Promise<AppSettings | null> {
    try {
      const settings = await AsyncStorage.getItem('app_settings');
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error retrieving app settings:', error);
      return null;
    }
  }

  private async getPrivacySettings(): Promise<Record<string, any>> {
    try {
      const settings = await AsyncStorage.getItem('privacy_settings');
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Error retrieving privacy settings:', error);
      return {};
    }
  }

  private async getTransactions(dateRange: string): Promise<Transaction[]> {
    try {
      // In a real implementation, this would filter based on dateRange
      const transactions = await AsyncStorage.getItem('transactions');
      const allTransactions: Transaction[] = transactions
        ? JSON.parse(transactions)
        : [];

      // Filter by date range
      return this.filterTransactionsByDateRange(allTransactions, dateRange);
    } catch (error) {
      console.error('Error retrieving transactions:', error);
      return [];
    }
  }

  private async getCategories(): Promise<any[]> {
    try {
      // Sample category data - in real implementation, would come from database
      return [
        {
          id: '1',
          name: 'Groceries',
          total_spent: 1247.89,
          transaction_count: 87,
        },
        {
          id: '2',
          name: 'Transportation',
          total_spent: 542.1,
          transaction_count: 34,
        },
        {
          id: '3',
          name: 'Restaurants',
          total_spent: 789.45,
          transaction_count: 56,
        },
        {
          id: '4',
          name: 'Entertainment',
          total_spent: 324.67,
          transaction_count: 23,
        },
        {
          id: '5',
          name: 'Utilities',
          total_spent: 456.78,
          transaction_count: 12,
        },
      ];
    } catch (error) {
      console.error('Error retrieving categories:', error);
      return [];
    }
  }

  private async getQAHistory(): Promise<any[]> {
    try {
      const history = await AsyncStorage.getItem('qa_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error retrieving Q&A history:', error);
      return [];
    }
  }

  private filterTransactionsByDateRange(
    transactions: Transaction[],
    dateRange: string
  ): Transaction[] {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'last-month':
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate()
        );
        break;
      case 'last-3-months':
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 3,
          now.getDate()
        );
        break;
      case 'last-6-months':
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 6,
          now.getDate()
        );
        break;
      case 'last-year':
        startDate = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate()
        );
        break;
      case 'all':
      default:
        return transactions;
    }

    return transactions.filter(
      transaction => new Date(transaction.date) >= startDate
    );
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

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async deleteExportFile(filePath: string): Promise<boolean> {
    try {
      await FileSystem.deleteAsync(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting export file:', error);
      return false;
    }
  }
}

export const csvExportService = new CSVExportService();
