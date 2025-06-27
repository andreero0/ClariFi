export interface AppTemplate {
  id: string;
  name: string;
  industry: string;
  theme: AppTheme;
  features: AppFeatures;
  branding: AppBranding;
  categories: CategoryDefinition[];
  documentTypes: DocumentType[];
  aiPrompts: AIPromptTemplates;
  navigation: NavigationConfig;
}

export interface AppTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textPrimary: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
}

export interface AppFeatures {
  documentProcessing: boolean;
  aiCategorization: boolean;
  budgetTracking: boolean;
  creditCardTracking: boolean;
  reportGeneration: boolean;
  socialAuth: boolean;
  notifications: boolean;
  analytics: boolean;
  subscription: boolean;
  multiCurrency: boolean;
}

export interface AppBranding {
  appName: string;
  tagline: string;
  logoIcon: string;
  description: string;
  supportEmail: string;
  websiteUrl: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
  isDefault: boolean;
  industry?: string;
}

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  acceptedFormats: string[];
  processingMethod: 'ocr' | 'csv' | 'api';
  maxSize: number;
  requiredFields: string[];
}

export interface AIPromptTemplates {
  categorization: string;
  summaryGeneration: string;
  insightGeneration: string;
  customPrompts: Record<string, string>;
}

export interface NavigationConfig {
  tabOrder: string[];
  hiddenTabs?: string[];
  customScreens?: CustomScreen[];
}

export interface CustomScreen {
  id: string;
  name: string;
  component: string;
  icon: string;
  placement: 'tab' | 'modal' | 'stack';
}

// Template definitions for different business types
export const APP_TEMPLATES: Record<string, AppTemplate> = {
  finance: {
    id: 'finance',
    name: 'ClariFi',
    industry: 'Personal Finance',
    theme: {
      primaryColor: '#2B5CE6',
      secondaryColor: '#1E3A8A',
      backgroundColor: '#F8F9FA',
      textPrimary: '#1F2937',
      textSecondary: '#6B7280',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      fonts: {
        heading: 'System',
        body: 'System',
        mono: 'Courier',
      },
    },
    features: {
      documentProcessing: true,
      aiCategorization: true,
      budgetTracking: true,
      creditCardTracking: true,
      reportGeneration: true,
      socialAuth: true,
      notifications: true,
      analytics: true,
      subscription: true,
      multiCurrency: false,
    },
    branding: {
      appName: 'ClariFi',
      tagline: 'Financial Clarity. Simplified.',
      logoIcon: 'trending-up',
      description: 'Your personal finance assistant for newcomers to Canada',
      supportEmail: 'support@clarifi.app',
      websiteUrl: 'https://clarifi.app',
      privacyPolicyUrl: 'https://clarifi.app/privacy',
      termsOfServiceUrl: 'https://clarifi.app/terms',
    },
    categories: [
      {
        id: 'groceries',
        name: 'Groceries',
        icon: 'basket',
        color: '#10B981',
        keywords: ['grocery', 'food', 'supermarket', 'metro', 'loblaws'],
        isDefault: true,
      },
      {
        id: 'dining',
        name: 'Dining & Restaurants',
        icon: 'restaurant',
        color: '#F59E0B',
        keywords: ['restaurant', 'coffee', 'tim hortons', 'mcdonalds'],
        isDefault: true,
      },
      {
        id: 'transportation',
        name: 'Transportation',
        icon: 'car',
        color: '#3B82F6',
        keywords: ['gas', 'transit', 'uber', 'ttc', 'parking'],
        isDefault: true,
      },
    ],
    documentTypes: [
      {
        id: 'bank_statement',
        name: 'Bank Statement',
        description: 'Monthly bank statements in PDF format',
        acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
        processingMethod: 'ocr',
        maxSize: 10485760, // 10MB
        requiredFields: ['date', 'description', 'amount'],
      },
    ],
    aiPrompts: {
      categorization: `Analyze this financial transaction and categorize it appropriately for Canadian banking. Consider the merchant, amount, and description.`,
      summaryGeneration: `Generate a monthly financial summary focusing on spending patterns and budget adherence.`,
      insightGeneration: `Provide financial insights for newcomers to Canada, focusing on budgeting and credit building.`,
      customPrompts: {},
    },
    navigation: {
      tabOrder: ['dashboard', 'transactions', 'cards', 'insights', 'profile'],
    },
  },

  food_delivery: {
    id: 'food_delivery',
    name: 'FoodTracker',
    industry: 'Food & Delivery',
    theme: {
      primaryColor: '#FF6B35',
      secondaryColor: '#D63031',
      backgroundColor: '#FFF5F5',
      textPrimary: '#2D3748',
      textSecondary: '#718096',
      success: '#48BB78',
      warning: '#ED8936',
      error: '#E53E3E',
      fonts: {
        heading: 'System',
        body: 'System',
        mono: 'Courier',
      },
    },
    features: {
      documentProcessing: true,
      aiCategorization: true,
      budgetTracking: true,
      creditCardTracking: false,
      reportGeneration: true,
      socialAuth: true,
      notifications: true,
      analytics: true,
      subscription: false,
      multiCurrency: false,
    },
    branding: {
      appName: 'FoodTracker',
      tagline: 'Track Every Bite, Every Dollar.',
      logoIcon: 'restaurant',
      description: 'Your smart food expense tracker',
      supportEmail: 'support@foodtracker.app',
      websiteUrl: 'https://foodtracker.app',
      privacyPolicyUrl: 'https://foodtracker.app/privacy',
      termsOfServiceUrl: 'https://foodtracker.app/terms',
    },
    categories: [
      {
        id: 'restaurants',
        name: 'Restaurants',
        icon: 'restaurant',
        color: '#FF6B35',
        keywords: ['restaurant', 'dine-in', 'table service'],
        isDefault: true,
        industry: 'food',
      },
      {
        id: 'delivery',
        name: 'Food Delivery',
        icon: 'bicycle',
        color: '#00B894',
        keywords: ['uber eats', 'doordash', 'delivery', 'takeout'],
        isDefault: true,
        industry: 'food',
      },
      {
        id: 'groceries',
        name: 'Grocery Shopping',
        icon: 'basket',
        color: '#6C5CE7',
        keywords: ['grocery', 'supermarket', 'food shopping'],
        isDefault: true,
        industry: 'food',
      },
    ],
    documentTypes: [
      {
        id: 'receipt',
        name: 'Food Receipt',
        description: 'Restaurant and delivery receipts',
        acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
        processingMethod: 'ocr',
        maxSize: 5242880, // 5MB
        requiredFields: ['merchant', 'amount', 'date'],
      },
    ],
    aiPrompts: {
      categorization: `Categorize this food-related expense. Focus on restaurant type, cuisine, and meal category.`,
      summaryGeneration: `Generate a food spending summary with insights on dining habits and cost per meal.`,
      insightGeneration: `Provide insights on food spending patterns, healthy vs. unhealthy choices, and cost optimization.`,
      customPrompts: {
        nutritionAnalysis:
          'Analyze the nutritional value and healthiness of this food purchase.',
      },
    },
    navigation: {
      tabOrder: ['dashboard', 'expenses', 'analytics', 'profile'],
      customScreens: [
        {
          id: 'nutrition',
          name: 'Nutrition Tracker',
          component: 'NutritionScreen',
          icon: 'fitness',
          placement: 'tab',
        },
      ],
    },
  },

  retail_business: {
    id: 'retail_business',
    name: 'RetailTracker',
    industry: 'Retail Business',
    theme: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#7C3AED',
      backgroundColor: '#FAFAFA',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      fonts: {
        heading: 'System',
        body: 'System',
        mono: 'Courier',
      },
    },
    features: {
      documentProcessing: true,
      aiCategorization: true,
      budgetTracking: true,
      creditCardTracking: true,
      reportGeneration: true,
      socialAuth: true,
      notifications: true,
      analytics: true,
      subscription: true,
      multiCurrency: true,
    },
    branding: {
      appName: 'RetailTracker',
      tagline: 'Smart Business Expense Management.',
      logoIcon: 'storefront',
      description: 'Comprehensive expense tracking for retail businesses',
      supportEmail: 'support@retailtracker.biz',
      websiteUrl: 'https://retailtracker.biz',
      privacyPolicyUrl: 'https://retailtracker.biz/privacy',
      termsOfServiceUrl: 'https://retailtracker.biz/terms',
    },
    categories: [
      {
        id: 'inventory',
        name: 'Inventory & Stock',
        icon: 'cube',
        color: '#8B5CF6',
        keywords: ['wholesale', 'supplier', 'inventory', 'stock'],
        isDefault: true,
        industry: 'retail',
      },
      {
        id: 'marketing',
        name: 'Marketing & Advertising',
        icon: 'megaphone',
        color: '#EC4899',
        keywords: ['advertising', 'marketing', 'promotion', 'social media'],
        isDefault: true,
        industry: 'retail',
      },
      {
        id: 'utilities',
        name: 'Store Operations',
        icon: 'settings',
        color: '#14B8A6',
        keywords: ['utilities', 'rent', 'insurance', 'maintenance'],
        isDefault: true,
        industry: 'retail',
      },
    ],
    documentTypes: [
      {
        id: 'invoice',
        name: 'Supplier Invoice',
        description: 'Invoices from suppliers and vendors',
        acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
        processingMethod: 'ocr',
        maxSize: 15728640, // 15MB
        requiredFields: ['vendor', 'amount', 'date', 'items'],
      },
      {
        id: 'receipt',
        name: 'Expense Receipt',
        description: 'Business expense receipts',
        acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
        processingMethod: 'ocr',
        maxSize: 10485760, // 10MB
        requiredFields: ['merchant', 'amount', 'date'],
      },
    ],
    aiPrompts: {
      categorization: `Categorize this business expense for retail operations. Consider if it's COGS, operating expense, or capital expenditure.`,
      summaryGeneration: `Generate a business expense summary with profit margin analysis and category breakdowns.`,
      insightGeneration: `Provide business insights focusing on cost optimization, seasonal trends, and profitability.`,
      customPrompts: {
        taxDeductible:
          'Determine if this expense is tax-deductible for a retail business.',
        profitImpact:
          'Analyze how this expense impacts overall profit margins.',
      },
    },
    navigation: {
      tabOrder: ['dashboard', 'expenses', 'reports', 'analytics', 'settings'],
      customScreens: [
        {
          id: 'tax_reports',
          name: 'Tax Reports',
          component: 'TaxReportsScreen',
          icon: 'document-text',
          placement: 'tab',
        },
      ],
    },
  },
};

// Template manager class
export class AppTemplateManager {
  private currentTemplate: AppTemplate;

  constructor(templateId: string = 'finance') {
    this.currentTemplate = APP_TEMPLATES[templateId] || APP_TEMPLATES.finance;
  }

  getTemplate(): AppTemplate {
    return this.currentTemplate;
  }

  switchTemplate(templateId: string): void {
    if (APP_TEMPLATES[templateId]) {
      this.currentTemplate = APP_TEMPLATES[templateId];
    }
  }

  getTheme(): AppTheme {
    return this.currentTemplate.theme;
  }

  getBranding(): AppBranding {
    return this.currentTemplate.branding;
  }

  getCategories(): CategoryDefinition[] {
    return this.currentTemplate.categories;
  }

  getFeatures(): AppFeatures {
    return this.currentTemplate.features;
  }

  getAIPrompts(): AIPromptTemplates {
    return this.currentTemplate.aiPrompts;
  }

  isFeatureEnabled(feature: keyof AppFeatures): boolean {
    return this.currentTemplate.features[feature];
  }

  getCustomPrompt(key: string): string | undefined {
    return this.currentTemplate.aiPrompts.customPrompts[key];
  }

  getDocumentTypes(): DocumentType[] {
    return this.currentTemplate.documentTypes;
  }

  getNavigationConfig(): NavigationConfig {
    return this.currentTemplate.navigation;
  }
}

// Global template manager instance
export const templateManager = new AppTemplateManager();

// Environment-based template selection
export const getTemplateFromEnv = (): string => {
  // You can set EXPO_PUBLIC_APP_TEMPLATE in your .env file
  return process.env.EXPO_PUBLIC_APP_TEMPLATE || 'finance';
};
