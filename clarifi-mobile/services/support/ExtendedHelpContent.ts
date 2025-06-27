/**
 * Extended Help Content for ClariFi
 * Comprehensive articles and FAQs addressing content gaps
 */

import { HelpArticle, FAQ } from './HelpContentService';

export const ExtendedHelpArticles: HelpArticle[] = [
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
    relatedArticles: ['setup-account', 'transaction-disputes', 'ai-insights'],
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
    relatedArticles: ['setup-biometric', 'account-security', 'two-factor-auth'],
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
  {
    id: 'connect-bank-guide',
    title: 'How to connect your bank account to ClariFi',
    category: 'getting-started',
    subcategory: 'bank-connection',
    content: `# Connecting Your Bank Account

Link your Canadian bank account to automatically import transactions.

## Supported Canadian Banks
**Major Banks**:
- Royal Bank of Canada (RBC)
- Toronto-Dominion Bank (TD)
- Bank of Nova Scotia (Scotiabank)
- Bank of Montreal (BMO)
- Canadian Imperial Bank of Commerce (CIBC)
- National Bank of Canada

**Credit Unions & Others**:
- Most provincial credit unions
- Tangerine Bank
- PC Financial
- Simplii Financial

## Connection Process
1. Go to Profile > Connected Accounts
2. Tap "Add Bank Account"
3. Search for your bank by name
4. Enter your online banking credentials
5. Complete multi-factor authentication if prompted
6. Select which accounts to connect
7. Wait for initial sync (may take 1-2 hours)

## Security & Privacy
- ClariFi uses bank-level 256-bit encryption
- We partner with trusted providers like Plaid
- Your banking credentials are never stored on our servers
- Connection is read-only (we can't make transactions)
- You can disconnect at any time

## Troubleshooting Connection Issues
**Invalid Credentials**: Verify username/password on your bank's website first
**Authentication Required**: Check for text messages or banking app notifications
**Bank Not Found**: Contact support - we may not support your institution yet
**Connection Timeout**: Try again during off-peak hours

## Managing Connected Accounts
- View connection status in Profile > Connected Accounts
- Refresh connections manually if needed
- Update credentials when you change banking passwords
- Disconnect accounts you no longer want to track

## What Gets Imported
- Checking account transactions
- Savings account activity
- Credit card purchases and payments
- Line of credit activity
- Transaction dates, amounts, and descriptions
- Merchant names and categories

Note: Investment accounts and detailed investment data are not currently supported.`,
    summary:
      'Connect your Canadian bank account safely to automatically import and categorize transactions.',
    tags: [
      'bank connection',
      'account setup',
      'canadian banks',
      'security',
      'sync',
    ],
    lastUpdated: '2024-01-19',
    views: 1567,
    helpful: 189,
    notHelpful: 23,
    difficulty: 'beginner',
    estimatedReadTime: 4,
    relatedArticles: ['setup-account', 'sync-issues', 'account-security'],
    searchableContent:
      'connect bank account canadian banks rbc td scotiabank bmo cibc security sync plaid',
    featured: true,
    popular: true,
  },
  {
    id: 'financial-goals',
    title: 'Setting and tracking financial goals',
    category: 'budgeting',
    subcategory: 'goals',
    content: `# Financial Goals & Savings Targets

Set achievable financial goals and track your progress with ClariFi.

## Types of Financial Goals
**Short-term Goals** (1-12 months):
- Emergency fund building
- Vacation savings
- Electronics or gadgets
- Home improvements

**Medium-term Goals** (1-5 years):
- Down payment for a home
- Car purchase
- Wedding expenses
- Education funding

**Long-term Goals** (5+ years):
- Retirement savings
- Children's education (RESP)
- Mortgage payoff
- Investment portfolio

## Setting SMART Goals
Make your goals **Specific, Measurable, Achievable, Relevant, Time-bound**:
- ❌ "Save more money"
- ✅ "Save $5,000 for emergency fund by December 2024"

## Canadian Savings Strategies
**Emergency Fund**: Start with $1,000, build to 3-6 months expenses
**TFSA**: Use Tax-Free Savings Account for flexible goals
**RRSP**: Retirement savings with tax deductions
**RESP**: Education savings with government matching

## Creating Goals in ClariFi
1. Go to Budgets > Goals tab
2. Tap "Add New Goal"
3. Set goal amount and target date
4. Choose funding method:
   - Fixed monthly amount
   - Percentage of income
   - Spare change roundups
5. Monitor progress with visual indicators

## Staying Motivated
- Break large goals into smaller milestones
- Celebrate progress milestones
- Use visual progress bars
- Set up automatic transfers
- Review and adjust monthly

## Goal Achievement Tips
- Start small and build momentum
- Automate savings when possible
- Track spending in related categories
- Use windfalls (tax refunds, bonuses) strategically
- Consider increasing contributions with raises

Remember: The best financial goal is one you'll actually stick to. Start realistic and adjust as you build confidence.`,
    summary:
      'Learn how to set realistic financial goals and use ClariFi tools to track your savings progress.',
    tags: [
      'financial goals',
      'savings',
      'budgeting',
      'emergency fund',
      'tfsa',
      'rrsp',
    ],
    lastUpdated: '2024-01-20',
    views: 923,
    helpful: 145,
    notHelpful: 9,
    difficulty: 'intermediate',
    estimatedReadTime: 5,
    relatedArticles: ['create-budget', 'savings-strategies', 'emergency-fund'],
    searchableContent:
      'financial goals savings targets emergency fund tfsa rrsp resp smart goals canadian strategies',
    popular: true,
  },
  {
    id: 'transaction-disputes',
    title: 'How to dispute incorrect transactions',
    category: 'transactions',
    subcategory: 'disputes',
    content: `# Disputing Transactions

When you find incorrect or fraudulent transactions, here's how to handle them.

## Types of Transaction Issues
**Fraudulent Charges**: Unauthorized transactions you didn't make
**Merchant Errors**: Wrong amounts or duplicate charges
**Subscription Issues**: Continued billing after cancellation
**ATM Problems**: Incorrect fees or failed transactions

## Immediate Steps
1. **Document Everything**
   - Screenshot the transaction in ClariFi
   - Note date, amount, and merchant
   - Gather any receipts or communication

2. **Contact Your Bank First**
   - Call the number on your card immediately
   - Report fraudulent transactions within 24 hours
   - Request temporary holds on accounts if needed

3. **Update ClariFi**
   - Mark transaction as "Disputed" in app
   - Add notes about the dispute status
   - This prevents it from affecting budget calculations

## Working with Canadian Banks
**For Credit Cards**:
- You're protected under Canadian law for fraudulent charges
- Banks must investigate within specific timeframes
- You may get temporary credit during investigation

**For Debit Cards**:
- Report immediately for better protection
- Banks have different policies for debit fraud
- Some banks offer zero liability protection

## Merchant Disputes
**Direct Contact First**:
1. Contact merchant customer service
2. Reference your purchase details
3. Request refund or correction
4. Get confirmation in writing

**If Merchant Won't Help**:
- File complaint with your bank
- Consider chargeback process
- Document all communication attempts

## Following Up
- Check dispute status regularly
- Respond promptly to bank requests
- Keep all documentation
- Update transaction status in ClariFi once resolved

## Prevention Tips
- Review transactions weekly
- Set up transaction alerts
- Use secure payment methods
- Keep receipts for large purchases
- Monitor subscriptions regularly

## When to Contact ClariFi Support
- If disputes affect budgeting calculations
- Need help understanding transaction details
- Questions about categorizing disputed transactions
- Technical issues with marking disputes

Remember: ClariFi shows your bank data but can't resolve disputes directly. Always work with your bank for transaction issues.`,
    summary:
      'Handle incorrect or fraudulent transactions by working with your bank and managing disputes in ClariFi.',
    tags: [
      'transaction disputes',
      'fraud',
      'chargebacks',
      'bank protection',
      'security',
    ],
    lastUpdated: '2024-01-18',
    views: 445,
    helpful: 67,
    notHelpful: 8,
    difficulty: 'intermediate',
    estimatedReadTime: 4,
    relatedArticles: [
      'account-security',
      'contact-support',
      'transaction-categories',
    ],
    searchableContent:
      'transaction disputes fraud chargebacks bank protection security merchant errors unauthorized',
    popular: true,
  },
  {
    id: 'app-navigation',
    title: 'Navigating the ClariFi mobile app',
    category: 'getting-started',
    subcategory: 'navigation',
    content: `# App Navigation Guide

Learn your way around ClariFi's mobile interface for efficient financial management.

## Main Navigation Tabs
**Dashboard** (Home Icon):
- Overview of financial health
- Recent transactions
- Budget status at a glance
- Quick actions and insights

**Transactions** (List Icon):
- All transaction history
- Search and filter options
- Manual categorization
- Transaction details and editing

**Budgets** (Chart Icon):
- Budget overview and progress
- Category breakdowns
- Goal tracking
- Spending alerts and insights

**Profile** (Person Icon):
- Account settings
- Connected accounts
- Privacy and security
- Help and support

## Key Features & Gestures
**Pull to Refresh**: Sync latest transactions
**Long Press**: Select multiple transactions
**Swipe Left**: Quick categorize transaction
**Swipe Right**: Mark transaction as reviewed
**Pinch to Zoom**: Expand charts and graphs

## Search & Filter Functions
**Global Search**:
- Tap search icon in any tab
- Search by merchant, amount, or category
- Use date ranges for specific periods

**Advanced Filters**:
- Filter by category, amount range, or date
- Save frequently used filter combinations
- Export filtered results

## Quick Actions
**From Dashboard**:
- Tap "+" to add manual transaction
- Tap budget progress bars for details
- Access AI chat from floating button

**From Transactions**:
- Tap transaction for full details
- Tap category badge to recategorize
- Use bulk actions for multiple transactions

## Accessibility Features
- VoiceOver support for screen readers
- High contrast mode compatibility
- Large text support
- Voice input for AI questions

## Customization Options
**Dashboard Widgets**:
- Rearrange widgets by preference
- Hide/show specific insights
- Customize date ranges

**Notification Settings**:
- Budget alerts and thresholds
- Transaction sync notifications
- Weekly/monthly summaries

## Tips for Efficient Use
- Use the search function frequently
- Set up custom categories for recurring expenses
- Review transactions weekly during commute
- Enable notifications for overspending alerts
- Use AI chat for quick financial questions

## Keyboard Shortcuts (External Keyboards)
- Cmd/Ctrl + F: Search
- Cmd/Ctrl + R: Refresh
- Space: Quick categorize selected transaction
- Enter: Confirm action or edit

The app is designed for one-handed use with all important functions accessible from the bottom of the screen.`,
    summary:
      "Master ClariFi's mobile interface with tips for navigation, gestures, and efficient app usage.",
    tags: [
      'app navigation',
      'mobile interface',
      'gestures',
      'accessibility',
      'tips',
    ],
    lastUpdated: '2024-01-19',
    views: 678,
    helpful: 98,
    notHelpful: 12,
    difficulty: 'beginner',
    estimatedReadTime: 4,
    relatedArticles: [
      'setup-account',
      'transaction-management',
      'accessibility',
    ],
    searchableContent:
      'app navigation mobile interface gestures accessibility search filter dashboard transactions budgets profile',
    popular: true,
  },
];

export const ExtendedFAQs: FAQ[] = [
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
    tags: ['budget accuracy', 'categorization', 'tracking', 'spending limits'],
    helpful: 145,
    notHelpful: 11,
    lastUpdated: '2024-01-18',
  },
  {
    id: 'app-slow-performance',
    question: 'ClariFi app is running slowly. How can I improve performance?',
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
  {
    id: 'offline-access',
    question: 'Can I use ClariFi without an internet connection?',
    answer:
      'ClariFi requires an internet connection for real-time features like transaction syncing, AI insights, and cloud backup. However, you can: 1) View previously loaded transaction data offline, 2) Add manual transactions (will sync when reconnected), 3) Review budgets and goals, 4) Access downloaded educational content. For best experience, connect to WiFi or cellular data regularly to keep your financial data current.',
    category: 'troubleshooting',
    tags: ['offline', 'internet connection', 'sync', 'manual transactions'],
    helpful: 98,
    notHelpful: 14,
    lastUpdated: '2024-01-16',
  },
  {
    id: 'tax-preparation',
    question: 'Can ClariFi help with Canadian tax preparation?',
    answer:
      "ClariFi can assist with tax preparation by: 1) Exporting transaction data in tax-friendly formats, 2) Categorizing business expenses automatically, 3) Tracking charitable donations and receipts, 4) Identifying tax-deductible expenses, 5) Providing year-end spending summaries. However, ClariFi is not tax software - you'll need dedicated tax preparation software or a professional accountant for filing your Canadian tax return.",
    category: 'privacy-data',
    tags: ['taxes', 'cra', 'export', 'business expenses', 'deductions'],
    helpful: 156,
    notHelpful: 18,
    lastUpdated: '2024-01-19',
  },
  {
    id: 'multi-currency',
    question:
      'Does ClariFi support multiple currencies for international transactions?',
    answer:
      "ClariFi primarily focuses on Canadian dollars (CAD) but handles international transactions by: 1) Converting foreign currency transactions to CAD using your bank's exchange rate, 2) Showing original currency amounts in transaction details, 3) Tracking foreign transaction fees separately, 4) Including currency conversion in expense categorization. For frequent international transactions, ensure your bank provides detailed foreign exchange information for accurate tracking.",
    category: 'transactions',
    tags: [
      'multiple currencies',
      'international',
      'exchange rates',
      'foreign transactions',
    ],
    helpful: 87,
    notHelpful: 15,
    lastUpdated: '2024-01-17',
  },
  {
    id: 'investment-tracking',
    question: 'Can I track my investments and RRSP contributions in ClariFi?',
    answer:
      "ClariFi currently tracks: 1) Contributions to investment accounts (RRSP, TFSA, etc.), 2) Investment-related fees and transactions, 3) Transfers between accounts. However, we don't track: 1) Real-time investment values, 2) Stock/fund performance, 3) Portfolio allocation, 4) Investment gains/losses. For comprehensive investment tracking, consider dedicated investment apps alongside ClariFi for your overall financial picture.",
    category: 'budgeting',
    tags: ['investments', 'rrsp', 'tfsa', 'portfolio', 'tracking'],
    helpful: 123,
    notHelpful: 21,
    lastUpdated: '2024-01-18',
  },
  {
    id: 'business-expenses',
    question: 'Can I use ClariFi to track business expenses?',
    answer:
      "Yes! ClariFi can help track business expenses by: 1) Creating custom categories for business spending, 2) Tagging transactions as business or personal, 3) Generating expense reports for specific date ranges, 4) Exporting data for accounting software, 5) Tracking mileage and travel expenses. For full business accounting, you'll still need dedicated business accounting software, but ClariFi is excellent for expense tracking and categorization.",
    category: 'transactions',
    tags: [
      'business expenses',
      'self-employed',
      'expense reports',
      'accounting',
    ],
    helpful: 167,
    notHelpful: 13,
    lastUpdated: '2024-01-19',
  },
  {
    id: 'student-features',
    question: 'Are there special features for students or recent graduates?',
    answer:
      'ClariFi offers student-friendly features including: 1) Student budget templates with realistic spending categories, 2) OSAP and student loan tracking, 3) Textbook and education expense categorization, 4) Part-time income tracking, 5) Graduation financial planning tools. We also provide educational content about Canadian student financial aid, building credit history, and transitioning to post-graduation finances. Students can access premium features at a discounted rate.',
    category: 'budgeting',
    tags: ['students', 'osap', 'student loans', 'education', 'graduates'],
    helpful: 145,
    notHelpful: 9,
    lastUpdated: '2024-01-20',
  },
];

/**
 * Integration helper to add extended content to main service
 */
export function integrateExtendedContent(): void {
  // This function would be called to merge the extended content
  // with the main HelpContentService arrays
  console.log('Extended help content ready for integration');
  console.log(`Additional articles: ${ExtendedHelpArticles.length}`);
  console.log(`Additional FAQs: ${ExtendedFAQs.length}`);
}
