/**
 * Help Content Service
 * Manages help articles, FAQs, and support content for ClariFi
 */

export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  content: string;
  summary: string;
  tags: string[];
  lastUpdated: string;
  views: number;
  helpful: number;
  notHelpful: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number; // in minutes
  relatedArticles: string[];
  searchableContent: string; // processed content for search
  featured?: boolean;
  popular?: boolean;
}

export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  articleCount: number;
  subcategories: HelpSubcategory[];
  featured?: boolean;
  order: number;
}

export interface HelpSubcategory {
  id: string;
  title: string;
  description: string;
  articleIds: string[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful: number;
  notHelpful: number;
  lastUpdated: string;
  featured?: boolean;
}

export interface SearchResult {
  type: 'article' | 'faq';
  item: HelpArticle | FAQ;
  relevanceScore: number;
  matchedTerms: string[];
}

export class HelpContentService {
  private static articles: HelpArticle[] = [];
  private static categories: HelpCategory[] = [];
  private static faqs: FAQ[] = [];
  private static initialized = false;

  /**
   * Initialize the help content service with predefined content
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    this.categories = this.getDefaultCategories();
    this.articles = this.getDefaultArticles();
    this.faqs = this.getDefaultFAQs();
    this.initialized = true;
  }

  /**
   * Get all help categories
   */
  static async getCategories(): Promise<HelpCategory[]> {
    await this.initialize();
    return this.categories.sort((a, b) => a.order - b.order);
  }

  /**
   * Get category by ID
   */
  static async getCategory(categoryId: string): Promise<HelpCategory | null> {
    await this.initialize();
    return this.categories.find(cat => cat.id === categoryId) || null;
  }

  /**
   * Get articles by category
   */
  static async getArticlesByCategory(
    categoryId: string,
    subcategoryId?: string
  ): Promise<HelpArticle[]> {
    await this.initialize();
    let filteredArticles = this.articles.filter(
      article => article.category === categoryId
    );

    if (subcategoryId) {
      filteredArticles = filteredArticles.filter(
        article => article.subcategory === subcategoryId
      );
    }

    return filteredArticles.sort((a, b) => b.views - a.views);
  }

  /**
   * Get article by ID
   */
  static async getArticle(articleId: string): Promise<HelpArticle | null> {
    await this.initialize();
    const article = this.articles.find(art => art.id === articleId);

    if (article) {
      // Increment view count
      article.views += 1;
    }

    return article || null;
  }

  /**
   * Get popular articles
   */
  static async getPopularArticles(limit: number = 5): Promise<HelpArticle[]> {
    await this.initialize();
    return this.articles
      .filter(article => article.popular)
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  /**
   * Get featured articles
   */
  static async getFeaturedArticles(limit: number = 3): Promise<HelpArticle[]> {
    await this.initialize();
    return this.articles
      .filter(article => article.featured)
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  /**
   * Search articles and FAQs
   */
  static async search(
    query: string,
    filters?: {
      category?: string;
      difficulty?: string;
      type?: 'article' | 'faq' | 'both';
    }
  ): Promise<SearchResult[]> {
    await this.initialize();
    const results: SearchResult[] = [];
    const searchTerms = query
      .toLowerCase()
      .split(' ')
      .filter(term => term.length > 2);

    if (
      !filters?.type ||
      filters.type === 'article' ||
      filters.type === 'both'
    ) {
      this.articles.forEach(article => {
        if (filters?.category && article.category !== filters.category) return;
        if (filters?.difficulty && article.difficulty !== filters.difficulty)
          return;

        const relevanceScore = this.calculateRelevance(
          searchTerms,
          article.searchableContent.toLowerCase(),
          article.title.toLowerCase(),
          article.tags
        );

        if (relevanceScore > 0) {
          results.push({
            type: 'article',
            item: article,
            relevanceScore,
            matchedTerms: this.getMatchedTerms(
              searchTerms,
              article.searchableContent.toLowerCase()
            ),
          });
        }
      });
    }

    if (!filters?.type || filters.type === 'faq' || filters.type === 'both') {
      this.faqs.forEach(faq => {
        if (filters?.category && faq.category !== filters.category) return;

        const searchableText = `${faq.question} ${faq.answer}`.toLowerCase();
        const relevanceScore = this.calculateRelevance(
          searchTerms,
          searchableText,
          faq.question.toLowerCase(),
          faq.tags
        );

        if (relevanceScore > 0) {
          results.push({
            type: 'faq',
            item: faq,
            relevanceScore,
            matchedTerms: this.getMatchedTerms(searchTerms, searchableText),
          });
        }
      });
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get FAQs by category
   */
  static async getFAQsByCategory(categoryId?: string): Promise<FAQ[]> {
    await this.initialize();
    if (!categoryId) {
      return this.faqs.sort((a, b) => b.helpful - a.helpful);
    }
    return this.faqs
      .filter(faq => faq.category === categoryId)
      .sort((a, b) => b.helpful - a.helpful);
  }

  /**
   * Get related articles
   */
  static async getRelatedArticles(
    articleId: string,
    limit: number = 3
  ): Promise<HelpArticle[]> {
    await this.initialize();
    const article = this.articles.find(art => art.id === articleId);
    if (!article) return [];

    const related = this.articles.filter(
      art => art.id !== articleId && article.relatedArticles.includes(art.id)
    );

    if (related.length < limit) {
      // Find articles in same category if not enough related articles
      const sameCategory = this.articles
        .filter(
          art =>
            art.id !== articleId &&
            art.category === article.category &&
            !related.find(r => r.id === art.id)
        )
        .sort((a, b) => b.views - a.views);

      related.push(...sameCategory.slice(0, limit - related.length));
    }

    return related.slice(0, limit);
  }

  /**
   * Mark article as helpful or not helpful
   */
  static async rateArticle(articleId: string, helpful: boolean): Promise<void> {
    await this.initialize();
    const article = this.articles.find(art => art.id === articleId);
    if (article) {
      if (helpful) {
        article.helpful += 1;
      } else {
        article.notHelpful += 1;
      }
    }
  }

  /**
   * Mark FAQ as helpful or not helpful
   */
  static async rateFAQ(faqId: string, helpful: boolean): Promise<void> {
    await this.initialize();
    const faq = this.faqs.find(f => f.id === faqId);
    if (faq) {
      if (helpful) {
        faq.helpful += 1;
      } else {
        faq.notHelpful += 1;
      }
    }
  }

  /**
   * Calculate search relevance score
   */
  private static calculateRelevance(
    searchTerms: string[],
    content: string,
    title: string,
    tags: string[]
  ): number {
    let score = 0;

    searchTerms.forEach(term => {
      // Title matches have highest weight
      if (title.includes(term)) {
        score += 10;
      }

      // Tag matches have high weight
      if (tags.some(tag => tag.toLowerCase().includes(term))) {
        score += 5;
      }

      // Content matches
      const contentMatches = (content.match(new RegExp(term, 'g')) || [])
        .length;
      score += contentMatches * 2;
    });

    return score;
  }

  /**
   * Get matched terms for highlighting
   */
  private static getMatchedTerms(
    searchTerms: string[],
    content: string
  ): string[] {
    return searchTerms.filter(term => content.includes(term));
  }

  /**
   * Default categories configuration
   */
  private static getDefaultCategories(): HelpCategory[] {
    return [
      {
        id: 'getting-started',
        title: 'Getting Started',
        description: 'Basic setup and first steps with ClariFi',
        icon: 'play-circle',
        articleCount: 8,
        order: 1,
        featured: true,
        subcategories: [
          {
            id: 'account-setup',
            title: 'Account Setup',
            description: 'Creating and configuring your account',
            articleIds: ['setup-account', 'verify-email', 'connect-bank'],
          },
          {
            id: 'first-steps',
            title: 'First Steps',
            description: 'What to do after creating your account',
            articleIds: [
              'first-transaction',
              'categorize-transactions',
              'set-budget',
            ],
          },
        ],
      },
      {
        id: 'account-security',
        title: 'Account & Security',
        description: 'Login, password, and security settings',
        icon: 'shield',
        articleCount: 12,
        order: 2,
        featured: true,
        subcategories: [
          {
            id: 'authentication',
            title: 'Authentication',
            description: 'Login and password management',
            articleIds: [
              'setup-biometric',
              'reset-password',
              'two-factor-auth',
            ],
          },
          {
            id: 'account-security',
            title: 'Account Security',
            description: 'Keeping your account secure',
            articleIds: [
              'security-tips',
              'suspicious-activity',
              'logout-devices',
            ],
          },
        ],
      },
      {
        id: 'transactions',
        title: 'Transactions',
        description: 'Managing and categorizing your transactions',
        icon: 'credit-card',
        articleCount: 15,
        order: 3,
        subcategories: [
          {
            id: 'viewing-transactions',
            title: 'Viewing Transactions',
            description: 'How to view and filter your transactions',
            articleIds: [
              'view-transactions',
              'filter-transactions',
              'search-transactions',
            ],
          },
          {
            id: 'categorization',
            title: 'Categorization',
            description: 'Understanding and managing transaction categories',
            articleIds: [
              'auto-categorization',
              'manual-categorization',
              'custom-categories',
            ],
          },
        ],
      },
      {
        id: 'budgeting',
        title: 'Budgeting & Goals',
        description: 'Setting up budgets and financial goals',
        icon: 'target',
        articleCount: 10,
        order: 4,
        subcategories: [
          {
            id: 'budget-setup',
            title: 'Budget Setup',
            description: 'Creating and managing budgets',
            articleIds: [
              'create-budget',
              'budget-categories',
              'monthly-budgets',
            ],
          },
          {
            id: 'financial-goals',
            title: 'Financial Goals',
            description: 'Setting and tracking financial goals',
            articleIds: ['savings-goals', 'debt-goals', 'investment-goals'],
          },
        ],
      },
      {
        id: 'ai-insights',
        title: 'AI Insights',
        description: 'Understanding your financial insights powered by AI',
        icon: 'brain',
        articleCount: 6,
        order: 5,
        subcategories: [
          {
            id: 'spending-insights',
            title: 'Spending Insights',
            description: 'AI-powered spending analysis',
            articleIds: [
              'spending-trends',
              'unusual-spending',
              'spending-recommendations',
            ],
          },
          {
            id: 'qa-system',
            title: 'Q&A System',
            description: 'Using the AI assistant',
            articleIds: [
              'ask-questions',
              'understand-responses',
              'ai-limitations',
            ],
          },
        ],
      },
      {
        id: 'privacy-data',
        title: 'Privacy & Data',
        description: 'Data export, privacy settings, and PIPEDA compliance',
        icon: 'lock',
        articleCount: 9,
        order: 6,
        subcategories: [
          {
            id: 'data-export',
            title: 'Data Export',
            description: 'Exporting your financial data',
            articleIds: ['export-csv', 'export-json', 'export-pdf'],
          },
          {
            id: 'privacy-settings',
            title: 'Privacy Settings',
            description: 'Managing your privacy preferences',
            articleIds: [
              'privacy-controls',
              'data-retention',
              'consent-management',
            ],
          },
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        description: 'Common issues and solutions',
        icon: 'alert-circle',
        articleCount: 14,
        order: 7,
        subcategories: [
          {
            id: 'login-issues',
            title: 'Login Issues',
            description: 'Trouble signing in to your account',
            articleIds: [
              'forgot-password',
              'biometric-not-working',
              'account-locked',
            ],
          },
          {
            id: 'app-issues',
            title: 'App Issues',
            description: 'App not working as expected',
            articleIds: ['app-crashes', 'slow-performance', 'sync-issues'],
          },
        ],
      },
      {
        id: 'billing',
        title: 'Billing & Subscription',
        description: 'Premium features and billing questions',
        icon: 'dollar-sign',
        articleCount: 7,
        order: 8,
        subcategories: [
          {
            id: 'subscription',
            title: 'Subscription Management',
            description: 'Managing your ClariFi subscription',
            articleIds: [
              'upgrade-premium',
              'cancel-subscription',
              'billing-cycle',
            ],
          },
          {
            id: 'premium-features',
            title: 'Premium Features',
            description: 'Understanding premium features',
            articleIds: [
              'premium-benefits',
              'feature-comparison',
              'ai-usage-limits',
            ],
          },
        ],
      },
    ];
  }

  /**
   * Default articles configuration
   */
  private static getDefaultArticles(): HelpArticle[] {
    return [
      {
        id: 'setup-account',
        title: 'Setting up your ClariFi account',
        category: 'getting-started',
        subcategory: 'account-setup',
        content: `# Setting up your ClariFi account

Welcome to ClariFi! Follow these steps to get your account set up and start managing your finances.

## Step 1: Create Your Account
1. Download the ClariFi app from the App Store or Google Play
2. Tap "Sign Up" on the welcome screen
3. Enter your email address and create a secure password
4. Verify your email address by clicking the link sent to your inbox

## Step 2: Set Up Security
1. Enable biometric login (Face ID/Touch ID) for quick access
2. Review security settings in your profile
3. Consider enabling two-factor authentication for extra security

## Step 3: Connect Your Bank Account (Optional)
1. Go to Settings > Account Connection
2. Select your bank from the list
3. Follow the secure connection process
4. Your transactions will start syncing automatically

## Next Steps
- Set up your first budget
- Explore transaction categorization
- Try asking the AI assistant a question about your finances

Need help? Contact our support team anytime!`,
        summary:
          'Learn how to create and set up your ClariFi account with security features and bank connections.',
        tags: [
          'setup',
          'account',
          'getting started',
          'registration',
          'security',
        ],
        lastUpdated: '2024-01-15',
        views: 1250,
        helpful: 89,
        notHelpful: 3,
        difficulty: 'beginner',
        estimatedReadTime: 3,
        relatedArticles: ['verify-email', 'connect-bank', 'setup-biometric'],
        searchableContent:
          'setting up clarifi account create sign up email password verify security biometric login face id touch id bank account connection sync transactions budget categorization ai assistant',
        featured: true,
        popular: true,
      },
      {
        id: 'setup-biometric',
        title: 'Setting up biometric login (Face ID/Touch ID)',
        category: 'account-security',
        subcategory: 'authentication',
        content: `# Setting up biometric login

Biometric login makes accessing your ClariFi account faster and more secure.

## Requirements
- Device with Face ID or Touch ID capability
- Biometrics already set up in device settings
- ClariFi app version 1.0 or later

## Setup Process
1. Open ClariFi and go to Profile > Biometric Login
2. Tap "Enable Biometric Login"
3. Authenticate with your current password
4. Follow the biometric authentication prompt
5. Confirmation will appear when setup is complete

## Troubleshooting
- Ensure biometrics are enrolled in device settings
- Try restarting the app if authentication fails
- Contact support if issues persist

## Security Notes
- Biometric data is stored securely on your device
- You can disable this feature anytime in settings
- Password backup is always available`,
        summary:
          'Enable Face ID or Touch ID for quick and secure access to your ClariFi account.',
        tags: [
          'biometric',
          'face id',
          'touch id',
          'login',
          'security',
          'authentication',
        ],
        lastUpdated: '2024-01-10',
        views: 890,
        helpful: 76,
        notHelpful: 5,
        difficulty: 'beginner',
        estimatedReadTime: 2,
        relatedArticles: ['security-tips', 'reset-password', 'account-locked'],
        searchableContent:
          'biometric login face id touch id security authentication device settings password backup',
        popular: true,
      },
      {
        id: 'export-data',
        title: 'How to export your financial data',
        category: 'privacy-data',
        subcategory: 'data-export',
        content: `# Exporting Your Financial Data

ClariFi allows you to export your data in multiple formats for your records or analysis.

## Available Export Formats
- **CSV**: Spreadsheet format for analysis
- **JSON**: Structured data for developers
- **PDF**: Human-readable report format

## Export Process
1. Go to Profile > Privacy & Data > Export My Data
2. Select your desired format(s)
3. Choose date range (last month to all data)
4. Select data types to include:
   - Personal information
   - Transactions
   - Categories
   - Settings
   - Q&A history

## Data Security
- Files are encrypted during generation
- Download links expire in 24 hours
- Files are automatically deleted after download
- All exports are logged for security

## What's Included
Your export may contain:
- Transaction history with categories
- Account settings and preferences
- AI interaction history
- Category customizations
- Privacy settings

## PIPEDA Compliance
All exports comply with Canadian privacy laws (PIPEDA) and include:
- Clear data descriptions
- Export timestamps
- Legal compliance notices
- Contact information for privacy questions`,
        summary:
          'Download your ClariFi data in CSV, JSON, or PDF format with full PIPEDA compliance.',
        tags: [
          'export',
          'data',
          'csv',
          'json',
          'pdf',
          'privacy',
          'pipeda',
          'download',
        ],
        lastUpdated: '2024-01-12',
        views: 445,
        helpful: 67,
        notHelpful: 2,
        difficulty: 'intermediate',
        estimatedReadTime: 4,
        relatedArticles: [
          'privacy-controls',
          'data-retention',
          'consent-management',
        ],
        searchableContent:
          'export financial data csv json pdf pipeda compliance privacy download transactions categories settings security',
        popular: true,
      },
      {
        id: 'manual-categorization',
        title: 'How to manually categorize transactions',
        category: 'transactions',
        subcategory: 'categorization',
        content: `# Manual Transaction Categorization

Sometimes you need to manually categorize transactions for better accuracy.

## Quick Categorization
1. Open the Transactions tab
2. Find the transaction you want to recategorize
3. Tap on the category badge next to the transaction
4. Select the correct category from the list
5. Changes are saved automatically

## Bulk Categorization
For multiple transactions from the same merchant:
1. Long-press on a transaction
2. Tap "Select Multiple" 
3. Choose all similar transactions
4. Tap "Categorize" at the bottom
5. Select the new category
6. Confirm the bulk change

## Creating Custom Categories
1. Go to Profile > Transaction Categories
2. Tap the "+" button to add new category
3. Choose a name and icon
4. Select parent category if it's a subcategory
5. Set spending limits (optional)

## Tips for Better Categorization
- Review auto-categorizations weekly
- Be consistent with merchant categorization
- Use subcategories for detailed tracking
- Set up rules for recurring transactions

## AI Learning
Every manual correction helps ClariFi learn your preferences and improves future automatic categorization accuracy.`,
        summary:
          'Learn how to manually categorize transactions and create custom categories for better spending tracking.',
        tags: [
          'categorization',
          'transactions',
          'manual',
          'custom categories',
          'bulk edit',
        ],
        lastUpdated: '2024-01-20',
        views: 567,
        helpful: 89,
        notHelpful: 7,
        difficulty: 'beginner',
        estimatedReadTime: 3,
        relatedArticles: [
          'setup-account',
          'transaction-disputes',
          'ai-insights',
        ],
        searchableContent:
          'manual categorization transactions bulk edit custom categories merchant rules automatic learning',
        popular: true,
      },
      {
        id: 'create-budget',
        title: 'Creating your first budget in ClariFi',
        category: 'budgeting',
        subcategory: 'budget-setup',
        content: `# Creating Your First Budget

Budgeting helps you control spending and reach your financial goals.

## Getting Started
1. Go to the Budgets tab
2. Tap "Create New Budget"
3. Choose budget type:
   - **Monthly Budget**: Most common, resets each month
   - **Annual Budget**: For long-term planning
   - **Goal-Based**: Tied to specific savings goals

## Setting Up Categories
1. Review your spending history (last 3 months recommended)
2. Set realistic limits for each category:
   - **Fixed Expenses**: Rent, insurance, phone bills
   - **Variable Expenses**: Groceries, entertainment, gas
   - **Savings Goals**: Emergency fund, vacation, etc.

## Canadian Budgeting Guidelines
Follow the 50/30/20 rule adapted for Canadian costs:
- **50%**: Needs (housing, utilities, groceries)
- **30%**: Wants (entertainment, dining out)
- **20%**: Savings and debt repayment

## Budget Tracking
- Weekly check-ins recommended
- Adjust categories based on actual spending
- Use notifications for spending alerts
- Review and revise monthly

## Tips for Success
- Start with realistic, achievable limits
- Include buffer amounts for unexpected expenses
- Track both income and expenses
- Consider seasonal variations (heating costs, etc.)
- Use ClariFi's spending insights to identify patterns

## Emergency Funds
Canadian financial experts recommend 3-6 months of expenses in emergency savings, especially important given economic uncertainties.`,
        summary:
          'Step-by-step guide to creating and managing your first budget using ClariFi tools.',
        tags: [
          'budget',
          'budgeting',
          'financial planning',
          'savings',
          'canadian guidelines',
        ],
        lastUpdated: '2024-01-18',
        views: 1120,
        helpful: 156,
        notHelpful: 12,
        difficulty: 'intermediate',
        estimatedReadTime: 5,
        relatedArticles: [
          'financial-goals',
          'savings-strategies',
          'spending-analysis',
        ],
        searchableContent:
          'budget creation budgeting financial planning savings emergency fund canadian guidelines 50 30 20 rule',
        featured: true,
        popular: true,
      },
      {
        id: 'ai-insights-guide',
        title: 'Understanding AI-powered financial insights',
        category: 'ai-insights',
        subcategory: 'analysis',
        content: `# Understanding AI Financial Insights

ClariFi's AI analyzes your spending patterns to provide personalized financial guidance.

## Types of Insights
**Spending Patterns**
- Identifies trends in your spending habits
- Highlights unusual or large expenses
- Compares current vs. previous periods

**Budget Analysis**
- Shows which categories are over/under budget
- Predicts end-of-month spending based on current trends
- Suggests budget adjustments

**Savings Opportunities**
- Finds subscriptions you're not using
- Identifies areas where you could reduce spending
- Suggests better financial products

## How to Use AI Q&A
1. Tap the AI chat icon in any screen
2. Ask natural questions like:
   - "How much did I spend on groceries last month?"
   - "What's my biggest expense category?"
   - "Am I on track with my budget?"
   - "How can I save more money?"

## Understanding Your Reports
**Spending Score**: Rates your financial health (1-10)
- Green (8-10): Excellent financial habits
- Yellow (5-7): Room for improvement
- Red (1-4): Consider major changes

**Trend Indicators**:
- ↗️ Spending increasing
- ↘️ Spending decreasing  
- ➡️ Spending stable

## Privacy and AI
- All analysis happens with your data only
- No personal information shared with other users
- You can request explanation for any insight
- AI suggestions are personalized to Canadian financial context

## Getting Better Insights
- Connect all your accounts for complete picture
- Categorize transactions accurately
- Set realistic budgets and goals
- Engage with AI recommendations`,
        summary:
          'Learn how to interpret and act on AI-powered spending analysis and financial recommendations.',
        tags: [
          'ai insights',
          'spending analysis',
          'financial guidance',
          'ai chat',
          'reports',
        ],
        lastUpdated: '2024-01-16',
        views: 890,
        helpful: 134,
        notHelpful: 8,
        difficulty: 'intermediate',
        estimatedReadTime: 4,
        relatedArticles: [
          'ask-ai-questions',
          'spending-patterns',
          'budget-optimization',
        ],
        searchableContent:
          'ai insights spending analysis financial guidance chat reports trends budget optimization savings opportunities',
        featured: true,
      },
      {
        id: 'password-reset',
        title: 'How to reset your ClariFi password',
        category: 'account-security',
        subcategory: 'authentication',
        content: `# Resetting Your Password

If you've forgotten your password or need to change it for security reasons.

## Password Reset Process
1. On the login screen, tap "Forgot Password?"
2. Enter your email address
3. Check your email for reset instructions
4. Click the secure link in the email
5. Create a new strong password
6. Confirm the new password
7. Log in with your new credentials

## If You Don't Receive the Email
- Check your spam/junk folder
- Ensure you're using the correct email address
- Wait 5-10 minutes for email delivery
- Try requesting another reset email
- Contact support if issues persist

## Creating a Strong Password
Your new password should:
- Be at least 12 characters long
- Include uppercase and lowercase letters
- Contain numbers and special characters
- Avoid personal information (birthdate, name)
- Be unique to ClariFi (don't reuse other passwords)

## Password Security Tips
- Use a password manager
- Enable biometric login after reset
- Never share your password
- Change passwords if you suspect compromise
- Log out of shared devices

## Two-Factor Authentication
After password reset, consider enabling 2FA:
1. Go to Profile > Security Settings
2. Enable "Two-Factor Authentication"
3. Follow setup instructions
4. Keep backup codes in safe place

## Account Lockout
If you enter wrong password multiple times:
- Account locks for 15 minutes
- Lockout time increases with repeated attempts
- Use password reset instead of guessing
- Contact support for persistent issues

Remember: ClariFi will never ask for your password via email or phone.`,
        summary:
          'Step-by-step guide to securely reset your ClariFi password and improve account security.',
        tags: [
          'password reset',
          'security',
          'authentication',
          'account recovery',
          'two factor',
        ],
        lastUpdated: '2024-01-14',
        views: 456,
        helpful: 78,
        notHelpful: 3,
        difficulty: 'beginner',
        estimatedReadTime: 3,
        relatedArticles: [
          'setup-biometric',
          'account-security',
          'two-factor-auth',
        ],
        searchableContent:
          'password reset security authentication account recovery two factor 2fa strong password',
        popular: true,
      },
      {
        id: 'sync-issues',
        title: 'Troubleshooting transaction sync issues',
        category: 'troubleshooting',
        subcategory: 'syncing',
        content: `# Fixing Transaction Sync Problems

When your transactions aren't updating properly, try these solutions.

## Common Sync Issues
**Delayed Transactions**: New transactions taking longer than 24 hours to appear
**Missing Transactions**: Some transactions not showing up at all
**Duplicate Transactions**: Same transaction appearing multiple times
**Incorrect Amounts**: Transaction amounts don't match bank records

## Quick Fixes
1. **Force Refresh**
   - Pull down on transaction list to refresh
   - Wait 30 seconds for sync to complete
   - Check if missing transactions appear

2. **Check Internet Connection**
   - Ensure strong WiFi or cellular signal
   - Try switching between WiFi and cellular data
   - Close and reopen the app

3. **Update Account Connection**
   - Go to Profile > Connected Accounts
   - Tap "Refresh" next to each account
   - Re-enter credentials if prompted

## Advanced Troubleshooting
**Clear App Cache** (Android):
1. Go to device Settings > Apps
2. Find ClariFi app
3. Tap "Storage"
4. Select "Clear Cache" (not Clear Data)

**Restart App** (iOS/Android):
1. Close ClariFi completely
2. Wait 30 seconds
3. Reopen the app
4. Allow sync to complete

**Bank-Specific Issues**:
- Some banks have delayed reporting (up to 3 business days)
- Weekend transactions may not appear until Monday
- Bank maintenance can temporarily block syncing

## When to Contact Support
- Transactions missing for more than 3 business days
- Unable to reconnect bank account
- Persistent duplicate transactions
- App crashes during sync

## Prevention Tips
- Keep the app updated
- Maintain stable internet connection
- Don't force-close app during sync
- Log in at least weekly to maintain connection

Canadian banks typically process transactions within 1-2 business days, but some credit unions may take longer.`,
        summary:
          'Fix common transaction syncing problems and maintain reliable bank account connections.',
        tags: [
          'sync issues',
          'troubleshooting',
          'bank connection',
          'transactions',
          'technical support',
        ],
        lastUpdated: '2024-01-17',
        views: 634,
        helpful: 89,
        notHelpful: 15,
        difficulty: 'intermediate',
        estimatedReadTime: 4,
        relatedArticles: ['connect-bank', 'app-performance', 'contact-support'],
        searchableContent:
          'sync issues troubleshooting bank connection transactions missing duplicate delayed refresh cache',
        popular: true,
      },
    ];
  }

  /**
   * Default FAQs configuration
   */
  private static getDefaultFAQs(): FAQ[] {
    return [
      {
        id: 'what-is-clarifi',
        question: 'What is ClariFi and how does it work?',
        answer:
          'ClariFi is a Canadian personal finance app that helps you understand and manage your money using AI-powered insights. It categorizes your transactions, provides spending analysis, and answers questions about your financial habits.',
        category: 'getting-started',
        tags: ['basics', 'overview', 'ai', 'features'],
        helpful: 156,
        notHelpful: 4,
        lastUpdated: '2024-01-15',
        featured: true,
      },
      {
        id: 'is-clarifi-secure',
        question: 'Is my financial data secure with ClariFi?',
        answer:
          'Yes, ClariFi uses bank-level security including encryption, secure data transmission, and compliance with Canadian privacy laws (PIPEDA). Your data is never sold to third parties and you maintain full control over your information.',
        category: 'account-security',
        tags: ['security', 'privacy', 'encryption', 'pipeda'],
        helpful: 234,
        notHelpful: 8,
        lastUpdated: '2024-01-14',
        featured: true,
      },
      {
        id: 'how-categorization-works',
        question: 'How does automatic transaction categorization work?',
        answer:
          'ClariFi uses machine learning to analyze transaction descriptions, merchant names, and spending patterns to automatically categorize your transactions. You can review and correct categories, which helps improve accuracy over time.',
        category: 'transactions',
        tags: ['categorization', 'ai', 'machine learning', 'accuracy'],
        helpful: 189,
        notHelpful: 12,
        lastUpdated: '2024-01-13',
        featured: true,
      },
      {
        id: 'cost-of-clarifi',
        question: 'How much does ClariFi cost?',
        answer:
          'ClariFi offers a free tier with basic features and a premium subscription for advanced AI insights, unlimited questions, and enhanced analytics. Check the app for current pricing in your region.',
        category: 'billing',
        tags: ['pricing', 'subscription', 'premium', 'free'],
        helpful: 145,
        notHelpful: 6,
        lastUpdated: '2024-01-11',
      },
      {
        id: 'delete-account',
        question: 'How do I delete my ClariFi account?',
        answer:
          'You can delete your account by going to Profile > Privacy & Data > Account Deletion. This will permanently remove all your data in compliance with PIPEDA requirements. Some financial records may be retained for legal purposes as disclosed in our privacy policy.',
        category: 'privacy-data',
        tags: ['account deletion', 'privacy', 'pipeda', 'data removal'],
        helpful: 78,
        notHelpful: 3,
        lastUpdated: '2024-01-10',
      },
      {
        id: 'bank-connection-failed',
        question: "Why won't my bank account connect to ClariFi?",
        answer:
          'Bank connection issues can occur for several reasons: 1) Incorrect login credentials - verify your username/password, 2) Your bank requires additional authentication - check for text messages or app notifications, 3) Temporary bank maintenance - try again in a few hours, 4) Unsupported bank - check our supported institutions list. If problems persist, try refreshing the connection or contact support.',
        category: 'troubleshooting',
        tags: ['bank connection', 'sync', 'credentials', 'authentication'],
        helpful: 167,
        notHelpful: 23,
        lastUpdated: '2024-01-19',
      },
      {
        id: 'missing-transactions',
        question: 'Some of my transactions are missing. What should I do?',
        answer:
          'Missing transactions are usually due to sync delays or connection issues. First, try pulling down on the transactions list to refresh. If transactions are still missing after 24 hours: 1) Check your bank account connection in Settings, 2) Ensure transactions are fully processed by your bank, 3) Some banks exclude pending transactions, 4) Weekend transactions may appear on Monday. Contact support if transactions remain missing after 3 business days.',
        category: 'transactions',
        tags: ['missing transactions', 'sync', 'bank delay', 'pending'],
        helpful: 134,
        notHelpful: 18,
        lastUpdated: '2024-01-18',
      },
      {
        id: 'ai-accuracy',
        question: "How accurate are ClariFi's AI insights and predictions?",
        answer:
          "ClariFi's AI insights become more accurate over time as it learns your spending patterns. Initially, accuracy is around 80-85% but improves to 90%+ with regular use. Accuracy depends on: 1) Amount of transaction history available, 2) Consistency in spending patterns, 3) Proper transaction categorization, 4) Regular app usage. You can improve accuracy by correcting categorization errors and providing feedback on AI suggestions.",
        category: 'ai-insights',
        tags: [
          'ai accuracy',
          'machine learning',
          'predictions',
          'spending patterns',
        ],
        helpful: 156,
        notHelpful: 12,
        lastUpdated: '2024-01-17',
      },
      {
        id: 'canadian-banks',
        question: 'Which Canadian banks are supported by ClariFi?',
        answer:
          'ClariFi supports all major Canadian banks including RBC, TD Bank, Scotiabank, BMO, CIBC, National Bank, and most credit unions. We also support major credit cards from these institutions. Some smaller regional banks and credit unions may have limited or delayed support. Check our website for the complete list of supported financial institutions, which is updated regularly as we add new partnerships.',
        category: 'getting-started',
        tags: [
          'canadian banks',
          'supported institutions',
          'rbc',
          'td',
          'scotiabank',
          'bmo',
          'cibc',
        ],
        helpful: 203,
        notHelpful: 7,
        lastUpdated: '2024-01-20',
      },
      {
        id: 'subscription-management',
        question: 'How do I manage my ClariFi subscription?',
        answer:
          "You can manage your subscription through your device's app store (Apple App Store or Google Play Store) or within the ClariFi app. In-app: go to Profile > Subscription to view your current plan, billing date, and payment method. To cancel: follow the cancellation process in your app store settings. Premium features remain active until the end of your current billing period.",
        category: 'billing',
        tags: ['subscription', 'billing', 'premium', 'cancel', 'app store'],
        helpful: 89,
        notHelpful: 4,
        lastUpdated: '2024-01-16',
      },
      {
        id: 'data-privacy-canada',
        question: 'How does ClariFi comply with Canadian privacy laws?',
        answer:
          'ClariFi fully complies with PIPEDA (Personal Information Protection and Electronic Documents Act) and provincial privacy laws. We: 1) Only collect necessary financial data with your consent, 2) Use bank-level encryption for all data transmission and storage, 3) Never sell your personal information to third parties, 4) Provide full data portability and deletion rights, 5) Store Canadian user data within Canada. You can review our complete privacy policy and request data exports or deletion at any time.',
        category: 'privacy-data',
        tags: [
          'pipeda',
          'privacy',
          'canadian law',
          'data protection',
          'compliance',
        ],
        helpful: 178,
        notHelpful: 5,
        lastUpdated: '2024-01-19',
        featured: true,
      },
      {
        id: 'budget-not-working',
        question: 'My budget tracking seems inaccurate. How can I fix it?',
        answer:
          'Budget tracking accuracy depends on proper transaction categorization and realistic budget limits. To improve accuracy: 1) Review and correct transaction categories regularly, 2) Ensure all accounts are connected and syncing, 3) Adjust budget amounts based on 3+ months of spending history, 4) Include seasonal expenses in annual budgets, 5) Account for Canadian-specific costs (heating, summer activities). Use the budget analysis feature to identify discrepancies and adjust categories or limits as needed.',
        category: 'budgeting',
        tags: [
          'budget accuracy',
          'categorization',
          'tracking',
          'spending limits',
        ],
        helpful: 145,
        notHelpful: 11,
        lastUpdated: '2024-01-18',
      },
      {
        id: 'app-slow-performance',
        question:
          'ClariFi app is running slowly. How can I improve performance?',
        answer:
          'Slow app performance can be improved by: 1) Ensuring you have the latest app version from your app store, 2) Restarting the app completely, 3) Clearing app cache (Android: Settings > Apps > ClariFi > Storage > Clear Cache), 4) Freeing up device storage space (app needs at least 1GB free), 5) Checking internet connection speed, 6) Reducing the number of background apps running. If performance issues persist, try reinstalling the app or contact support.',
        category: 'troubleshooting',
        tags: ['app performance', 'slow', 'cache', 'storage', 'speed'],
        helpful: 112,
        notHelpful: 8,
        lastUpdated: '2024-01-17',
      },
      {
        id: 'family-sharing',
        question: 'Can I share my ClariFi account with family members?',
        answer:
          "For security and privacy reasons, ClariFi accounts are designed for individual use only. However, you can: 1) Create separate accounts for each family member, 2) Use the family goals feature to share specific savings targets, 3) Export summary reports to share with family for budgeting discussions. We're developing family sharing features for future releases that will allow secure sharing of specific budget categories or goals.",
        category: 'account-security',
        tags: ['family sharing', 'multiple accounts', 'privacy', 'security'],
        helpful: 134,
        notHelpful: 22,
        lastUpdated: '2024-01-15',
      },
    ];
  }
}
