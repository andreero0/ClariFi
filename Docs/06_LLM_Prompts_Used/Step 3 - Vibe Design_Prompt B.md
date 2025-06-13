<goal>
You are an industry-veteran mobile product designer. You’ve built high-touch UIs for FANG-style companies.

Your goal is to take the context below, the guidelines, and the user inspiration, and turn it into a functional UI design
</goal>

<inspirations>
The attached images serve as the user’s inspiration. You don’t need to take it literally in any way, but let it serve as an understanding of what the user likes aesthetically 
</inspirations>

<guidelines>
<aesthetics>
Bold simplicity with intuitive navigation creating frictionless experiences
Breathable whitespace complemented by strategic color accents for visual hierarchy
Strategic negative space calibrated for cognitive breathing room and content prioritization
Systematic color theory applied through subtle gradients and purposeful accent placement
Typography hierarchy utilizing weight variance and proportional scaling for information architecture
Visual density optimization balancing information availability with cognitive load management
Motion choreography implementing physics-based transitions for spatial continuity
Accessibility-driven contrast ratios paired with intuitive navigation patterns ensuring universal usability
Feedback responsiveness via state transitions communicating system status with minimal latency
Content-first layouts prioritizing user objectives over decorative elements for task efficiency
</aesthetics>

<practicalities>
This will be an iOS and Android app (ClariFi).
The design must strictly adhere to the **ClariFi Style Guide provided in the context below** for all colors, typography, spacing, and component styling.
The app should feel **trustworthy, clear, empowering, modern, and professional.**
While ClariFi should have a cohesive brand identity, the design should respect fundamental platform conventions (e.g., back navigation patterns, system dialogs, share sheets) for iOS and Android where it enhances native feel and usability, and where not otherwise specified by the ClariFi Style Guide.
</practicalities>
</guidelines>

<context>
<app-overview>
The AI-Powered Privacy-First Personal Finance App (Canada) is a mobile and web application designed to empower Canadians with intelligent financial management while prioritizing user control and data privacy. Users securely upload their bank and credit card statements (PDFs, CSVs, or images), and the app leverages AI (including OCR via AWS Textract and categorization via OpenAI GPT-3.5-turbo) to automatically extract transactions, categorize spending, track credit card utilization, and provide timely payment reminders. It offers essential budgeting tools, spending insights, and guidance on optimizing credit card usage, all without requiring direct linking to bank accounts, thus addressing key privacy concerns. The MVP focuses on English-speaking Canada and supports statements from major Canadian financial institutions, with a freemium model offering core features for free and advanced insights via a premium subscription.
</app-overview>

<task>
Your goal here is to go feature-by-feature and think like a designer. Here is a list of things you'd absolutely need to think about:

**User goals and tasks** - Understanding what users need to accomplish and designing to make those primary tasks seamless and efficient. 
**Information architecture** - Organizing content and features in a logical hierarchy that matches users' mental model.
**Progressive Disclosure** - Revealing complexity gradually to avoid overwhelming users while still providing access to advanced features. 
**Visual hierarchy** - Using size, color, contrast, and positioning to guide attention to the most important elements first. 
**Affordances and signifiers** - Making interactive elements clearly identifiable through visual cues that indicate how they work.
**Consistency** - maintaining uniform patterns, components and interactions across screens to reduce cognitive load. 
**Accessibility** - ensuring the design works for users of all abilities (color contrast, screen readers, keyboard navigations. 
**Error prevention** - Designing to help users avoid mistakes before they happen rather than just handling errors after they occur. 
**Feedback** - Providing clear signals when actions succeed or fail, and communicating system status at all times. 
**Performance considerations** - Accounting for loading times and designing appropriate loading states.
Mobile Vessels Desktop concentrations - Adapting layouts and interactions for different device capabilities and context. 
**Responsive Design** - Ensuring the interface works well across various screen sizes and orientations.
**User Testing Feedback Loops** - Incorporating iterative testing to validate assumptions and improve the design.
**Platform Conventions** - Following established patterns from iOS/Android/Web to meet user expectations.
**Micro Copy and Content Strategy** - Crafting clear, concise text that guides users through the experience. 
**Aesthetic Appeal** - Creating a visually pleasing design that aligns with brand identity by prioritizing usability. 
**Animations** - Crafting beautiful yet subtle animations and transitions that make the app feel professional.

I need you to take EACH FEATURE below, and give me a cohesive Design Brief. Here's how I want it formatted. You repeat this for each feature:

<format>
## Feature Name
### Screen X
##### Screen X State N
* description
* of
* UI & UX
* in detail
* including animations
* any anything else
* and colors based on the style-guide below
#### Screen X State N+1

Repeat for as many N+1 as needed based on the function of the state
</format>
</task>


<feature-list>

## Feature Specifications

### Feature 1: User Onboarding & Statement Import (MVP)

**Feature Goal:** Create a premium, frictionless onboarding experience that guides users through account setup and historical statement import while minimizing operational costs through client-side processing and intelligent resource usage.

**API Relationships:**
- Supabase Auth API for authentication
- Supabase Storage API for temporary file storage
- Internal Statement Processing API for async processing
- PostHog API for onboarding analytics

**Detailed Feature Requirements:**
- Support biometric authentication (Face ID/Touch ID) as primary login method
- Guide users through importing up to 6 months of historical statements
- Support major Canadian banks (TD, RBC, BMO, Scotia, CIBC, National Bank)
- Client-side image preprocessing to reduce file sizes before upload
- Asynchronous processing with progress tracking
- Automatic cleanup of processed files to maintain zero storage costs
- Graceful handling of free tier API limits

**Detailed Implementation Guide:**

#### 1. System Architecture Overview (for User Onboarding & Statement Import):
- **Client-Heavy Processing:** Image preprocessing, quality validation, and initial data extraction happen on-device
- **Minimal Backend Touch:** Backend only handles OCR coordination and final storage
- **Async Processing:** Redis queue manages statement processing jobs
- **Free Tier Optimization:** Designed to work within Supabase free tier limits (50K MAU, 1GB storage)

#### 2. Database Schema Design:
```
Table: users
- id: UUID (primary key, generated by Supabase Auth)
- email: VARCHAR(255) NOT NULL UNIQUE
- created_at: TIMESTAMP DEFAULT NOW()
- onboarding_completed: BOOLEAN DEFAULT FALSE
- preferred_language: VARCHAR(2) DEFAULT 'en'
- notification_preferences: JSONB

Table: onboarding_progress
- user_id: UUID (foreign key to users.id)
- step_completed: VARCHAR(50)
- completed_at: TIMESTAMP
- metadata: JSONB

Table: statement_imports
- id: UUID (primary key)
- user_id: UUID (foreign key to users.id)
- bank_name: VARCHAR(50)
- statement_date: DATE
- import_status: ENUM('pending', 'processing', 'completed', 'failed')
- created_at: TIMESTAMP DEFAULT NOW()
- processed_at: TIMESTAMP
- error_message: TEXT

Indexes:
- users.email (unique)
- statement_imports.user_id
- statement_imports.import_status
```

#### 3. Comprehensive API Design:
```
POST /auth/register
- Request: { email, password, biometric_enabled }
- Response: { user_id, auth_token, onboarding_step }
- Rate limit: 5 requests per IP per hour

POST /auth/biometric-login
- Request: { user_id, biometric_token }
- Response: { auth_token, user_data }

POST /statements/prepare-upload
- Request: { bank_name, statement_date, file_size }
- Response: { upload_url, import_id, preprocessing_requirements }
- Validates file size < 5MB after preprocessing

POST /statements/confirm-upload
- Request: { import_id, file_key }
- Response: { processing_status, estimated_time }
- Triggers async processing job

GET /statements/import-status/:import_id
- Response: { status, progress_percentage, errors }
- Polling endpoint for progress tracking
```

#### 4. Frontend Architecture:
```
Component Hierarchy:
- OnboardingNavigator
  ├── WelcomeScreen
  │   └── BiometricEnrollment
  ├── BankSelectionScreen
  │   └── BankCard (reusable)
  ├── StatementImportScreen
  │   ├── DocumentScanner
  │   ├── ImagePreprocessor
  │   └── UploadProgress
  └── OnboardingComplete

State Management:
- Local state for UI flow
- AsyncStorage for progress persistence
- Context for onboarding data
```

#### 5. Detailed CRUD Operations:
- **Create:** User registration with email/password, biometric enrollment
- **Read:** Retrieve onboarding progress, import history
- **Update:** Update onboarding step completion, user preferences
- **Delete:** Soft delete for compliance, automatic file cleanup after processing

#### 6. User Experience Flow:
1. Welcome screen with value proposition
2. Email/password registration or login
3. Biometric authentication setup prompt
4. Bank selection from supported list
5. Statement import instructions with visual guide
6. Camera/gallery selection for document capture
7. Client-side image quality check and optimization
8. Upload progress with time estimate
9. Success confirmation with next steps

#### 7. Security Considerations:
- Biometric data never leaves device (iOS/Android secure enclave)
- JWT tokens with 1-hour expiry for session management
- File upload URLs are pre-signed and expire in 10 minutes
- Automatic file deletion after processing (within 1 hour)
- Email verification required before full access

#### 8. Testing Strategy:
- Unit tests for image preprocessing algorithms
- Integration tests for auth flow with Supabase
- E2E tests covering full onboarding journey
- Performance tests for image optimization (target <2s for 10MB image)
- Mock different bank statement formats for OCR testing

#### 9. Data Management:
- Files stored temporarily (max 1 hour) in Supabase Storage
- Processed data moved to PostgreSQL immediately
- No long-term file storage to avoid costs
- Client-side caching of onboarding progress

#### 10. Error Handling & Logging:
- Client-side error boundaries for graceful failures
- Structured logging: `{timestamp, user_id, action, error_code, details}`
- OCR failure fallback to manual entry option
- Network retry logic with exponential backoff

#### 11. Key Non-Functional Requirements:
- Onboarding completion rate > 80%
- Average time to import first statement < 3 minutes
- Support offline progress saving
- Accessibility: VoiceOver/TalkBack support
- Works on devices with 2GB RAM

#### 12. Simplified Data Flow:
1. User captures statement image → 
2. Client preprocesses (resize, enhance) → 
3. Upload to temporary storage → 
4. Backend queues OCR job → 
5. Process and extract data → 
6. Store in PostgreSQL → 
7. Delete temporary file → 
8. Notify client of completion

#### 13. Cost Implications & Optimization:
- **Key Cost Drivers:** Storage (minimized via immediate deletion), Auth API calls
- **Optimizations:** 
  - Client-side image compression (reduce by 80%)
  - Batch multiple pages into single OCR call
  - Cache bank templates to improve extraction
  - Progressive JPEG uploads

#### 14. Key Dependencies & Assumptions:
- Assumes users have smartphone cameras capable of 5MP+
- Depends on Supabase Auth remaining free for 50K MAU
- Assumes bank statement formats remain relatively stable
- Requires reliable internet for upload (no offline processing)

#### 15. Alternative Approaches Considered:
- **Direct bank API integration:** Rejected for MVP due to $0.30-0.50 per connection cost
- **Manual data entry:** Rejected as too friction-heavy for users
- **Email forwarding:** Considered but security concerns and email parsing complexity

### Feature 2: AI-Powered Data Extraction & Categorization (MVP)

**Feature Goal:** Implement an ultra-efficient OCR-to-LLM pipeline that accurately extracts and categorizes transaction data from bank statements while maintaining costs below $0.15 per user per month through aggressive caching and optimization.

**API Relationships:**
- Google Vision API for OCR (1000 free calls/month)
- Claude Haiku API for categorization ($0.25/1M tokens)
- Upstash Redis for merchant cache (free tier)
- Internal Statement Processing API

**Detailed Feature Requirements:**
- Extract transaction data from statement images with 95%+ accuracy
- Categorize transactions into predefined categories
- Build and maintain a merchant cache for repeated merchants
- Achieve 90%+ cache hit rate after first month
- Implement client-side pattern matching for common transactions
- Keep token usage under 100 per categorization
- Support user corrections that improve global cache

**Detailed Implementation Guide:**

#### 1. System Architecture Overview:
- **Three-Tier Processing:** OCR → Merchant Cache → LLM (only if cache miss)
- **Distributed Caching:** Client-side patterns + Redis merchant cache
- **Token Optimization:** Compressed prompts, minimal context
- **Fallback Mechanisms:** Pattern matching when API limits reached

#### 2. Database Schema Design:
```
Table: transactions
- id: UUID (primary key)
- user_id: UUID (foreign key)
- statement_import_id: UUID (foreign key)
- date: DATE NOT NULL
- description: TEXT NOT NULL
- amount: DECIMAL(10,2) NOT NULL
- category_id: INTEGER (foreign key)
- merchant_id: UUID (foreign key, nullable)
- is_recurring: BOOLEAN DEFAULT FALSE
- user_verified: BOOLEAN DEFAULT FALSE
- created_at: TIMESTAMP DEFAULT NOW()

Table: categories
- id: INTEGER (primary key)
- name: VARCHAR(50) NOT NULL
- icon: VARCHAR(50)
- color: VARCHAR(7)
- is_system: BOOLEAN DEFAULT TRUE

Table: merchants
- id: UUID (primary key)
- normalized_name: VARCHAR(100) NOT NULL UNIQUE
- display_name: VARCHAR(100) NOT NULL
- category_id: INTEGER (foreign key)
- patterns: JSONB
- confidence_score: FLOAT DEFAULT 0.0
- usage_count: INTEGER DEFAULT 0
- last_seen: TIMESTAMP

Table: merchant_aliases
- id: UUID (primary key)
- merchant_id: UUID (foreign key)
- alias: VARCHAR(200) NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()

Indexes:
- transactions.user_id
- transactions.date
- merchants.normalized_name (unique)
- merchant_aliases.alias
```

#### 3. Comprehensive API Design:
```
POST /process/extract-text
- Request: { file_key, page_number, preprocessing_done }
- Response: { raw_text, confidence_score, text_blocks }
- Internal only, called by processing queue

POST /process/categorize-transactions
- Request: { transactions: [{ description, amount, date }] }
- Response: { 
    categorized: [{ ...transaction, category, merchant, confidence }],
    cache_stats: { hit_rate, new_merchants }
  }
- Batches up to 50 transactions

POST /merchants/correct
- Request: { transaction_id, correct_category, correct_merchant }
- Response: { success, cache_updated, similar_updated_count }
- Updates global cache with user feedback

GET /categories
- Response: { system_categories, custom_categories }
- Cached client-side indefinitely
```

#### 4. Frontend Architecture:
```
Component Hierarchy:
- TransactionProcessor
  ├── OCRPreview
  │   └── TextBlockSelector
  ├── CategorizedList
  │   ├── TransactionItem
  │   └── CategoryBadge
  └── CorrectionModal
      └── CategoryPicker

Processing Pipeline (Client):
1. StatementImage → ImagePreprocessor
2. PreprocessedImage → OCRService
3. RawText → TransactionParser
4. ParsedTransactions → LocalPatternMatcher
5. UnmatchedTransactions → ServerCategorizer
6. CategorizedTransactions → LocalStorage
```

#### 5. Detailed CRUD Operations:
- **Create:** Store extracted transactions with categories
- **Read:** Retrieve categorized transactions, merchant mappings
- **Update:** User corrections update both local and global cache
- **Delete:** Remove transactions (soft delete for history)

#### 6. User Experience Flow:
1. Statement processing begins automatically after upload
2. Progress indicator shows extraction phases
3. Preview of extracted transactions appears
4. Categories shown with confidence indicators
5. One-tap correction for miscategorized items
6. Bulk actions for similar transactions
7. Manual add option for missed transactions

#### 7. Security Considerations:
- OCR processing in isolated queue workers
- Sanitize all extracted text to prevent injection
- Rate limit categorization API by user
- Merchant cache updates require authentication
- No PII in cache keys

#### 8. Testing Strategy:
- Unit tests for pattern matching algorithms
- Mock OCR responses for consistent testing
- Integration tests with real statement samples
- Cache hit rate monitoring
- A/B testing different prompt templates
- Measure categorization accuracy weekly

#### 9. Data Management:
- Merchant cache in Redis with 30-day TTL
- Client-side pattern cache synced weekly
- Transaction data retained indefinitely
- Aggregated corrections for cache improvement

#### 10. Error Handling & Logging:
```
Error Types:
- OCR_FAILURE: Fallback to manual entry
- LLM_TIMEOUT: Use pattern matching only
- CACHE_MISS: Log for analysis, proceed to LLM
- RATE_LIMIT: Queue for later, notify user
```

#### 11. Key Non-Functional Requirements:
- 95%+ extraction accuracy for supported banks
- <2 second categorization for 50 transactions
- 90%+ cache hit rate after month 1
- Graceful degradation when APIs unavailable
- Support for French transaction descriptions

#### 12. Simplified Data Flow:
1. OCR extracts text → 
2. Parse into transactions → 
3. Check merchant cache → 
4. (If miss) Check patterns → 
5. (If miss) Call LLM → 
6. Update caches → 
7. Return categorized data

#### 13. Cost Implications & Optimization:
- **Cost Breakdown per User/Month:**
  - OCR: ~2 statements × 3 pages = 6 calls = $0.006
  - LLM: ~200 transactions × 10% miss rate × 100 tokens = 2000 tokens = $0.0005
  - Redis: Negligible on free tier
  - **Total: ~$0.007 per user/month** (well under $0.15 target)

- **Optimization Strategies:**
  - Pre-process images to enhance OCR accuracy
  - Batch transactions in single LLM call
  - Use temperature=0 for consistent outputs
  - Build merchant patterns from corrections

#### 14. Key Dependencies & Assumptions:
- Google Vision API free tier remains at 1000 units
- Claude Haiku pricing remains stable
- Bank statement formats have extractable text
- 90% of merchants repeat month-to-month

#### 15. Alternative Approaches Considered:
- **Custom OCR model:** Too expensive to train and host
- **GPT-4 Vision:** 10x more expensive than OCR + Haiku
- **Rule-based only:** Insufficient accuracy for new merchants
- **No caching:** Would cost $1.50+ per user/month

### Feature 3: Instant Budget Dashboard & Insights (MVP)

**Feature Goal:** Deliver a beautiful, performant budget dashboard that operates entirely client-side with zero backend calls for viewing, providing instant insights through pre-computed data and local calculations.

**API Relationships:**
- No APIs for viewing (100% client-side)
- Initial data comes from transaction processing
- PostHog for anonymous analytics (optional)

**Detailed Feature Requirements:**
- Real-time budget calculations without network calls
- Smooth 60fps animations and transitions
- Offline-first with full functionality
- Export capabilities (PDF, CSV) generated client-side
- Monthly, weekly, and custom date range views
- Visual spending trends and category breakdowns
- Savings opportunities identification
- Less than 50KB data storage per month

**Detailed Implementation Guide:**

#### 1. System Architecture Overview:
- **Pure Client-Side Rendering:** All calculations in JavaScript
- **Pre-computed Insights:** Generated during import, stored locally
- **Optimized Data Structures:** Indexed for fast queries
- **Progressive Loading:** Prioritize current month data

#### 2. Database Schema Design (Local - AsyncStorage):
```
LocalDB Structure:
transactions_[YYYY_MM]: {
  items: Transaction[],
  summary: {
    total_income: number,
    total_expenses: number,
    by_category: { [category]: number },
    by_day: { [day]: number },
    top_merchants: MerchantSummary[],
    insights: Insight[]
  },
  version: number
}

budgets: {
  monthly: { [category]: number },
  alerts: BudgetAlert[],
  goals: SavingsGoal[]
}

Key Structures:
Transaction: {
  id, date, amount, category, merchant, 
  description, is_recurring, tags
}

Insight: {
  type: 'saving_opportunity' | 'unusual_spend' | 'trend',
  priority: 1-5,
  message: string,
  action_data: any
}
```

#### 3. Component Architecture:
```
Dashboard Components:
- DashboardContainer
  ├── MonthSelector
  ├── SummaryCards
  │   ├── IncomeCard
  │   ├── ExpenseCard
  │   └── SavingsCard
  ├── SpendingChart (Custom)
  │   ├── PieChart
  │   └── TrendLine
  ├── CategoryBreakdown
  │   └── CategoryRow
  ├── InsightsFeed
  │   └── InsightCard
  └── QuickActions
      ├── ExportButton
      └── DateRangeSelector

Custom Chart Implementation (no libraries):
- SVG-based for small size
- RequestAnimationFrame for smoothness
- Touch gestures for interaction
```

#### 4. Frontend Architecture:
```
State Management:
- useReducer for complex state
- useMemo for expensive calculations
- useCallback for event handlers
- Custom hooks for data access

Performance Optimizations:
- Virtual scrolling for transaction lists
- Lazy loading historical months
- Memoized calculations
- Debounced updates
```

#### 5. Detailed CRUD Operations:
- **Create:** Add manual transactions locally
- **Read:** Query transactions by date/category/amount
- **Update:** Edit transactions, update budgets
- **Delete:** Remove transactions with recalculation

#### 6. User Experience Flow:
1. Dashboard loads instantly with current month
2. Summary cards show key metrics with micro-animations
3. Swipe between months with smooth transitions
4. Tap categories for detailed breakdown
5. Pull-to-refresh gesture syncs calculations
6. Long-press for quick actions menu
7. Insights appear as dismissible cards

#### 7. Client-Side Calculations:
```
Core Calculations:
// Category spending
const categoryTotals = transactions.reduce((acc, t) => {
  acc[t.category] = (acc[t.category] || 0) + t.amount;
  return acc;
}, {});

// Savings rate
const savingsRate = (income - expenses) / income * 100;

// Trend analysis (30-day moving average)
const trend = calculateMovingAverage(dailyTotals, 30);

// Budget variance
const variance = budgetAmount - actualSpent;
const percentUsed = (actualSpent / budgetAmount) * 100;

// Unusual spending detection
const avgSpending = getHistoricalAverage(category);
const isUnusual = currentSpending > avgSpending * 1.5;
```

#### 8. Testing Strategy:
- Unit tests for all calculations
- Visual regression tests for charts
- Performance benchmarks (render time)
- Offline functionality tests
- Export accuracy verification
- Memory usage monitoring

#### 9. Data Management:
- Maximum 6 months stored locally
- Automatic cleanup of old data
- Compressed storage format
- Background index rebuilding
- Export includes all historical data

#### 10. Error Handling & Logging:
- Graceful handling of corrupted local data
- Calculation fallbacks for edge cases
- Silent error recovery with user notification
- Performance metrics logged to PostHog

#### 11. Key Non-Functional Requirements:
- Initial render < 100ms
- Smooth 60fps scrolling
- Works offline 100%
- Supports 10,000+ transactions
- Accessible with screen readers
- RTL language support ready

#### 12. Simplified Data Flow:
1. Transaction data stored locally →
2. Background calculation of summaries →
3. Indexed for fast retrieval →
4. UI requests specific view →
5. Memoized calculations →
6. Render optimized components

#### 13. Cost Implications & Optimization:
- **Zero runtime costs** (all client-side)
- No server infrastructure needed
- No API calls for viewing
- Optional PostHog on free tier
- Export generation uses device resources

#### 14. Key Dependencies & Assumptions:
- Device has 50MB+ available storage
- Modern JavaScript engine (ES2015+)
- Hardware acceleration available
- Users rarely need 6+ months history
- AsyncStorage performance adequate

#### 15. Alternative Approaches Considered:
- **Server-side dashboards:** Rejected due to costs
- **Third-party charting libraries:** Too large (100KB+)
- **WebView dashboards:** Poor performance
- **Real-time sync:** Unnecessary for MVP

### Feature 4: Credit Card Setup & Utilization Tracking (MVP)

**Feature Goal:** Enable users to manage multiple credit cards with sophisticated utilization tracking and optimization recommendations, all computed locally without any backend infrastructure costs.

**API Relationships:**
- No API calls for card management (100% local)
- Optional PostHog events for usage analytics

**Detailed Feature Requirements:**
- Support unlimited credit cards locally
- Accurate statement date calculations
- Real-time utilization percentages
- Visual utilization indicators
- Payment due date tracking
- Multi-card optimization strategies
- Export optimization plans
- Zero backend storage or processing

**Detailed Implementation Guide:**

#### 1. System Architecture Overview:
- **Local-First Design:** All card data in AsyncStorage
- **Client-Side Date Math:** Complex date calculations in JS
- **Predictive Algorithms:** Pattern-based payment suggestions
- **Visual Feedback:** Real-time gauge animations

#### 2. Database Schema Design (Local Storage):
```
credit_cards: {
  cards: [
    {
      id: string (UUID),
      nickname: string,
      last_four: string,
      credit_limit: number,
      statement_day: number (1-31),
      payment_due_days: number (days after statement),
      apr: number,
      bank: string,
      color: string (for UI),
      is_active: boolean,
      created_at: timestamp,
      current_balance: number,
      last_statement_balance: number,
      last_payment: {
        amount: number,
        date: timestamp
      }
    }
  ],
  utilization_history: {
    [card_id]: {
      [YYYY_MM_DD]: {
        balance: number,
        utilization: number,
        was_statement_date: boolean
      }
    }
  }
}

utilization_settings: {
  target_utilization: number (default 30),
  alert_threshold: number (default 70),
  optimization_strategy: 'minimize_interest' | 'maximize_score',
  notification_days_before: number (default 3)
}
```

#### 3. Component Architecture:
```
Card Management UI:
- CardsScreen
  ├── CardsList
  │   ├── CreditCardItem
  │   │   ├── UtilizationGauge
  │   │   ├── BalanceDisplay
  │   │   └── QuickActions
  │   └── AddCardButton
  ├── UtilizationSummary
  │   ├── TotalUtilization
  │   └── OptimizationScore
  └── PaymentCalendar
      └── PaymentReminderItem

Utilization Components:
- UtilizationGauge (animated SVG)
- PaymentOptimizer
- StatementDateCalculator
- MultiCardStrategy
```

#### 4. Frontend Architecture:
```
Key Algorithms:

// Statement date calculation
function getNextStatementDate(card) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  let statementDate = new Date(currentYear, currentMonth, card.statement_day);
  
  // Handle month-end edge cases
  if (card.statement_day > daysInMonth(currentMonth)) {
    statementDate = new Date(currentYear, currentMonth + 1, 0);
  }
  
  if (statementDate <= today) {
    statementDate.setMonth(statementDate.getMonth() + 1);
  }
  
  return statementDate;
}

// Utilization optimization
function optimizePayments(cards, availableFunds) {
  // Sort by optimization priority
  const sorted = cards.sort((a, b) => {
    if (strategy === 'minimize_interest') {
      return b.apr - a.apr;
    } else {
      return b.utilization - a.utilization;
    }
  });
  
  const payments = [];
  let remaining = availableFunds;
  
  for (const card of sorted) {
    const targetBalance = card.limit * 0.3;
    const paymentNeeded = card.balance - targetBalance;
    
    if (paymentNeeded > 0 && remaining > 0) {
      const payment = Math.min(paymentNeeded, remaining);
      payments.push({ card_id: card.id, amount: payment });
      remaining -= payment;
    }
  }
  
  return payments;
}
```

#### 5. Detailed CRUD Operations:
- **Create:** Add new card with validation
- **Read:** View cards, utilization history
- **Update:** Update balances, settings
- **Delete:** Remove card and history

#### 6. User Experience Flow:
1. Add card with simple form (limit, dates)
2. See instant utilization visualization
3. Swipe card for quick actions
4. View payment calendar
5. Get optimization suggestions
6. Set up local notifications
7. Track utilization trends over time

#### 7. Security Considerations:
- Only store last 4 digits of card
- No full card numbers ever
- Biometric lock for app access
- Local data encryption
- No network transmission of card data

#### 8. Testing Strategy:
- Date calculation edge cases
- Month-end scenarios
- Leap year handling
- Optimization algorithm accuracy
- Notification scheduling reliability
- UI performance with 20+ cards

#### 9. Data Management:
- 12 months utilization history
- Daily snapshots for active cards
- Automatic old data pruning
- Export full history option
- Import from CSV capability

#### 10. Error Handling & Logging:
- Invalid date handling
- Notification failure recovery
- Data migration on updates
- Graceful degradation

#### 11. Key Non-Functional Requirements:
- Support 50+ cards
- Calculate in <50ms
- Accurate to penny
- Battery efficient
- Notification reliability 95%+

#### 12. Simplified Data Flow:
1. User adds card details →
2. System calculates key dates →
3. Daily utilization tracking →
4. Pre-statement notifications →
5. Optimization calculations →
6. Visual feedback updates

#### 13. Cost Implications & Optimization:
- **Zero infrastructure costs**
- No backend needed
- Local notifications free
- All processing on-device
- No recurring expenses

#### 14. Key Dependencies & Assumptions:
- Local notification permission granted
- Accurate device date/time
- User updates balances regularly
- Statement dates are monthly
- 30% utilization target is standard

#### 15. Alternative Approaches Considered:
- **Server-side tracking:** Unnecessary costs
- **Bank API integration:** Too expensive for MVP
- **SMS reminders:** Cost and complexity
- **Push notifications:** Requires server

### Feature 5: Proactive Credit Utilization Alerts (MVP)

**Feature Goal:** Deliver timely credit utilization alerts using primarily local notification scheduling with minimal server backup, achieving 95%+ delivery reliability while maintaining near-zero operational costs.

**API Relationships:**
- Expo Local Notifications API (primary)
- Minimal server cron for backup (5% of notifications)
- PostHog for delivery analytics

**Detailed Feature Requirements:**
- Schedule notifications 3-7 days before statement dates
- Rich notifications with actionable information
- Smart timing based on user behavior
- Fallback server notifications for critical alerts
- Battery-optimized scheduling
- Support notification actions (pay now, snooze)
- Personalized notification content

**Detailed Implementation Guide:**

#### 1. System Architecture Overview:
- **Local-First Scheduling:** 95% handled by device
- **Server Backup:** Only for failed local delivery
- **Smart Timing:** ML-lite algorithm for optimal timing
- **Rich Content:** Actionable notifications with deep links

#### 2. Database Schema Design:
```
Local Storage:
notification_schedule: {
  scheduled: [
    {
      id: string,
      card_id: string,
      type: 'utilization_warning' | 'payment_due' | 'optimization',
      scheduled_for: timestamp,
      content: {
        title: string,
        body: string,
        data: any
      },
      local_notification_id: string,
      status: 'pending' | 'delivered' | 'interacted' | 'failed'
    }
  ],
  preferences: {
    enabled: boolean,
    quiet_hours: { start: hour, end: hour },
    preferred_time: hour,
    days_before_statement: number,
    min_utilization_for_alert: number
  },
  interaction_history: [
    {
      notification_id: string,
      timestamp: timestamp,
      action: 'opened' | 'dismissed' | 'action_taken',
      time_to_interaction: seconds
    }
  ]
}

Server Schema (minimal):
Table: notification_backup
- user_id: UUID
- card_identifier: string (hashed)
- notification_type: string
- scheduled_for: timestamp
- delivered: boolean
- created_at: timestamp
```

#### 3. Notification Architecture:
```
Scheduling System:
- LocalNotificationScheduler
  ├── UtilizationAlertScheduler
  ├── PaymentReminderScheduler
  └── OptimizationSuggestionScheduler

- ServerBackupScheduler
  ├── CriticalAlertDetector
  └── FailureRecovery

Content Generation:
- NotificationContentBuilder
  ├── PersonalizationEngine
  ├── ActionButtonBuilder
  └── DeepLinkGenerator
```

#### 4. Frontend Implementation:
```
// Intelligent scheduling algorithm
function scheduleUtilizationAlert(card, transactions) {
  const statementDate = getNextStatementDate(card);
  const currentUtilization = calculateUtilization(card, transactions);
  const projectedUtilization = projectUtilization(card, transactions, statementDate);
  
  if (projectedUtilization > preferences.min_utilization_for_alert) {
    const optimalTime = calculateOptimalTime(preferences, interactionHistory);
    const notificationDate = new Date(statementDate);
    notificationDate.setDate(notificationDate.getDate() - preferences.days_before);
    notificationDate.setHours(optimalTime);
    
    const content = buildNotificationContent(card, projectedUtilization);
    
    scheduleLocalNotification({
      content,
      trigger: notificationDate,
      identifier: `utilization_${card.id}_${statementDate}`
    });
  }
}

// Optimal timing calculation
function calculateOptimalTime(preferences, history) {
  if (history.length < 5) {
    return preferences.preferred_time || 18; // 6 PM default
  }
  
  const interactionTimes = history
    .filter(h => h.action === 'opened')
    .map(h => new Date(h.timestamp).getHours());
  
  // Simple clustering to find best time
  const hourCounts = interactionTimes.reduce((acc, hour) => {
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});
  
  const bestHour = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)[0][0];
  
  return parseInt(bestHour);
}
```

#### 5. Detailed CRUD Operations:
- **Create:** Schedule new notifications
- **Read:** View scheduled notifications
- **Update:** Reschedule or modify content
- **Delete:** Cancel scheduled notifications

#### 6. User Experience Flow:
1. Automatic scheduling on card setup
2. Notification appears at optimal time
3. Rich preview shows utilization gauge
4. Actions: "Pay Now" or "View Details"
5. Deep link to specific card
6. Quick payment input option
7. Confirmation and rescheduling

#### 7. Security Considerations:
- No sensitive data in notifications
- Use card nicknames only
- Encrypted local storage
- Server stores minimal data
- Hashed identifiers only

#### 8. Testing Strategy:
- Time zone handling tests
- Scheduling accuracy verification
- Delivery rate measurement
- Battery impact assessment
- Action handling tests
- Quiet hours compliance

#### 9. Data Management:
- 30-day notification history
- Automatic cleanup of delivered
- Export notification preferences
- Analytics on interaction rates

#### 10. Error Handling & Logging:
```
Error Scenarios:
- Permission denied: Prompt re-enable
- Scheduling failed: Server backup
- Time zone change: Reschedule all
- App killed: Recovery on launch
```

#### 11. Key Non-Functional Requirements:
- 95%+ local delivery rate
- <1% battery impact
- Zero cost for 95% of users
- 10-second interaction tracking
- Support 100+ scheduled notifications

#### 12. Simplified Data Flow:
1. Calculate notification needs →
2. Schedule locally (95%) →
3. Backup critical to server (5%) →
4. Deliver at optimal time →
5. Track interaction →
6. Optimize future timing

#### 13. Cost Implications & Optimization:
- **Local notifications:** Free
- **Server backup:** ~$5/month for cron
- **Push infrastructure:** Expo free tier
- **Per user cost:** <$0.001/month

#### 14. Key Dependencies & Assumptions:
- iOS/Android notification permission
- Expo notification service reliable
- Users don't disable notifications
- Local scheduling survives reboots
- Critical alerts are rare (5%)

#### 15. Alternative Approaches Considered:
- **Pure server notifications:** Too expensive
- **SMS alerts:** $0.01+ per message
- **Email only:** Poor open rates
- **In-app only:** Misses opportunity

### Feature 6: Multi-Card Optimization Advice (MVP)

**Feature Goal:** Provide sophisticated, instant credit optimization recommendations across multiple cards using pure client-side algorithms, helping users maximize credit scores and minimize interest without any backend processing.

**API Relationships:**
- No API calls (100% client-side computation)
- Optional PostHog for feature usage analytics

**Detailed Feature Requirements:**
- Real-time optimization calculations
- Visual payment distribution simulator
- Credit score impact projections
- Interest savings calculations
- Shareable optimization plans
- Educational explanations
- Support complex scenarios (balance transfers, etc.)

**Detailed Implementation Guide:**

#### 1. System Architecture Overview:
- **Pure JavaScript Algorithms:** All calculations client-side
- **Pre-computed Models:** Credit score impact formulas
- **Interactive Visualizations:** Real-time feedback
- **Educational Framework:** Explains reasoning

#### 2. Algorithm Design:
```
Core Optimization Engine:

class CreditOptimizer {
  optimizeUtilization(cards, availableFunds, strategy) {
    // Step 1: Calculate current state
    const currentState = this.calculateCurrentState(cards);
    
    // Step 2: Determine optimization targets
    const targets = this.calculateTargets(cards, strategy);
    
    // Step 3: Allocate payments
    const allocations = this.allocatePayments(
      cards, 
      availableFunds, 
      targets, 
      strategy
    );
    
    // Step 4: Project outcomes
    const projections = this.projectOutcomes(cards, allocations);
    
    return {
      allocations,
      projections,
      recommendations: this.generateRecommendations(projections)
    };
  }
  
  allocatePayments(cards, funds, targets, strategy) {
    if (strategy === 'avalanche') {
      // Pay highest APR first
      return this.avalancheMethod(cards, funds);
    } else if (strategy === 'snowball') {
      // Pay smallest balance first
      return this.snowballMethod(cards, funds);
    } else if (strategy === 'credit_score') {
      // Optimize for credit score
      return this.creditScoreMethod(cards, funds, targets);
    }
  }
  
  creditScoreMethod(cards, availableFunds, targets) {
    // Sort by impact on credit score
    const sorted = cards.sort((a, b) => {
      const impactA = this.calculateUtilizationImpact(a);
      const impactB = this.calculateUtilizationImpact(b);
      return impactB - impactA;
    });
    
    const allocations = [];
    let remaining = availableFunds;
    
    for (const card of sorted) {
      // Target 28% utilization for optimal score
      const targetBalance = card.limit * 0.28;
      const currentBalance = card.balance;
      
      if (currentBalance > targetBalance) {
        const needed = currentBalance - targetBalance;
        const allocation = Math.min(needed, remaining);
        
        if (allocation > 0) {
          allocations.push({
            card_id: card.id,
            amount: allocation,
            new_utilization: (currentBalance - allocation) / card.limit,
            score_impact: this.estimateScoreImpact(
              card.utilization,
              (currentBalance - allocation) / card.limit
            )
          });
          
          remaining -= allocation;
        }
      }
    }
    
    return allocations;
  }
  
  estimateScoreImpact(oldUtil, newUtil) {
    // Simplified FICO score impact model
    const getUtilizationScore = (util) => {
      if (util === 0) return 100;
      if (util <= 0.09) return 95;
      if (util <= 0.29) return 85;
      if (util <= 0.49) return 65;
      if (util <= 0.74) return 45;
      return 25;
    };
    
    const oldScore = getUtilizationScore(oldUtil);
    const newScore = getUtilizationScore(newUtil);
    
    // Utilization is ~30% of credit score
    return (newScore - oldScore) * 0.3;
  }
}
```

#### 3. Component Architecture:
```
Optimization UI:
- OptimizationScreen
  ├── CurrentStateCard
  │   ├── TotalUtilization
  │   └── ScoreEstimate
  ├── PaymentSimulator
  │   ├── AmountSlider
  │   ├── StrategySelector
  │   └── AllocationVisualizer
  ├── ProjectionCards
  │   ├── ScoreImpactCard
  │   ├── InterestSavingsCard
  │   └── TimelineCard
  └── ActionPlan
      ├── StepByStepGuide
      └── ShareButton
```

#### 4. Frontend Visualizations:
```
// Interactive allocation visualizer
function AllocationVisualizer({ cards, allocations }) {
  return (
    <View>
      {cards.map(card => {
        const allocation = allocations.find(a => a.card_id === card.id);
        const newBalance = card.balance - (allocation?.amount || 0);
        const newUtilization = newBalance / card.limit;
        
        return (
          <CardAllocation
            key={card.id}
            card={card}
            allocation={allocation}
            oldUtilization={card.utilization}
            newUtilization={newUtilization}
            animate={true}
          />
        );
      })}
    </View>
  );
}

// Animated utilization gauge
function UtilizationGauge({ current, projected }) {
  const animation = useSharedValue(current);
  
  useEffect(() => {
    animation.value = withSpring(projected, {
      damping: 15,
      stiffness: 150
    });
  }, [projected]);
  
  // SVG-based gauge with color transitions
  // Green (0-30%), Yellow (30-50%), Red (50%+)
}
```

#### 5. Educational Components:
```
Explanations:
- "Why 30% utilization?": FICO scoring explanation
- "Avalanche vs Snowball": Interactive comparison
- "Balance transfer calculator": When it makes sense
- "Credit age impact": Why not to close old cards
```

#### 6. User Experience Flow:
1. View current multi-card situation
2. Enter available payment amount
3. Choose optimization strategy
4. See real-time allocation preview
5. Adjust individual allocations
6. View projected outcomes
7. Save or share plan

#### 7. Testing Strategy:
- Algorithm accuracy verification
- Edge case handling (0% APR, etc.)
- Performance with 20+ cards
- Visualization smoothness
- Calculation precision

#### 8. Data Management:
- Save optimization history
- Track actual vs projected
- Export plans as PDF
- Import from spreadsheet

#### 9. Key Non-Functional Requirements:
- Calculate 20 cards in <100ms
- Smooth 60fps animations
- Accurate to penny
- Work fully offline
- Educational value high

#### 10. Simplified Data Flow:
1. Load current card states →
2. User inputs payment amount →
3. Select strategy →
4. Calculate optimal allocation →
5. Visualize impact →
6. Generate action plan

#### 11. Cost Implications & Optimization:
- **Zero runtime costs**
- All processing client-side
- No API dependencies
- Educational content bundled
- Sharing uses device capabilities

#### 12. Alternative Approaches Considered:
- **Server-side optimization:** Unnecessary cost
- **ML models:** Too complex for MVP
- **Financial advisor integration:** Too expensive
- **Simplified rules only:** Insufficient value

### Feature 7: Basic Newcomer Financial Education (MVP)

**Feature Goal:** Deliver high-quality, multilingual financial education content specifically tailored for newcomers to Canada, bundled with the app for offline access with zero recurring content delivery costs.

**API Relationships:**
- No APIs (content bundled with app)
- PostHog for engagement analytics
- Local progress tracking only

**Detailed Feature Requirements:**
- 3-4 comprehensive education modules
- Professional translations (French minimum)
- Interactive elements and quizzes
- Progress tracking and achievements
- Offline-first design
- Regular updates via app releases
- Culturally sensitive content
- Zero hosting costs

**Detailed Implementation Guide:**

#### 1. System Architecture Overview:
- **Bundled Content:** Markdown/JSON files in app
- **Local Rendering:** React Native Markdown
- **Progress Storage:** AsyncStorage
- **Update Mechanism:** App store updates

#### 2. Content Structure Design:
```
Educational Content Structure:
/assets/education/
├── modules/
│   ├── credit-basics/
│   │   ├── en/
│   │   │   ├── metadata.json
│   │   │   ├── 01-intro.md
│   │   │   ├── 02-credit-scores.md
│   │   │   ├── 03-building-credit.md
│   │   │   └── quiz.json
│   │   └── fr/
│   │       └── [same structure]
│   ├── budgeting-canada/
│   │   └── [structure]
│   ├── banking-system/
│   │   └── [structure]
│   └── tax-basics/
│       └── [structure]
└── shared/
    ├── glossary.json
    ├── resources.json
    └── images/

Module Metadata:
{
  "id": "credit-basics",
  "title": {
    "en": "Understanding Credit in Canada",
    "fr": "Comprendre le crédit au Canada"
  },
  "description": {...},
  "difficulty": "beginner",
  "duration_minutes": 15,
  "chapters": [...],
  "prerequisites": [],
  "learning_objectives": [...]
}
```

#### 3. Component Architecture:
```
Education Components:
- EducationHub
  ├── ModuleList
  │   ├── ModuleCard
  │   │   ├── ProgressIndicator
  │   │   └── CompletionBadge
  │   └── SuggestedNext
  ├── ModuleViewer
  │   ├── ChapterNavigation
  │   ├── ContentRenderer
  │   │   ├── MarkdownViewer
  │   │   ├── InteractiveElements
  │   │   └── MediaPlayer
  │   └── ProgressTracker
  └── QuizComponent
      ├── QuestionCard
      ├── AnswerOptions
      └── ResultsSummary

Interactive Elements:
- CreditScoreSimulator
- BudgetCalculator
- TaxEstimator
- Glossary Tooltips
```

#### 4. Local Data Schema:
```
education_progress: {
  user_stats: {
    modules_completed: number,
    total_time_minutes: number,
    last_accessed: timestamp,
    streak_days: number
  },
  module_progress: {
    [module_id]: {
      status: 'not_started' | 'in_progress' | 'completed',
      chapters_completed: string[],
      quiz_scores: {
        [attempt_number]: {
          score: number,
          date: timestamp,
          answers: object
        }
      },
      time_spent_minutes: number,
      last_position: {
        chapter: string,
        scroll_position: number
      }
    }
  },
  achievements: [
    {
      id: string,
      earned_date: timestamp,
      module_id: string
    }
  ]
}
```

#### 5. Content Delivery Implementation:
```
// Content loading system
class EducationContentManager {
  constructor() {
    this.contentCache = new Map();
    this.loadManifest();
  }
  
  async loadModule(moduleId, language) {
    const cacheKey = `${moduleId}_${language}`;
    
    if (this.contentCache.has(cacheKey)) {
      return this.contentCache.get(cacheKey);
    }
    
    try {
      // Load from bundled assets
      const metadata = require(`../assets/education/modules/${moduleId}/${language}/metadata.json`);
      const chapters = await Promise.all(
        metadata.chapters.map(chapter => 
          this.loadChapter(moduleId, language, chapter.id)
        )
      );
      
      const module = {
        ...metadata,
        chapters,
        quiz: require(`../assets/education/modules/${moduleId}/${language}/quiz.json`)
      };
      
      this.contentCache.set(cacheKey, module);
      return module;
    } catch (error) {
      // Fallback to English if translation missing
      if (language !== 'en') {
        return this.loadModule(moduleId, 'en');
      }
      throw error;
    }
  }
}

// Interactive component example
function CreditScoreSimulator() {
  const [score, setScore] = useState(650);
  const [factors, setFactors] = useState({
    payment_history: 100,
    utilization: 50,
    credit_age: 75,
    credit_mix: 80,
    new_credit: 90
  });
  
  const calculateScore = () => {
    // Simplified FICO calculation
    const weights = {
      payment_history: 0.35,
      utilization: 0.30,
      credit_age: 0.15,
      credit_mix: 0.10,
      new_credit: 0.10
    };
    
    const baseScore = 300;
    const maxScore = 850;
    const range = maxScore - baseScore;
    
    const weightedScore = Object.entries(factors).reduce(
      (sum, [factor, value]) => sum + (value * weights[factor]),
      0
    );
    
    return Math.round(baseScore + (range * weightedScore / 100));
  };
  
  // Interactive sliders to adjust factors
  // Real-time score updates
  // Educational tooltips
}
```

#### 6. User Experience Flow:
1. Education hub shows available modules
2. Personalized recommendations based on profile
3. Tap module to see overview and objectives
4. Start learning with bookmark support
5. Interactive elements enhance understanding
6. Complete quiz to test knowledge
7. Earn achievement and unlock next module

#### 7. Localization Strategy:
- Professional translation for all content
- Cultural adaptation (not just translation)
- Local financial examples
- Region-specific resources
- RTL support ready

#### 8. Testing Strategy:
- Content accuracy review by experts
- Translation quality assurance
- Interactive element functionality
- Progress tracking reliability
- Performance with all modules loaded

#### 9. Update Mechanism:
- Content updates via app releases
- Version checking for content
- Backwards compatibility
- Progress preservation during updates

#### 10. Key Non-Functional Requirements:
- Load any module in <500ms
- Support offline completely
- Accessible to screen readers
- Reading level appropriate
- Culturally sensitive

#### 11. Cost Implications & Optimization:
- **Zero hosting costs** (bundled)
- One-time translation cost
- No CDN or CMS needed
- Updates via app store (free)
- No runtime API costs

#### 12. Alternative Approaches Considered:
- **Dynamic content API:** Recurring costs
- **Video-heavy content:** App size concerns
- **External LMS:** Expensive and complex
- **Web-based content:** Requires internet

### Feature 8: AI-Powered Q&A (MVP - Cost-Capped)

**Feature Goal:** Implement an extremely cost-efficient conversational AI assistant that answers user financial questions while maintaining costs under $0.10 per user per month through aggressive caching and smart fallbacks.

**API Relationships:**
- Claude Haiku API for complex queries
- Redis cache via Upstash for response caching
- Local FAQ database for common questions

**Detailed Feature Requirements:**
- Handle 95% of queries via FAQ/cache
- Use LLM for remaining 5% of queries
- Hard limit of 3-5 AI queries per user per month
- Clear communication of limits
- Context-aware responses
- Multilingual support
- Cost tracking per query

**Detailed Implementation Guide:**

#### 1. System Architecture Overview:
- **Three-Tier System:** Local FAQ → Cached Responses → LLM
- **Token Optimization:** Minimal context, compressed prompts
- **Smart Routing:** Intent classification before LLM
- **Usage Limits:** Hard caps with clear user communication

#### 2. Query Processing Pipeline:
```
Query Flow:
1. User Input
   ↓
2. Local FAQ Matcher (Fuzzy Search)
   ↓ (95% match)
3. Return FAQ Answer
   OR ↓ (5% no match)
4. Check Redis Cache
   ↓ (Cache miss)
5. Check Monthly Limit
   ↓ (Under limit)
6. Prepare Minimal Context
   ↓
7. Call Claude Haiku
   ↓
8. Cache Response
   ↓
9. Return to User
```

#### 3. Database Schema:
```
Local FAQ Structure:
{
  faqs: [
    {
      id: string,
      question_patterns: string[], // Multiple phrasings
      answer: {
        en: string,
        fr: string
      },
      category: string,
      keywords: string[],
      follow_up_questions: string[]
    }
  ],
  categories: {
    credit_scores: { icon: string, priority: number },
    budgeting: { icon: string, priority: number },
    // ...
  }
}

Usage Tracking (Local):
{
  ai_usage: {
    current_month: {
      count: number,
      queries: [
        {
          timestamp: number,
          tokens_used: number,
          cached: boolean
        }
      ]
    },
    limit: number, // 3-5 per month
    reset_date: timestamp
  }
}

Redis Cache Structure:
key: "qa_cache:{hash(question)}"
value: {
  answer: string,
  confidence: number,
  timestamp: number,
  usage_count: number
}
ttl: 30 days
```

#### 4. Implementation Components:
```
// FAQ Matcher with fuzzy search
class FAQMatcher {
  constructor(faqs) {
    // Build search index
    this.index = this.buildSearchIndex(faqs);
    this.faqs = faqs;
  }
  
  findAnswer(query) {
    // Step 1: Normalize query
    const normalized = this.normalize(query);
    
    // Step 2: Extract keywords
    const keywords = this.extractKeywords(normalized);
    
    // Step 3: Find best matches
    const matches = this.searchIndex(keywords);
    
    // Step 4: Score matches
    const scored = matches.map(match => ({
      ...match,
      score: this.calculateSimilarity(normalized, match.patterns)
    }));
    
    // Step 5: Return if confidence > 80%
    const best = scored.sort((a, b) => b.score - a.score)[0];
    
    if (best && best.score > 0.8) {
      return {
        answer: best.answer,
        confidence: best.score,
        followUp: best.follow_up_questions
      };
    }
    
    return null;
  }
  
  calculateSimilarity(query, patterns) {
    // Use Levenshtein distance or similar
    // Return normalized score 0-1
  }
}

// LLM Query Handler
class LLMQueryHandler {
  constructor() {
    this.monthlyLimit = 5;
    this.costPerQuery = 0.02; // Estimated
  }
  
  async handleQuery(query, context) {
    // Check usage limit
    const usage = await this.getMonthlyUsage();
    if (usage.count >= this.monthlyLimit) {
      return {
        answer: "You've reached your monthly AI query limit. Your limit resets on " + usage.reset_date,
        limited: true
      };
    }
    
    // Prepare minimal context
    const prompt = this.buildPrompt(query, context);
    
    try {
      // Call Claude Haiku with minimal tokens
      const response = await this.callLLM(prompt);
      
      // Track usage
      await this.trackUsage(response.tokens);
      
      // Cache response
      await this.cacheResponse(query, response.answer);
      
      return {
        answer: response.answer,
        tokens_used: response.tokens,
        queries_remaining: this.monthlyLimit - usage.count - 1
      };
    } catch (error) {
      return {
        answer: "I couldn't process that question. Try rephrasing or check our FAQ.",
        error: true
      };
    }
  }
  
  buildPrompt(query, context) {
    // Ultra-compressed prompt
    return `You are ClariFi, a Canadian personal finance assistant. Answer concisely.

User context:
- Uses ${context.cardCount} credit cards
- Monthly spending: $${context.avgSpending}
- Location: Canada

Question: ${query}

Answer in 50 words or less:`;
  }
  
  async callLLM(prompt) {
    const response = await fetch('https://api.anthropic.com/v1/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2024-01-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku',
        prompt: prompt,
        max_tokens: 100,
        temperature: 0,
        stop_sequences: ['\n\n']
      })
    });
    
    const data = await response.json();
    return {
      answer: data.completion,
      tokens: data.usage.total_tokens
    };
  }
}
```

#### 5. Frontend Chat Interface:
```
Chat Components:
- ChatScreen
  ├── MessageList
  │   ├── UserMessage
  │   ├── AssistantMessage
  │   └── TypingIndicator
  ├── InputBar
  │   ├── TextInput
  │   ├── SendButton
  │   └── VoiceButton (future)
  ├── SuggestedQuestions
  └── UsageLimitIndicator

Message Types:
- Text responses
- Suggested actions
- Educational cards
- Limit warnings
```

#### 6. User Experience Flow:
1. Access chat via help button
2. See suggested questions
3. Type or tap question
4. Instant FAQ response (95%)
5. Or "Thinking..." for AI (5%)
6. Clear, concise answer
7. Follow-up suggestions

#### 7. Cost Control Mechanisms:
- Hard monthly limits enforced
- Token counting per query
- Cache similar questions
- FAQ coverage tracking
- Cost dashboard for admins

#### 8. Testing Strategy:
- FAQ coverage analysis
- Cache hit rate monitoring
- Token usage optimization
- Response quality sampling
- Limit enforcement testing

#### 9. Key Non-Functional Requirements:
- FAQ response <100ms
- AI response <3 seconds
- 95%+ FAQ coverage
- <$0.10/user/month
- Graceful limit handling

#### 10. Cost Implications & Optimization:
```
Cost Breakdown:
- Claude Haiku: $0.25/1M input, $1.25/1M output
- Average query: ~200 tokens total = $0.0003
- 5 queries/month = $0.0015
- With 5% needing AI = $0.10/user theoretical max
- With caching = <$0.02/user realistic
```

#### 11. Alternative Approaches Considered:
- **GPT-4:** Too expensive at 100x cost
- **Open source LLM:** Hosting costs too high
- **No AI:** Insufficient user value
- **Unlimited AI:** Unsustainable costs

### Feature 9: Monthly Cycle & Progress View (MVP)

**Feature Goal:** Create an engaging progress tracking system that motivates users through streaks, achievements, and insights, implemented entirely client-side with optional anonymous analytics.

**API Relationships:**
- No APIs for core functionality
- PostHog for anonymous analytics (free tier)
- Local notifications for milestones

**Detailed Feature Requirements:**
- Streak tracking for consistent usage
- Achievement system with badges
- Monthly financial progress visualization
- Savings milestone tracking
- Social sharing capabilities
- Motivational notifications
- Historical progress charts

**Detailed Implementation Guide:**

#### 1. System Architecture Overview:
- **100% Client-Side:** All tracking in AsyncStorage
- **Privacy-First:** No personal data to analytics
- **Gamification Engine:** Local achievement logic
- **Share Generation:** Client-side image creation

#### 2. Local Data Schema:
```
progress_tracking: {
  streaks: {
    current_streak: number,
    longest_streak: number,
    last_active_date: timestamp,
    streak_history: [
      { start_date, end_date, days }
    ]
  },
  
  achievements: {
    earned: [
      {
        id: string,
        type: 'budgeting' | 'credit' | 'savings' | 'education',
        earned_date: timestamp,
        metadata: object
      }
    ],
    progress: {
      [achievement_id]: {
        current_value: number,
        target_value: number,
        started_date: timestamp
      }
    }
  },
  
  monthly_stats: {
    [YYYY_MM]: {
      budget_adherence: number, // percentage
      utilization_average: number,
      savings_amount: number,
      categories_optimized: string[],
      insights_actioned: number,
      education_completed: string[]
    }
  },
  
  milestones: [
    {
      type: 'savings' | 'credit_score' | 'streak',
      value: number,
      achieved_date: timestamp,
      celebrated: boolean
    }
  ]
}

achievement_definitions: {
  first_budget: {
    id: 'first_budget',
    name: 'Budget Beginner',
    description: 'Created your first budget',
    icon: 'chart-pie',
    points: 10,
    criteria: { action: 'budget_created' }
  },
  utilization_master: {
    id: 'utilization_master',
    name: 'Utilization Master',
    description: 'Kept all cards under 30% for a month',
    icon: 'credit-card',
    points: 50,
    criteria: { 
      metric: 'utilization',
      condition: 'all_under',
      value: 30,
      duration: 'month'
    }
  },
  // ... more achievements
}
```

#### 3. Component Architecture:
```
Progress Components:
- ProgressDashboard
  ├── StreakCard
  │   ├── StreakCounter
  │   ├── CalendarHeatmap
  │   └── StreakStats
  ├── AchievementShowcase
  │   ├── RecentBadges
  │   ├── ProgressBars
  │   └── NextToEarn
  ├── MonthlyReport
  │   ├── SavingsChart
  │   ├── UtilizationTrend
  │   ├── CategoryInsights
  │   └── ShareButton
  └── MotivationalInsights
      ├── PersonalBest
      ├── Comparisons
      └── NextGoals

Gamification Elements:
- BadgeAnimation (Lottie-free)
- ProgressRing
- MilestoneConfetti
- ShareableCard
```

#### 4. Achievement Engine:
```
class AchievementEngine {
  checkAchievements(userActivity) {
    const newAchievements = [];
    
    for (const [id, definition] of Object.entries(achievementDefs)) {
      if (!this.hasAchievement(id)) {
        if (this.checkCriteria(definition.criteria, userActivity)) {
          newAchievements.push(this.awardAchievement(id));
        }
      }
    }
    
    return newAchievements;
  }
  
  checkCriteria(criteria, activity) {
    switch (criteria.type) {
      case 'action':
        return activity.actions.includes(criteria.action);
        
      case 'metric':
        return this.checkMetricCriteria(criteria, activity);
        
      case 'streak':
        return activity.streak >= criteria.days;
        
      case 'cumulative':
        return this.checkCumulativeCriteria(criteria, activity);
    }
  }
  
  generateShareableImage(achievement) {
    // Use React Native's snapshot API
    // Generate image with achievement details
    // Include app branding
    // Return base64 image
  }
}

// Streak tracking
class StreakTracker {
  updateStreak(lastActive, today) {
    const daysSince = this.daysBetween(lastActive, today);
    
    if (daysSince === 0) {
      // Already active today
      return { changed: false };
    } else if (daysSince === 1) {
      // Consecutive day
      return {
        changed: true,
        newStreak: this.currentStreak + 1,
        milestone: this.checkMilestone(this.currentStreak + 1)
      };
    } else {
      // Streak broken
      return {
        changed: true,
        newStreak: 1,
        previousStreak: this.currentStreak,
        broken: true
      };
    }
  }
  
  checkMilestone(days) {
    const milestones = [7, 30, 60, 100, 365];
    return milestones.includes(days) ? days : null;
  }
}
```

#### 5. Visualization Components:
```
// Calendar heatmap for activity
function ActivityHeatmap({ data, year, month }) {
  const getDayColor = (value) => {
    if (!value) return '#eee';
    if (value < 0.25) return '#c6e48b';
    if (value < 0.5) return '#7bc96f';
    if (value < 0.75) return '#239a3b';
    return '#196127';
  };
  
  // Render calendar grid with activity intensity
}

// Animated progress rings
function ProgressRing({ progress, size, strokeWidth }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <Svg width={size} height={size}>
      {/* Background circle */}
      {/* Animated progress circle */}
      {/* Center text */}
    </Svg>
  );
}
```

#### 6. User Experience Flow:
1. Dashboard shows current streak prominently
2. Recent achievements displayed with animation
3. Monthly progress summary available
4. Tap achievement for details and share
5. View historical trends
6. Set and track personal goals
7. Receive motivational notifications

#### 7. Notification Strategy:
- Streak reminders (local)
- Achievement unlocked alerts
- Milestone celebrations
- Monthly summary ready
- Motivational messages

#### 8. Testing Strategy:
- Streak calculation accuracy
- Achievement trigger reliability
- Share image generation
- Performance with year+ data
- Analytics event firing

#### 9. Key Non-Functional Requirements:
- Load progress in <200ms
- Support 5 years history
- Generate share image <2s
- Work completely offline
- Motivating not annoying

#### 10. Cost Implications & Optimization:
- **Zero infrastructure costs**
- PostHog free tier (1M events)
- Local notifications free
- Client-side sharing
- No server storage

#### 11. Alternative Approaches Considered:
- **Server-side tracking:** Unnecessary costs
- **Social features:** Privacy concerns
- **Complex gamification:** Distraction from finance
- **Public leaderboards:** Privacy issues

### Feature 10: Lean Support System (MVP)

**Feature Goal:** Provide effective user support through self-service resources and community channels while avoiding expensive helpdesk subscriptions, targeting 80%+ self-service resolution rate.

**API Relationships:**
- Email service for escalations (free tier)
- Discord API for community features
- PostHog for support analytics

**Detailed Feature Requirements:**
- Comprehensive in-app help center
- Contextual help tooltips
- Email-based support queue
- Auto-responders for common issues
- Community Discord integration
- Video tutorials (bundled)
- FAQ search functionality

**Detailed Implementation Guide:**

#### 1. System Architecture Overview:
- **Self-Service First:** 80% resolution without human help
- **Community Powered:** Discord for peer support
- **Email Fallback:** For complex issues only
- **Bundled Resources:** Videos and guides in-app

#### 2. Help Content Structure:
```
/assets/help/
├── articles/
│   ├── getting-started/
│   │   ├── metadata.json
│   │   ├── first-statement.md
│   │   ├── add-cards.md
│   │   └── understanding-dashboard.md
│   ├── troubleshooting/
│   │   ├── scan-issues.md
│   │   ├── sync-problems.md
│   │   └── notification-setup.md
│   ├── features/
│   │   └── [feature guides]
│   └── faq/
│       └── common-questions.json
├── videos/
│   ├── onboarding-tour.mp4
│   ├── add-statement.mp4
│   └── optimization-guide.mp4
└── tooltips/
    └── contextual-help.json

Help Article Structure:
{
  "id": "first-statement",
  "title": "Importing Your First Statement",
  "category": "getting-started",
  "tags": ["import", "statement", "scan"],
  "difficulty": "beginner",
  "related_articles": ["scan-issues", "bank-support"],
  "content": "markdown content...",
  "video_id": "add-statement",
  "last_updated": "2024-01-15"
}
```

#### 3. Component Architecture:
```
Support Components:
- HelpCenter
  ├── SearchBar
  │   ├── AutoComplete
  │   └── RecentSearches
  ├── CategoryGrid
  │   └── CategoryCard
  ├── ArticleViewer
  │   ├── ContentRenderer
  │   ├── RelatedArticles
  │   └── FeedbackWidget
  └── ContactOptions
      ├── EmailSupport
      └── CommunityLink

Contextual Help:
- TooltipProvider
  ├── HelpIcon
  ├── TooltipContent
  └── LearnMoreLink

Email Support:
- SupportTicket
  ├── IssueClassifier
  ├── AutoResponder
  └── TicketQueue
```

#### 4. Search Implementation:
```
class HelpSearchEngine {
  constructor(articles, faqs) {
    this.searchIndex = this.buildSearchIndex(articles, faqs);
  }
  
  search(query) {
    const normalized = this.normalizeQuery(query);
    const keywords = this.extractKeywords(normalized);
    
    // Search in multiple fields
    const results = this.searchIndex.search({
      query: keywords,
      fields: ['title', 'content', 'tags'],
      boost: {
        title: 2,
        tags: 1.5,
        content: 1
      }
    });
    
    // Add FAQ results
    const faqResults = this.searchFAQs(normalized);
    
    return {
      articles: results.slice(0, 5),
      faqs: faqResults.slice(0, 3),
      suggested: this.getSuggestedArticles(query)
    };
  }
  
  getSuggestedArticles(query) {
    // Context-aware suggestions
    const screen = getCurrentScreen();
    const userProgress = getUserProgress();
    
    return this.articles.filter(article => 
      article.contexts?.includes(screen) ||
      article.user_stage === userProgress.stage
    );
  }
}
```

#### 5. Email Support System:
```
// Minimal email support handler
class EmailSupportHandler {
  async handleSupportRequest(request) {
    const { email, subject, message, metadata } = request;
    
    // Step 1: Classify issue
    const classification = this.classifyIssue(subject, message);
    
    // Step 2: Check for auto-response
    if (classification.autoResponse) {
      await this.sendAutoResponse(email, classification);
      return { handled: true, ticketId: null };
    }
    
    // Step 3: Create ticket for manual review
    const ticketId = await this.createTicket({
      email,
      subject,
      message,
      classification,
      metadata,
      priority: this.calculatePriority(classification, metadata)
    });
    
    // Step 4: Send acknowledgment
    await this.sendAcknowledgment(email, ticketId);
    
    return { handled: false, ticketId };
  }
  
  classifyIssue(subject, message) {
    const patterns = {
      'password-reset': /password|reset|locked out|can't log in/i,
      'scan-problem': /scan|OCR|camera|blurry|can't import/i,
      'subscription': /premium|payment|billing|charge/i,
      'bug-report': /bug|error|crash|not working/i
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(subject + ' ' + message)) {
        return {
          type,
          autoResponse: this.autoResponses[type] !== undefined,
          confidence: 0.8
        };
      }
    }
    
    return { type: 'general', autoResponse: false };
  }
}
```

#### 6. Community Integration:
```
Discord Integration:
- Invite link in app
- Channel structure:
  - #welcome
  - #general-help  
  - #credit-tips
  - #newcomers
  - #feature-requests
  - #success-stories

Community Guidelines:
- Peer support encouraged
- No financial advice
- Privacy respected
- Moderator presence
```

#### 7. User Experience Flow:
1. Contextual help icons throughout app
2. Search help center for issue
3. View article with embedded video
4. If unresolved, contact options appear
5. Try community Discord first
6. Email support as last resort
7. Auto-response or ticket created

#### 8. Analytics & Improvement:
- Track search queries (anonymized)
- Article helpfulness ratings
- Time to resolution metrics
- Common unresolved issues
- Auto-response effectiveness

#### 9. Testing Strategy:
- Search relevance testing
- Auto-classifier accuracy
- Response time measurement
- Video playback performance
- Offline help availability

#### 10. Key Non-Functional Requirements:
- Search results in <200ms
- 80%+ self-service rate
- Email response <24 hours
- Videos under 2MB each
- Works offline for articles

#### 11. Cost Implications & Optimization:
```
Cost Breakdown:
- Email: Free tier (SendGrid/AWS SES)
- Discord: Free
- Helpdesk software: $0 (avoided)
- Human support: Founder time only
- Total: ~$0/month for <1000 users
```

#### 12. Alternative Approaches Considered:
- **Zendesk/Intercom:** $50+/month too expensive
- **Live chat:** Requires staffing
- **Phone support:** Not scalable
- **AI chatbot:** Redundant with FAQ

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


</feature-list>

<style-guide>

**Color Palette**

**Primary Colors**
* Clarity Blue - #2B5CE6 (Primary brand color for headers, primary buttons, and key interactive elements. Evokes trust, stability, and professionalism - the most recommended color for financial apps according to research)
* Midnight Ink - #1A1F36 (Primary text color providing excellent readability while being softer than pure black, creating a modern financial aesthetic)
* Pure White - #FFFFFF (Primary surface color for cards and content areas, maximizing clarity and creating breathing room essential for financial data)

**Secondary Colors**
* Sky Trust - #4B7BF5 (For secondary actions, hover states, and selected items. A lighter variation maintaining the trust association while adding visual hierarchy)
* Cloud Gray - #F7F9FC (For subtle backgrounds, alternating sections, and inactive states. Provides gentle contrast without visual noise)

**Accent Colors**
* Growth Green - #00C896 (For positive financial indicators, success states, and primary CTAs related to savings/credit improvement. Research shows green's strong association with wealth and prosperity)
* Wisdom Purple - #6B5DD3 (For premium features, educational content, and credit score displays. Conveys confidence and elevated service suitable for financial guidance)

**Functional Colors**
* Success - #00A76F (For confirmations, positive changes, goal achievements)
* Error - #E53E3E (For errors, warnings about high utilization, missed payments)
* Warning - #F6AD55 (For alerts, approaching limits, attention needed)
* Neutral Gray (Primary) - #4A5568 (For less emphasized body text)
* Neutral Gray (Secondary) - #718096 (For captions, timestamps, disabled states)
* Border/Divider - #E2E8F0 (For subtle divisions and input borders)

**Background Colors**
* App Background - #FAFBFD (Subtle blue-tinted gray for cohesive feel)
* Dark Mode - Primary Background: #0F1419
* Dark Mode - Surface Background: #1A202C

**Typography**

**Font Family**
* Primary Font: SF Pro Text (iOS) / Roboto (Android) with Inter as fallback for any web components

**Font Weights**
* Regular: 400
* Medium: 500
* Semibold: 600
* Bold: 700

**Text Styles**

**Headings**
* H1 (Screen Titles): 32dp font-size, 40dp line-height, Bold (700), -0.5dp letter-spacing, Midnight Ink color, used for main screen headers like "Dashboard" or "Credit Overview"
* H2 (Section Headers): 24dp font-size, 32dp line-height, Semibold (600), -0.25dp letter-spacing, Midnight Ink color, used for major sections like "This Month's Spending"
* H3 (Card Headers): 18dp font-size, 24dp line-height, Semibold (600), 0dp letter-spacing, Midnight Ink color, used for individual card titles

**Body Text**
* Body Large (Key Insights): 18dp font-size, 28dp line-height, Regular (400), 0dp letter-spacing, Midnight Ink color, used for important alerts and primary insights
* Body Regular (Standard Content): 16dp font-size, 24dp line-height, Regular (400), 0dp letter-spacing, Midnight Ink color, used for descriptions and general content
* Body Small (Supporting Info): 14dp font-size, 20dp line-height, Regular (400), 0dp letter-spacing, Neutral Gray (Primary) color, used for timestamps and secondary information

**Special Text**
* Caption (Helper Text): 12dp font-size, 16dp line-height, Regular (400), 0.25dp letter-spacing, Neutral Gray (Secondary) color, used for input hints and explanatory text
* Button Text: 16dp font-size, 20dp line-height, Medium (500), 0.5dp letter-spacing, color varies by button type, Sentence case
* Link Text: 16dp font-size, 24dp line-height, Regular (400), 0dp letter-spacing, Clarity Blue color, underline on interaction

**Component Styling**

**Buttons**

**Primary Button**
* Background: Clarity Blue (#2B5CE6)
* Text Color: Pure White (#FFFFFF)
* Height: 48dp (meeting accessibility guidelines)
* Corner Radius: 12dp (modern, approachable feel)
* Padding: 20dp horizontal, 14dp vertical
* Shadow: 0 2dp 8dp rgba(43, 92, 230, 0.2)
* States:
  * Default: Full opacity with subtle shadow
  * Hover/Pressed: Sky Trust (#4B7BF5) background, enhanced shadow
  * Disabled: 50% opacity, no shadow

**Secondary Button**
* Border: 2dp of Clarity Blue (#2B5CE6)
* Text Color: Clarity Blue (#2B5CE6)
* Background: Transparent
* Height: 48dp
* Corner Radius: 12dp
* Padding: 20dp horizontal, 14dp vertical
* States:
  * Default: Full opacity
  * Hover/Pressed: Cloud Gray (#F7F9FC) background fill
  * Disabled: 50% opacity on border and text

**Text Button / Link Button**
* Text Color: Clarity Blue (#2B5CE6)
* Height: 44dp minimum touch target
* Padding: 16dp horizontal, 10dp vertical
* States:
  * Default: No underline
  * Hover/Pressed: Underline appears, Sky Trust (#4B7BF5) color
  * Disabled: Neutral Gray (Secondary) color

**Cards**
* Background: Pure White (#FFFFFF)
* Shadow: 0 2dp 4dp rgba(0,0,0,0.06), 0 4dp 12dp rgba(0,0,0,0.04)
* Corner Radius: 16dp (friendly, modern appearance)
* Padding: 24dp
* Border: None (shadow provides sufficient elevation)

**Input Fields**
* Height: 52dp (comfortable for touch)
* Corner Radius: 12dp
* Padding: 16dp horizontal

* Default State:
  * Border: 1.5dp Border/Divider (#E2E8F0)
  * Background: Pure White (#FFFFFF)
  * Text Color: Midnight Ink (#1A1F36)
  * Placeholder Color: Neutral Gray (Secondary) (#718096)

* Focused State:
  * Border: 2dp Clarity Blue (#2B5CE6)
  * Background: Pure White (#FFFFFF)
  * Glow: 0 0 0 4dp rgba(43, 92, 230, 0.15)

* Error State:
  * Border: 2dp Error (#E53E3E)
  * Background: rgba(229, 62, 62, 0.04)
  * Helper text below in Error color

* Disabled State:
  * Border: 1dp Border/Divider (#E2E8F0)
  * Background: Cloud Gray (#F7F9FC)
  * Text Color: Neutral Gray (Secondary) (#718096)

**Icons**
* Icon Library: Lucide React Native (clean, consistent, financial-appropriate icons)
* General Size: 24dp x 24dp
* Small Size: 20dp (for inline use)
* Tab Bar Icons: 28dp (larger for primary navigation)
* Color (Interactive): Clarity Blue (#2B5CE6)
* Color (Non-Interactive): Neutral Gray (Secondary) (#718096)
* Color (On Primary Backgrounds): Pure White (#FFFFFF)
* Color (Success/Positive): Growth Green (#00C896)

**Spacing System**
* Base Unit: 8dp
* Scale & Usage:
  * 4dp (0.5x): Tight spacing between related icons and text
  * 8dp (1x): Default internal padding for small components
  * 12dp (1.5x): Spacing between form labels and inputs
  * 16dp (2x): Standard component padding, vertical spacing between cards
  * 24dp (3x): Section spacing, screen edge padding
  * 32dp (4x): Major section breaks, spacing around CTAs
  * 48dp (6x): Top padding for screens, spacing between major features

**Motion & Animation**
* General Principle: Enhance understanding and provide feedback without distraction. All animations should feel smooth and purposeful.
* Standard Transition Duration: 200-250ms
* Easing Curve: cubic-bezier(0.4, 0, 0.2, 1) for natural motion
* Microinteractions: 150ms (button press scale to 0.97, toggle switches)
* Page Transitions: Platform-native (iOS: slide, Android: fade-through) at 300ms
* Loading States: 
  * Skeleton screens for content areas with subtle shimmer
  * Small circular spinners (20dp) in Clarity Blue for inline loading
  * Linear progress bars for determinate operations (like statement processing)
* Number Animations: 400ms ease-out for financial figures updating

**Dark Mode Variants**
* App Background: #0F1419
* Surface/Card Background: #1A202C
* Primary Text: #F7FAFC
* Secondary Text: #A0AEC0
* Clarity Blue (Adjusted): #5B8AF8 (lighter for contrast)
* Growth Green (Adjusted): #48BB78
* Wisdom Purple (Adjusted): #9F7AEA
* Border/Divider: #2D3748
* Success: #48BB78
* Error: #FC8181
* Warning: #F6AD55

**Accessibility Considerations**
* **Color Contrast:** All color combinations meet WCAG 2.1 Level AA standards (4.5:1 for normal text, 3:1 for large text). The Clarity Blue on white provides 5.2:1 contrast ratio.
* **Touch Targets:** All interactive elements maintain minimum 44dp x 44dp touch targets, with primary actions at 48dp for enhanced usability.
* **Font Scalability:** System fonts support dynamic type scaling. Layouts use flexible constraints to accommodate text size preferences up to 200%.
* **Screen Reader Support:** All icons include descriptive labels. Interactive elements use semantic roles. Navigation structure follows logical hierarchy with proper heading levels.
* **Focus States:** 2dp Clarity Blue outline with 2dp offset for keyboard navigation. High contrast mode supported.
* **Error Handling:** Error messages appear both visually and are announced to screen readers. Form validation provides clear, actionable feedback.
* **Multilingual Support:** UI accommodates text expansion for translations (up to 30% longer). RTL language support built into layout system.

</style-guide>
</context>

<output>
Your output should be the cohesive Design Brief text itself, detailing the UI/UX for each screen and state of **ALL ClariFi features (MVP and Post-MVP) listed in the <feature-list> within the context**. For every UI element described (buttons, text, backgrounds, icons, etc.), explicitly reference and apply the relevant specifications (including colors with hex codes where appropriate, typography styles, spacing units, component states) from the **ClariFi Style Guide provided in the context**. The output should be formatted precisely according to the <format> example provided in the task (repeating the ## Feature Name, ### Screen X, ##### Screen X State N structure for every feature). Do not output HTML or CSS.
</output>
