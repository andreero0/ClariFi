## Feature Specifications - Post-MVP

### Feature 11: Premium Subscription Tier (Post-MVP)

**Feature Goal:** Implement a premium subscription offering that provides clear additional value while maintaining the core free experience, targeting 5-10% conversion rate with sustainable unit economics.

**API Relationships:**
- Stripe API for payment processing
- Enhanced LLM access (GPT-4, Claude Opus)
- Real-time sync infrastructure
- Priority queue for processing

**Detailed Feature Requirements:**
- Unlimited AI queries with premium models
- Real-time bank synchronization
- Advanced analytics and projections
- Family account sharing (up to 4 members)
- Priority customer support
- Custom categories and rules
- Early access to new features
- Ad-free experience (if ads added to free tier)

**Detailed Implementation Guide:**

#### 1. System Architecture Overview:
- **Subscription Infrastructure:** Stripe integration
- **Feature Flags:** Dynamic premium feature access
- **Enhanced APIs:** Premium LLM endpoints
- **Real-time Sync:** WebSocket connections
- **Multi-tenant:** Family account isolation

#### 2. Database Schema Design:
```
Table: subscriptions
- id: UUID
- user_id: UUID (primary account holder)
- stripe_customer_id: STRING
- stripe_subscription_id: STRING
- status: ENUM('trialing', 'active', 'past_due', 'canceled')
- plan_type: ENUM('monthly', 'annual')
- current_period_start: TIMESTAMP
- current_period_end: TIMESTAMP
- cancel_at_period_end: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

Table: family_members
- id: UUID
- subscription_id: UUID (foreign key)
- email: STRING
- nickname: STRING
- role: ENUM('admin', 'member')
- joined_at: TIMESTAMP
- last_active: TIMESTAMP

Table: premium_features_usage
- user_id: UUID
- feature: STRING
- usage_count: INTEGER
- last_used: TIMESTAMP
- metadata: JSONB

Table: premium_ai_queries
- id: UUID
- user_id: UUID
- query: TEXT
- response: TEXT
- model_used: STRING
- tokens_used: INTEGER
- cost: DECIMAL
- created_at: TIMESTAMP

Indexes:
- subscriptions.user_id
- subscriptions.stripe_customer_id
- family_members.subscription_id
- premium_features_usage.user_id, feature
```

#### 3. Comprehensive API Design:
```
POST /subscriptions/create-checkout-session
- Request: { 
    plan_type: 'monthly' | 'annual',
    success_url: string,
    cancel_url: string
  }
- Response: { checkout_url: string, session_id: string }

POST /subscriptions/manage-portal
- Request: { return_url: string }
- Response: { portal_url: string }

GET /subscriptions/status
- Response: {
    is_premium: boolean,
    plan_type: string,
    features: string[],
    family_members: Member[],
    next_billing_date: timestamp,
    can_add_members: boolean
  }

POST /premium/ai-query
- Request: { 
    query: string,
    context: object,
    model_preference: 'fast' | 'advanced'
  }
- Response: {
    answer: string,
    model_used: string,
    follow_up_suggestions: string[]
  }
- No rate limiting for premium users

POST /family/invite
- Request: { email: string, nickname: string }
- Response: { invite_id: string, status: 'sent' }

WebSocket: /sync/real-time
- Premium only endpoint
- Real-time transaction updates
- Instant categorization
- Live balance updates
```

#### 4. Frontend Architecture:
```
Premium Components:
- PremiumUpgrade
  ├── PricingComparison
  │   ├── FeatureTable
  │   └── PriceToggle (Monthly/Annual)
  ├── TestimonialCarousel
  └── UpgradeButton

- PremiumDashboard
  ├── UsageStats
  │   ├── AIQueryCount
  │   ├── SyncStatus
  │   └── FamilyActivity
  ├── AdvancedAnalytics
  │   ├── CashFlowProjection
  │   ├── SpendingHeatmap
  │   └── CustomReports
  └── FamilyManagement
      ├── MemberList
      ├── InviteForm
      └── PermissionSettings

- EnhancedAI
  ├── ModelSelector
  ├── ConversationHistory
  └── ExportChat
```

#### 5. Pricing Strategy Implementation:
```
Pricing Tiers:
- Monthly: $9.99 CAD
- Annual: $79.99 CAD (33% discount)
- Family add-on: +$2/member/month

Free Trial:
- 7-day trial with full features
- Credit card required
- Reminder 2 days before charge

Value Proposition Calculation:
- Unlimited AI vs 5 free = $30+ value
- Real-time sync = Save 30min/month
- Advanced analytics = Better decisions
- Family sharing = 4x value
```

#### 6. Premium Feature Implementations:

```
// Advanced Analytics Engine
class PremiumAnalytics {
  generateCashFlowProjection(transactions, income, months = 6) {
    const projection = [];
    const recurringExpenses = this.identifyRecurring(transactions);
    const seasonalPatterns = this.analyzeSeasonality(transactions);
    
    for (let i = 0; i < months; i++) {
      const month = this.projectMonth(
        income,
        recurringExpenses,
        seasonalPatterns,
        i
      );
      projection.push(month);
    }
    
    return {
      projection,
      confidence: this.calculateConfidence(transactions),
      insights: this.generateInsights(projection)
    };
  }
  
  generateSpendingHeatmap(transactions, year) {
    // Day-by-day spending intensity
    const heatmapData = {};
    
    transactions.forEach(t => {
      const date = t.date.toISOString().split('T')[0];
      heatmapData[date] = (heatmapData[date] || 0) + t.amount;
    });
    
    return {
      data: heatmapData,
      patterns: this.identifyPatterns(heatmapData),
      anomalies: this.detectAnomalies(heatmapData)
    };
  }
}

// Real-time Sync Manager
class RealTimeSyncManager {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
  }
  
  connect(authToken) {
    this.ws = new WebSocket(`wss://api.clarifi.app/sync/real-time`);
    
    this.ws.onopen = () => {
      this.authenticate(authToken);
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleRealtimeUpdate(data);
    };
    
    this.ws.onerror = this.handleError;
    this.ws.onclose = this.handleClose;
  }
  
  handleRealtimeUpdate(data) {
    switch (data.type) {
      case 'transaction':
        this.processNewTransaction(data.transaction);
        break;
      case 'balance_update':
        this.updateBalance(data.account, data.balance);
        break;
      case 'categorization':
        this.updateCategory(data.transaction_id, data.category);
        break;
    }
  }
}
```

#### 7. Family Account Management:
```
// Multi-tenant data isolation
class FamilyAccountManager {
  async addFamilyMember(subscriptionId, email, nickname) {
    // Create isolated data space
    const memberId = await this.createMember({
      subscription_id: subscriptionId,
      email,
      nickname,
      role: 'member'
    });
    
    // Set up data sharing rules
    await this.setupDataSharing(memberId, {
      share_transactions: false, // Privacy by default
      share_insights: true,
      share_goals: true
    });
    
    // Send invitation email
    await this.sendInvitation(email, memberId);
    
    return memberId;
  }
  
  async getAggregatedFamilyData(subscriptionId) {
    const members = await this.getFamilyMembers(subscriptionId);
    const aggregated = {
      total_members: members.length,
      combined_metrics: {},
      individual_progress: []
    };
    
    for (const member of members) {
      if (member.sharing_enabled) {
        const data = await this.getMemberData(member.id);
        this.aggregateData(aggregated, data);
      }
    }
    
    return aggregated;
  }
}
```

#### 8. Testing Strategy:
- Stripe webhook handling
- Subscription state transitions
- Feature flag toggling
- Family member permissions
- Premium API rate limits
- Downgrade data retention

#### 9. Key Non-Functional Requirements:
- Payment processing 99.9% uptime
- Real-time sync <100ms latency
- Support 10,000+ premium users
- Seamless upgrade/downgrade
- GDPR compliant data handling

#### 10. Revenue Projections:
```
Assumptions:
- 100,000 free users by Year 2
- 7% conversion to premium
- 20% annual vs monthly
- 15% use family add-on
- 5% monthly churn

Revenue Calculation:
- Premium users: 7,000
- Monthly subscribers: 5,600 × $9.99 = $55,944
- Annual subscribers: 1,400 × $79.99/12 = $9,332
- Family add-ons: 1,050 × $6 = $6,300
- Monthly Revenue: ~$71,576
- Annual Revenue: ~$859,000
```

#### 11. Cost Implications:
```
Additional Costs:
- Stripe fees: 2.9% + $0.30 = ~$25,000/year
- Premium LLM usage: ~$0.50/user/month = $42,000/year
- Real-time infrastructure: ~$500/month = $6,000/year
- Additional support: 1 FTE = $60,000/year
- Total: ~$133,000/year
- Gross Margin: ~84%
```

#### 12. Alternative Approaches Considered:
- **One-time purchase:** Poor recurring revenue
- **Usage-based pricing:** Too complex for users
- **Higher price point:** Reduced conversion
- **Freemium with ads:** Poor user experience

### Feature 12: Direct Bank Connection (Post-MVP)

**Feature Goal:** Integrate direct bank connections through Open Banking APIs to provide real-time transaction syncing and eliminate manual statement uploads, while managing the associated costs and security requirements.

**API Relationships:**
- Plaid API (primary for major banks)
- Flinks API (backup/Canadian focus)
- Internal sync orchestration service
- Webhook infrastructure for real-time updates

**Detailed Feature Requirements:**
- Support for all major Canadian banks
- Real-time transaction synchronization
- Historical data import (12+ months)
- Multi-account aggregation
- Secure credential management
- Automatic categorization enhancement
- Connection health monitoring
- Fallback to manual upload option

**Detailed Implementation Guide:**

#### 1. System Architecture Overview:
- **API Aggregation Layer:** Abstract Plaid/Flinks differences
- **Webhook Infrastructure:** Handle real-time updates
- **Security Vault:** Encrypted credential storage
- **Sync Orchestration:** Manage polling and updates
- **Data Reconciliation:** Merge automatic and manual data

#### 2. Database Schema Design:
```
Table: bank_connections
- id: UUID
- user_id: UUID
- provider: ENUM('plaid', 'flinks')
- provider_item_id: STRING
- institution_id: STRING
- institution_name: STRING
- status: ENUM('active', 'error', 'reauth_required', 'disconnected')
- last_sync: TIMESTAMP
- next_sync: TIMESTAMP
- error_code: STRING
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

Table: connected_accounts
- id: UUID
- connection_id: UUID (foreign key)
- provider_account_id: STRING
- account_type: ENUM('checking', 'savings', 'credit', 'loan')
- account_name: STRING
- account_number_last4: STRING
- current_balance: DECIMAL
- available_balance: DECIMAL
- currency: STRING
- is_active: BOOLEAN

Table: sync_logs
- id: UUID
- connection_id: UUID
- sync_type: ENUM('initial', 'update', 'webhook')
- status: ENUM('started', 'completed', 'failed')
- transactions_added: INTEGER
- transactions_updated: INTEGER
- error_details: JSONB
- started_at: TIMESTAMP
- completed_at: TIMESTAMP

Table: webhook_events
- id: UUID
- provider: STRING
- event_type: STRING
- item_id: STRING
- payload: JSONB
- processed: BOOLEAN
- processed_at: TIMESTAMP
- created_at: TIMESTAMP
```

#### 3. API Integration Layer:
```
// Unified banking interface
interface BankingProvider {
  createLinkToken(userId: string, options?: LinkOptions): Promise<string>;
  exchangeToken(publicToken: string): Promise<ExchangeResult>;
  getAccounts(itemId: string): Promise<Account[]>;
  getTransactions(itemId: string, startDate: Date, endDate: Date): Promise<Transaction[]>;
  handleWebhook(payload: any): Promise<WebhookResult>;
  refreshConnection(itemId: string): Promise<void>;
}

// Plaid implementation
class PlaidProvider implements BankingProvider {
  async createLinkToken(userId: string, options?: LinkOptions) {
    const response = await this.client.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'ClariFi',
      products: ['transactions'],
      country_codes: ['CA'],
      language: 'en',
      webhook: process.env.PLAID_WEBHOOK_URL,
      ...options
    });
    
    return response.data.link_token;
  }
  
  async getTransactions(itemId: string, startDate: Date, endDate: Date) {
    let transactions = [];
    let hasMore = true;
    let offset = 0;
    
    while (hasMore) {
      const response = await this.client.transactionsGet({
        access_token
        : this.getAccessToken(itemId),
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        count: 500,
        offset
      });
      
      transactions = transactions.concat(response.data.transactions);
      hasMore = response.data.total_transactions > transactions.length;
      offset = transactions.length;
    }
    
    return this.normalizeTransactions(transactions);
  }
  
  async handleWebhook(payload: any) {
    const { webhook_type, item_id, error } = payload;
    
    switch (webhook_type) {
      case 'TRANSACTIONS':
        return this.handleTransactionWebhook(payload);
      case 'ITEM':
        return this.handleItemWebhook(payload);
      case 'ERROR':
        return this.handleErrorWebhook(payload);
      default:
        throw new Error(`Unknown webhook type: ${webhook_type}`);
    }
  }
}

// Provider factory
class BankingProviderFactory {
  static create(provider: string): BankingProvider {
    switch (provider) {
      case 'plaid':
        return new PlaidProvider();
      case 'flinks':
        return new FlinksProvider();
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}
```

#### 4. Sync Orchestration Service:
```
class SyncOrchestrator {
  async performInitialSync(connectionId: string) {
    const connection = await this.getConnection(connectionId);
    const provider = BankingProviderFactory.create(connection.provider);
    
    try {
      // Step 1: Get all accounts
      const accounts = await provider.getAccounts(connection.provider_item_id);
      await this.saveAccounts(connectionId, accounts);
      
      // Step 2: Get historical transactions (12 months)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      
      const transactions = await provider.getTransactions(
        connection.provider_item_id,
        startDate,
        endDate
      );
      
      // Step 3: Process in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        await this.processTransactionBatch(connectionId, batch);
      }
      
      // Step 4: Update connection status
      await this.updateConnectionStatus(connectionId, 'active');
      
      // Step 5: Schedule next sync
      await this.scheduleNextSync(connectionId);
      
    } catch (error) {
      await this.handleSyncError(connectionId, error);
      throw error;
    }
  }
  
  async processTransactionBatch(connectionId: string, transactions: any[]) {
    const processed = [];
    
    for (const transaction of transactions) {
      // Check if transaction already exists
      const existing = await this.findExistingTransaction(transaction);
      
      if (!existing) {
        // Enhance with AI categorization
        const enhanced = await this.enhanceTransaction(transaction);
        processed.push(enhanced);
      }
    }
    
    // Bulk insert
    if (processed.length > 0) {
      await this.bulkInsertTransactions(processed);
    }
  }
  
  async enhanceTransaction(transaction: any) {
    // Use existing categorization engine
    const category = await this.categorizationEngine.categorize({
      description: transaction.name,
      amount: transaction.amount,
      merchant: transaction.merchant_name
    });
    
    return {
      ...transaction,
      category_id: category.id,
      is_recurring: this.detectRecurring(transaction),
      tags: this.generateTags(transaction)
    };
  }
}
```

#### 5. Security Implementation:
```
class BankConnectionSecurity {
  // Encrypt sensitive tokens
  async encryptAccessToken(token: string): Promise<string> {
    const key = await this.getDerivedKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(token, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }
  
  // Token rotation
  async rotateTokens(connectionId: string) {
    const connection = await this.getConnection(connectionId);
    const provider = BankingProviderFactory.create(connection.provider);
    
    try {
      const newTokens = await provider.refreshTokens(
        connection.encrypted_access_token
      );
      
      await this.updateTokens(connectionId, newTokens);
    } catch (error) {
      if (error.code === 'ITEM_LOGIN_REQUIRED') {
        await this.markForReauthentication(connectionId);
      }
      throw error;
    }
  }
  
  // Connection health monitoring
  async monitorConnectionHealth() {
    const connections = await this.getActiveConnections();
    
    for (const connection of connections) {
      try {
        await this.testConnection(connection);
      } catch (error) {
        await this.handleUnhealthyConnection(connection, error);
      }
    }
  }
}
```

#### 6. Frontend Connection Flow:
```
Component Architecture:
- BankConnectionFlow
  ├── ConnectionOptions
  │   ├── AutomaticConnection
  │   │   ├── BankSelector
  │   │   ├── PlaidLink
  │   │   └── ConnectionStatus
  │   └── ManualUpload (fallback)
  ├── ConnectedAccounts
  │   ├── AccountList
  │   ├── SyncStatus
  │   └── DisconnectOption
  └── ConnectionHealth
      ├── LastSyncTime
      ├── ErrorMessages
      └── ReauthPrompt

// Plaid Link integration
function PlaidLinkComponent({ onSuccess, onError }) {
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      exchangeToken(public_token).then(onSuccess);
    },
    onExit: (err, metadata) => {
      if (err) onError(err);
    }
  });
  
  return (
    <Button 
      onPress={open} 
      disabled={!ready}
      title="Connect Bank Account"
    />
  );
}
```

#### 7. Data Reconciliation:
```
class DataReconciliator {
  async reconcileTransactions(automaticTxns: Transaction[], manualTxns: Transaction[]) {
    const reconciled = [];
    const conflicts = [];
    
    // Create transaction fingerprints
    const autoFingerprints = new Map(
      automaticTxns.map(t => [this.createFingerprint(t), t])
    );
    
    for (const manualTxn of manualTxns) {
      const fingerprint = this.createFingerprint(manualTxn);
      const autoTxn = autoFingerprints.get(fingerprint);
      
      if (autoTxn) {
        // Merge, preferring automatic data but keeping manual categories
        reconciled.push({
          ...autoTxn,
          category_id: manualTxn.user_verified ? manualTxn.category_id : autoTxn.category_id,
          notes: manualTxn.notes || autoTxn.notes
        });
        autoFingerprints.delete(fingerprint);
      } else {
        // Manual-only transaction
        reconciled.push({ ...manualTxn, source: 'manual' });
      }
    }
    
    // Add remaining automatic transactions
    for (const [_, autoTxn] of autoFingerprints) {
      reconciled.push({ ...autoTxn, source: 'automatic' });
    }
    
    return { reconciled, conflicts };
  }
  
  createFingerprint(transaction: Transaction): string {
    // Create unique identifier based on date, amount, and description
    const date = transaction.date.toISOString().split('T')[0];
    const amount = Math.abs(transaction.amount).toFixed(2);
    const description = transaction.description.toLowerCase().replace(/\s+/g, '');
    
    return crypto
      .createHash('sha256')
      .update(`${date}:${amount}:${description}`)
      .digest('hex');
  }
}
```

#### 8. Cost Management:
```
class ConnectionCostManager {
  // Track per-connection costs
  async trackConnectionCost(connectionId: string, action: string) {
    const costs = {
      'initial_connection': 0.50,
      'account_refresh': 0.10,
      'transaction_sync': 0.05,
      'webhook_event': 0.01
    };
    
    const cost = costs[action] || 0;
    
    await this.recordCost({
      connection_id: connectionId,
      action,
      cost,
      timestamp: new Date()
    });
  }
  
  // Optimize sync frequency based on activity
  calculateOptimalSyncFrequency(connection: Connection) {
    const recentActivity = this.getRecentTransactionCount(connection);
    
    if (recentActivity > 50) {
      return 'hourly';
    } else if (recentActivity > 10) {
      return 'daily';
    } else {
      return 'weekly';
    }
  }
  
  // Cost alerts
  async checkMonthlyCosts() {
    const currentCosts = await this.getCurrentMonthCosts();
    const projectedCosts = currentCosts * (30 / new Date().getDate());
    
    if (projectedCosts > this.monthlyBudget * 0.8) {
      await this.sendCostAlert(projectedCosts);
    }
  }
}
```

#### 9. User Experience Flow:
1. User selects "Connect Bank" option
2. Choose between automatic or manual
3. For automatic:
   - Select bank from list
   - Redirect to bank login (Plaid Link)
   - Authorize ClariFi access
   - Select accounts to sync
   - Initial sync begins
4. View sync progress
5. See enhanced categorization
6. Manage connections in settings

#### 10. Testing Strategy:
- Sandbox testing with Plaid/Flinks
- Connection failure scenarios
- Webhook reliability testing
- Data reconciliation accuracy
- Security penetration testing
- Cost tracking accuracy

#### 11. Key Non-Functional Requirements:
- Bank connections 99.5% uptime
- Initial sync <2 minutes for 1 year
- Webhook processing <5 seconds
- Support 50+ financial institutions
- SOC 2 compliance required

#### 12. Cost Implications:
```
Per-User Costs:
- Initial connection: $0.50
- Monthly maintenance: $0.30
- Average user: 2.5 accounts
- Monthly cost per user: ~$0.80

At scale (10,000 connections):
- Monthly API costs: $8,000
- Infrastructure: $1,000
- Total: $9,000/month
```

#### 13. Alternative Approaches Considered:
- **Screen scraping:** Legal/reliability issues
- **Manual CSV import:** Poor user experience
- **Bank partnerships:** Too slow for startup
- **Build own aggregation:** Too complex/expensive

### Feature 13: Business Features (Post-MVP)

**Feature Goal:** Expand ClariFi to support small business owners and freelancers with specialized features for business expense tracking, tax categorization, and financial reporting.

**API Relationships:**
- Enhanced OCR for receipts
- Business categorization API
- Tax category mapping service
- Export APIs for accounting software

**Detailed Feature Requirements:**
- Business profile creation
- HST/GST tracking
- Receipt scanning and storage
- Expense report generation
- Mileage tracking
- Invoice categorization
- QuickBooks/Wave export
- Multi-entity support
- Tax-ready reports

**Detailed Implementation Guide:**

#### 1. System Architecture Overview:
- **Multi-Entity Architecture:** Separate business/personal
- **Enhanced OCR Pipeline:** Receipt-specific processing
- **Tax Compliance Engine:** CRA category mapping
- **Document Management:** Secure receipt storage
- **Export Framework:** Multiple accounting formats

#### 2. Database Schema Design:
```
Table: business_profiles
- id: UUID
- user_id: UUID
- business_name: STRING
- business_number: STRING
- gst_number: STRING
- fiscal_year_end: DATE
- business_type: ENUM('sole_prop', 'corp', 'partnership')
- is_gst_registered: BOOLEAN
- created_at: TIMESTAMP

Table: business_transactions
- id: UUID
- business_id: UUID
- transaction_id: UUID (nullable, links to regular transaction)
- date: DATE
- description: TEXT
- amount: DECIMAL
- tax_amount: DECIMAL
- tax_type: ENUM('gst', 'hst', 'pst', 'none')
- category_id: INTEGER
- tax_category_id: INTEGER
- receipt_id: UUID (nullable)
- is_deductible: BOOLEAN
- notes: TEXT

Table: receipts
- id: UUID
- business_id: UUID
- file_url: STRING
- thumbnail_url: STRING
- vendor_name: STRING
- total_amount: DECIMAL
- tax_amount: DECIMAL
- date: DATE
- ocr_data: JSONB
- status: ENUM('processing', 'completed', 'failed')
- created_at: TIMESTAMP

Table: tax_categories
- id: INTEGER
- code: STRING (CRA code)
- name: STRING
- description: TEXT
- form_line: STRING
- is_income: BOOLEAN
- is_expense: BOOLEAN

Table: mileage_logs
- id: UUID
- business_id: UUID
- date: DATE
- start_location: STRING
- end_location: STRING
- distance_km: DECIMAL
- purpose: STRING
- is_business: BOOLEAN
- rate_per_km: DECIMAL
```

#### 3. Business OCR Enhancement:
```
class BusinessOCRProcessor {
  async processReceipt(imageData: Buffer) {
    // Step 1: Pre-process for receipts
    const enhanced = await this.enhanceReceiptImage(imageData);
    
    // Step 2: Extract text with layout preservation
    const ocrResult = await this.performOCR(enhanced, {
      preserve_layout: true,
      detect_tables: true,
      language: ['en', 'fr']
    });
    
    // Step 3: Parse receipt structure
    const parsed = this.parseReceiptStructure(ocrResult);
    
    // Step 4: Extract key fields
    const extracted = {
      vendor: this.extractVendor(parsed),
      date: this.extractDate(parsed),
      total: this.extractTotal(parsed),
      tax: this.extractTax(parsed),
      items: this.extractLineItems(parsed)
    };
    
    // Step 5: Validate and enhance
    return this.validateAndEnhance(extracted);
  }
  
  extractTax(parsed: ParsedReceipt) {
    const patterns = {
      gst: /GST|TPS.*?([\d.]+)/i,
      hst: /HST|TVH.*?([\d.]+)/i,
      pst: /PST|TVP.*?([\d.]+)/i,
      qst: /QST|TVQ.*?([\d.]+)/i
    };
    
    const taxes = {};
    
    for (const [type, pattern] of Object.entries(patterns)) {
      const match = parsed.text.match(pattern);
      if (match) {
        taxes[type] = parseFloat(match[1]);
      }
    }
    
    return taxes;
  }
}
```

#### 4. Tax Categorization Engine:
```
class TaxCategorizationEngine {
  categorizeForTax(transaction: BusinessTransaction) {
    // Map to CRA categories
    const mapping = {
      'meals_entertainment': {
        code: '8523',
        name: 'Meals and entertainment',
        deductible_percent: 50
      },
      'vehicle_expenses': {
        code: '9281',
        name: 'Motor vehicle expenses',
        deductible_percent: 100,
        requires_log: true
      },
      'home_office': {
        code: '9945',
        name: 'Business-use-of-home expenses',
        deductible_percent: 100,
        requires_calculation: true
      },
      'professional_fees': {
        code: '8860',
        name: 'Professional fees',
        deductible_percent: 100
      }
      // ... more mappings
    };
    
    const category = this.determineCategory(transaction);
    const taxCategory = mapping[category];
    
    return {
      ...taxCategory,
      deductible_amount: transaction.amount * (taxCategory.deductible_percent / 100),
      warnings: this.getWarnings(category, transaction)
    };
  }
  
  generateTaxReport(businessId: string, year: number) {
    const transactions = this.getYearTransactions(businessId, year);
    
    const report = {
      income: {},
      expenses: {},
      summary: {
        gross_income: 0,
        total_expenses: 0,
        net_income: 0,
        gst_collected: 0,
        gst_paid: 0,
        gst_owing: 0
      },
      forms: {
        t2125: this.generateT2125Data(transactions),
        gst_return: this.generateGSTReturn(transactions)
      }
    };
    
    // Group by tax category
    transactions.forEach(txn => {
      const category = txn.tax_category;
      if (category.is_expense) {
        report.expenses[category.code] = 
          (report.expenses[category.code] || 0) + txn.deductible_amount;
      } else {
        report.income[category.code] = 
          (report.income[category.code] || 0) + txn.amount;
      }
    });
    
    return report;
  }
}
```

#### 5. Multi-Entity Management:
```
class MultiEntityManager {
  async createBusinessEntity(userId: string, businessData: BusinessProfile) {
    // Create separate workspace
    const business = await this.createBusiness({
      ...businessData,
      user_id: userId
    });
    
    // Set up default categories
    await this.setupDefaultCategories(business.id);
    
    // Create sharing rules
    await this.createSharingRules(business.id, {
      personal_to_business: false,
      business_to_personal: false
    });
    
    return business;
  }
  
  async switchContext(userId: string, entityId: string) {
    const user = await this.getUser(userId);
    const entity = await this.getEntity(entityId);
    
    // Verify access
    if (!this.hasAccess(user, entity)) {
      throw new Error('Access denied');
    }
    
    // Update active context
    await this.updateActiveContext(userId, entityId);
    
    // Return entity-specific data
    return {
      entity,
      categories: await this.getCategories(entityId),
      recent_transactions: await this.getRecentTransactions(entityId),
      tax_settings: await this.getTaxSettings(entityId)
    };
  }
}
```

#### 6. Expense Report Generation:
```
class ExpenseReportGenerator {
  async generateReport(businessId: string, dateRange: DateRange, options: ReportOptions) {
    const transactions = await this.getTransactions(businessId, dateRange);
    const receipts = await this.getReceipts(transactions);
    
    const report = {
      metadata: {
        business_name: options.businessName,
        period: dateRange,
        generated_date: new Date(),
        total_expenses: 0,
        currency: 'CAD'
      },
      categories: {},
      transactions: [],
      receipts: []
    };
    
    // Group by category with subtotals
    for (const txn of transactions) {
      const category = txn.category.name;
      if (!report.categories[category]) {
        report.categories[category] = {
          total: 0,
          count: 0,
          transactions: []
        };
      }
      
      report.categories[category].total += txn.amount;
      report.categories[category].count += 1;
      report.categories[category].transactions.push(txn);
      report.total_expenses += txn.amount;
    }
    
    // Generate PDF or Excel based on options
    if (options.format === 'pdf') {
      return this.generatePDF(report, receipts);
    } else {
      return this.generateExcel(report);
    }
  }
}
```

#### 7. Frontend Business Components:
```
Business UI Components:
- BusinessDashboard
  ├── EntitySwitcher
  ├── BusinessMetrics
  │   ├── RevenueCard
  │   ├── ExpenseCard
  │   ├── TaxOwingCard
  │   └── ProfitCard
  ├── ReceiptCapture
  │   ├── CameraScanner
  │   ├── ReceiptPreview
  │   └── ExtractedData
  ├── ExpenseList
  │   ├── TransactionRow
  │   ├── ReceiptThumbnail
  │   └── TaxCategoryBadge
  └── ReportsSection
      ├── QuickReports
      ├── TaxReports
      └── ExportOptions

// Receipt capture flow
function ReceiptCapture({ onCapture }) {
  const [scanning, setScanning] = useState(false);
  const [extracted, setExtracted] = useState(null);
  
  const handleCapture = async (imageData) => {
    setScanning(true);
    
    try {
      // Upload and process
      const result = await processReceipt(imageData);
      setExtracted(result);
      
      // Allow user to verify/edit
      // Then save
    } catch (error) {
      showError('Failed to process receipt');
    } finally {
      setScanning(false);
    }
  };
  
  return (
    <View>
      <Camera onCapture={handleCapture} />
      {extracted && (
        <ExtractedDataForm
          data={extracted}
          onConfirm={onCapture}
          onEdit={setExtracted}
        />
      )}
    </View>
  );
}
```

#### 8. Mileage Tracking:
```
class MileageTracker {
  async logTrip(businessId: string, tripData: TripData) {
    // Calculate distance if not provided
    if (!tripData.distance && tripData.start_address && tripData.end_address) {
      tripData.distance = await this.calculateDistance(
        tripData.start_address,
        tripData.end_address
      );
    }
    
    // Apply current CRA rate
    const currentRate = this.getCurrentMileageRate(); // e.g., $0.68/km for 2024
    
    const mileageLog = {
      ...tripData,
      business_id: businessId,
      deductible_amount: tripData.distance * currentRate,
      rate_per_km: currentRate
    };
    
    await this.saveMileageLog(mileageLog);
    
    // Create corresponding expense transaction
    if (tripData.is_business) {
      await this.createMileageExpense(mileageLog);
    }
  }
  
  async generateMileageReport(businessId: string, year: number) {
    const logs = await this.getYearlyLogs(businessId, year);
    
    return {
      total_distance: logs.reduce((sum, log) => sum + log.distance, 0),
      business_distance: logs.filter(l => l.is_business).reduce((sum, log) => sum + log.distance, 0),
      personal_distance: logs.filter(l => !l.is_business).reduce((sum, log) => sum + log.distance, 0),
      total_deductible: logs.filter(l => l.is_business).reduce((sum, log) => sum + log.deductible_amount, 0),
      logs: logs.map(log => ({
        date: log.date,
        from: log.start_location,
        to: log.end_location,
        distance: log.distance,
        purpose: log.purpose,
        amount: log.deductible_amount
      }))
    };
  }
}
```

#### 9. Testing Strategy:
- Receipt OCR accuracy testing
- Tax calculation verification
- Multi-entity data isolation
- Export format validation
- CRA compliance checking

#### 10. Key Non-Functional Requirements:
- Receipt processing <10 seconds
- Support 10+ businesses per user
- 99% OCR accuracy for receipts
- Export compatible with major software
- Audit trail for all changes

#### 11. Cost Implications:
```
Additional Costs:
- Enhanced OCR: ~$0.02/receipt
- Document storage: ~$0.10/GB
- Average business: 100 receipts/month
- Per business cost: ~$2.50/month
- Target price: $19.99/month
- Margin: ~87%
```

#### 12. Alternative Approaches Considered:
- **Full accounting software:** Too complex for target users
- **Simple receipt storage:** Insufficient value
- **Bookkeeper integration:** Too expensive
- **AI-only categorization:** Compliance concerns

### Feature 14: Advanced AI Insights (Post-MVP)

**Feature Goal:** Leverage premium AI models to provide sophisticated financial analysis, predictive insights, and personalized recommendations that go beyond basic budgeting to deliver CFO-level intelligence for personal finances.

**API Relationships:**
- GPT-4/Claude Opus for complex analysis
- Voice processing APIs (Whisper)
- Advanced visualization libraries
- Real-time market data APIs

**Detailed Feature Requirements:**
- Predictive cash flow modeling
- Anomaly detection and alerts
- Natural language financial reports
- Voice-activated queries
- Scenario planning tools
- Investment opportunity identification
- Peer comparison insights
- Custom insight scheduling

**Detailed Implementation Guide:**

#### 1. System Architecture Overview:
- **Advanced AI Pipeline:** Multi-model approach
- **Voice Interface:** Natural conversation support
- **Predictive Engine:** ML-based forecasting
- **Insight Orchestrator:** Personalized delivery
- **Real-time Analysis:** Stream processing

#### 2. Database Schema Design:
```
Table: ai_insights
- id: UUID
- user_id: UUID
- insight_type: ENUM('prediction', 'anomaly', 'opportunity', 'trend', 'comparison')
- title: STRING
- description: TEXT
- confidence_score: FLOAT
- impact_amount: DECIMAL
- priority: INTEGER
- action_required: BOOLEAN
- expires_at: TIMESTAMP
- created_at: TIMESTAMP

Table: prediction_models
- id: UUID
- user_id: UUID
- model_type: ENUM('cash_flow', 'spending', 'income')
- parameters: JSONB
- accuracy_score: FLOAT
- last_trained: TIMESTAMP
- training_data_points: INTEGER

Table: voice_sessions
- id: UUID
- user_id: UUID
- audio_url: STRING
- transcript: TEXT
- query_intent: STRING
- response: TEXT
- duration_seconds: INTEGER
- model_used: STRING
- created_at: TIMESTAMP

Table: scenario_plans
- id: UUID
- user_id: UUID
- name: STRING
- base_scenario: JSONB
- variations: JSONB
- outcomes: JSONB
- created_at: TIMESTAMP

Table: peer_comparisons
- user_id: UUID
- demographic_group: STRING
- metric: STRING
- user_value: DECIMAL
- peer_median: DECIMAL
- peer_percentile: INTEGER
- updated_at: TIMESTAMP
```

#### 3. Advanced AI Analysis Engine:
```
class AdvancedAIEngine {
  async generateComprehensiveAnalysis(userId: string) {
    const userData = await this.aggregateUserData(userId);
    
    // Use GPT-4 for comprehensive analysis
    const prompt = this.buildAnalysisPrompt(userData);
    
    const analysis = await this.callGPT4({
      messages: [
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });
    
    // Parse and structure the response
    const structured = this.parseAnalysis(analysis);
    
    // Generate visualizations
    const visualizations = await this.generateVisualizations(structured);
    
    // Create actionable insights
    const insights = this.extractInsights(structured, userData);
    
    return {
      summary: structured.executive_summary,
      insights: insights,
      visualizations: visualizations,
      recommendations: structured.recommendations,
      confidence_scores: structured.confidence
    };
  }
  
  buildAnalysisPrompt(userData: UserFinancialData): string {
    return `Analyze the following financial data and provide CFO-level insights:
    
    Monthly Income: ${userData.avg_monthly_income}
    Monthly Expenses: ${userData.avg_monthly_expenses}
    Expense Categories: ${JSON.stringify(userData.expense_breakdown)}
    Savings Rate: ${userData.savings_rate}%
    Credit Utilization: ${userData.avg_utilization}%
    Recent Trends: ${JSON.stringify(userData.recent_trends)}
    
    Provide:
    1. Executive summary of financial health
    2. Key risks and opportunities
    3. Specific actionable recommendations
    4. 6-month financial forecast
    5. Comparison to similar demographics
    
    Format as structured JSON.`;
  }
}
```

#### 4. Predictive Modeling System:
```
class PredictiveFinanceModeler {
  async buildCashFlowModel(userId: string) {
    const historicalData = await this.getHistoricalData(userId, 24); // 24 months
    
    // Feature engineering
    const features = this.extractFeatures(historicalData);
    
    // Train multiple models
    const models = {
      arima: this.trainARIMA(features),
      lstm: this.trainLSTM(features),
      prophet: this.trainProphet(features),
      ensemble: null
    };
    
    // Ensemble for better accuracy
    models.ensemble = this.createEnsemble(models);
    
    // Generate predictions
    const predictions = this.generatePredictions(models.ensemble, 6); // 6 months
    
    // Calculate confidence intervals
    const intervals = this.calculateConfidenceIntervals(predictions);
    
    return {
      predictions,
      intervals,
      model_accuracy: this.validateModel(models.ensemble, historicalData),
      key_drivers: this.identifyKeyDrivers(features)
    };
  }
  
  async detectAnomalies(userId: string) {
    const recentTransactions = await this.getRecentTransactions(userId, 90);
    
    // Statistical anomaly detection
    const statistical = this.statisticalAnomalyDetection(recentTransactions);
    
    // Pattern-based detection
    const patterns = this.patternAnomalyDetection(recentTransactions);
    
    // AI-based detection
    const aiDetected = await this.aiAnomalyDetection(recentTransactions);
    
    // Combine and rank
    const anomalies = this.combineAnomalies(statistical, patterns, aiDetected);
    
    return anomalies.map(anomaly => ({
      transaction: anomaly.transaction,
      type: anomaly.type,
      severity: anomaly.severity,
      explanation: this.explainAnomaly(anomaly),
      suggested_action: this.suggestAction(anomaly)
    }));
  }
}
```

#### 5. Voice Interface Implementation:
```
class VoiceAssistant {
  async processVoiceQuery(audioData: Buffer) {
    // Step 1: Transcribe audio
    const transcript = await this.transcribeAudio(audioData);
    
    // Step 2: Extract intent and entities
    const intent = await this.extractIntent(transcript);
    
    // Step 3: Gather context
    const context = await this.gatherContext(intent.user_id);
    
    // Step 4: Generate response
    const response = await this.generateResponse(intent, context);
    
    // Step 5: Convert to speech (optional)
    const audioResponse = await this.textToSpeech(response.text);
    
    return {
      transcript,
      intent,
      response: response.text,
      audio: audioResponse,
      visualizations: response.visualizations
    };
  }
  
  async extractIntent(transcript: string) {
    const intents = {
      'spending_query': /how much.*spent|spending on|expenses for/i,
      'savings_query': /how much.*saved|savings|can I afford/i,
      'prediction_query': /will I|forecast|predict|future/i,
      'comparison_query': /compared to|versus|how do I stack/i,
      'advice_query': /should I|what should|recommend|advice/i
    };
    
    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(transcript)) {
        return {
          type: intent,
          entities: this.extractEntities(transcript, intent),
          confidence: 0.85
        };
      }
    }
    
    // Use AI for complex queries
    return this.aiIntentExtraction(transcript);
  }
  
  async generateResponse(intent: Intent, context: Context) {
    switch (intent.type) {
      case 'spending_query':
        return this.generateSpendingResponse(intent.entities, context);
      
      case 'prediction_query':
        const prediction = await this.generatePrediction(context);
        return {
          text: `Based on your current patterns, ${prediction.summary}`,
          visualizations: [prediction.chart]
        };
      
      case 'advice_query':
        const advice = await this.generatePersonalizedAdvice(context);
        return {
          text: advice.recommendation,
          visualizations: advice.supporting_data
        };
      
      default:
        return this.generateGeneralResponse(intent, context);
    }
  }
}
```

#### 6. Scenario Planning Tools:
```
class ScenarioPlanner {
  async createScenario(userId: string, parameters: ScenarioParameters) {
    const baseline = await this.getBaselineFinancials(userId);
    
    // Apply scenario changes
    const scenarios = {
      baseline: baseline,
      optimistic: this.applyChanges(baseline, parameters.optimistic),
      realistic: this.applyChanges(baseline, parameters.realistic),
      pessimistic: this.applyChanges(baseline, parameters.pessimistic)
    };
    
    // Run simulations
    const outcomes = {};
    for (const [name, scenario] of Object.entries(scenarios)) {
      outcomes[name] = await this.simulateScenario(scenario, 12); // 12 months
    }
    
    // Compare outcomes
    const comparison = this.compareOutcomes(outcomes);
    
    // Generate insights
    const insights = this.generateScenarioInsights(comparison);
    
    return {
      scenarios,
      outcomes,
      comparison,
      insights,
      recommendations: this.generateRecommendations(comparison)
    };
  }
  
  simulateScenario(scenario: Scenario, months: number) {
    const results = [];
    let current = { ...scenario.starting_position };
    
    for (let month = 0; month < months; month++) {
      // Apply income
      current.balance += scenario.monthly_income;
      
      // Apply expenses with variability
      const expenses = this.calculateMonthlyExpenses(scenario, month);
      current.balance -= expenses.total;
      
      // Apply interest/returns
      current.balance *= (1 + scenario.return_rate / 12);
      
      // Track metrics
      results.push({
        month,
        balance: current.balance,
        expenses: expenses,
        savings_rate: (scenario.monthly_income - expenses.total) / scenario.monthly_income,
        net_worth: current.balance + current.assets - current.liabilities
      });
      
      // Apply scenario-specific events
      this.applyEvents(current, scenario.events, month);
    }
    
    return results;
  }
}
```

#### 7. Peer Comparison Engine:
```
class PeerComparisonEngine {
  async generatePeerComparison(userId: string) {
    const userProfile = await this.getUserDemographics(userId);
    const userMetrics = await this.calculateUserMetrics(userId);
    
    // Find peer group
    const peerGroup = await this.findPeerGroup(userProfile);
    
    // Get anonymized peer metrics
    const peerMetrics = await this.getPeerMetrics(peerGroup);
    
    // Calculate percentiles
    const comparisons = {};
    for (const [metric, value] of Object.entries(userMetrics)) {
      comparisons[metric] = {
        user_value: value,
        peer_median: peerMetrics[metric].median,
        peer_p25: peerMetrics[metric].p25,
        peer_p75: peerMetrics[metric].p75,
        user_percentile: this.calculatePercentile(value, peerMetrics[metric].distribution),
        interpretation: this.interpretComparison(metric, value, peerMetrics[metric])
      };
    }
    
    // Generate insights
    const insights = this.generateComparisonInsights(comparisons);
    
    // Identify improvement opportunities
    const opportunities = this.identifyOpportunities(comparisons, peerMetrics);
    
    return {
      peer_group: peerGroup.description,
      comparisons,
      insights,
      opportunities,
      disclaimer: "Comparisons are based on anonymized data from similar users"
    };
  }
  
  interpretComparison(metric: string, userValue: number, peerData: PeerMetric) {
    const percentile = this.calculatePercentile(userValue, peerData.distribution);
    
    if (percentile >= 75) {
      return {
        rating: 'excellent',
        message: `You're in the top 25% for ${metric}`,
        color: 'green'
      };
    } else if (percentile >= 50) {
      return {
        rating: 'good',
        message: `You're above average for ${metric}`,
        color: 'blue'
      };
    } else if (percentile >= 25) {
      return {
        rating: 'fair',
        message: `You're below average for ${metric}`,
        color: 'yellow'
      };
    } else {
      return {
        rating: 'needs_improvement',
        message: `You're in the bottom 25% for ${metric}`,
        color: 'red',
        improvement_potential: peerData.median - userValue
      };
    }
  }
}
```

#### 8. Frontend Advanced AI Components:
```
Advanced AI UI:
- AIInsightsDashboard
  ├── InsightCards
  │   ├── PredictionCard
  │   ├── AnomalyAlert
  │   ├── OpportunityCard
  │   └── ComparisonCard
  ├── VoiceAssistant
  │   ├── VoiceButton
  │   ├── TranscriptDisplay
  │   └── ResponseVisualization
  ├── ScenarioPlanner
  │   ├── ParameterInputs
  │   ├── OutcomeChart
  │   └── RecommendationList
  └── DetailedReports
      ├── MonthlyAnalysis
      ├── QuarterlyReview
      └── AnnualSummary

// Voice assistant interface
function VoiceAssistant({ onResponse }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState(null);
  
  const startListening = async () => {
    setIsListening(true);
    
    try {
      const audio = await recordAudio();
      const result = await processVoiceQuery(audio);
      
      setTranscript(result.transcript);
      setResponse(result.response);
      onResponse(result);
      
      // Optional: Play audio response
      if (result.audio) {
        await playAudio(result.audio);
      }
    } catch (error) {
      showError('Voice processing failed');
    } finally {
      setIsListening(false);
    }
  };
  
  return (
    <View>
      <TouchableOpacity onPress={startListening} disabled={isListening}>
        <VoiceIcon pulsing={isListening} />
      </TouchableOpacity>
      
      {transcript && (
        <TranscriptBubble text={transcript} />
      )}
      
      {response && (
        <ResponseCard response={response} />
      )}
    </View>
  );
}
```

#### 9. Testing Strategy:
- AI response accuracy testing
- Prediction model validation
- Voice recognition accuracy
- Scenario simulation verification
- Performance testing with complex queries

#### 10. Key Non-Functional Requirements:
- AI response time <5 seconds
- Voice transcription accuracy >95%
- Prediction accuracy >80%
- Support complex 5-minute conversations
- Handle 1000+ concurrent AI requests

#### 11. Cost Implications:
```
Premium AI Costs:
- GPT-4: ~$0.03/1K tokens
- Average query: 2K tokens = $0.06
- Power user: 50 queries/month = $3
- Voice processing: $0.006/minute
- Average voice usage: 10 min/month = $0.06
- Total per user: ~$3.50/month
- Premium price: $19.99/month
- Margin: ~82%
```

#### 12. Alternative Approaches Considered:
- **Basic AI only:** Insufficient differentiation
- **Human advisors:** Too expensive to scale
- **Pre-computed insights:** Not personalized enough
- **Text-only interface:** Missing voice convenience

---

## Summary

This comprehensive technical specification document covers all features for ClariFi, both MVP and Post-MVP. The MVP features are designed with extreme cost-efficiency in mind, leveraging client-side processing, free tiers, and minimal backend infrastructure while still delivering a premium user experience. The Post-MVP features assume appropriate funding and can utilize more sophisticated infrastructure and services.

Key architectural decisions include:
- Client-heavy processing for MVP to minimize costs
- Aggressive caching and optimization for AI usage
- Progressive enhancement from MVP to premium features
- Privacy-first design with local data storage
- Scalable architecture that can grow with the business

The specifications provide detailed implementation guidance for each feature, ensuring that development teams have clear direction on technical requirements, user experience, and cost considerations.
         