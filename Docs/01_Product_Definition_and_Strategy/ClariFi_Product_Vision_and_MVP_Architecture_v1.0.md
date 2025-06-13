# ClariFi - Product Vision and MVP Architecture - v1.0

## 1. Product Vision

Empower every newcomer and credit user in Canada to achieve financial clarity, confidence, and control through AI-driven guidance that transforms complex financial data into actionable insights, enabling them to build strong credit, optimize spending, and navigate the Canadian financial system with ease.

## 2. Mission

To provide an AI-driven personal finance platform that simplifies budgeting from bank statements and optimizes credit card usage, helping users (especially newcomers) build better credit and financial habits. We democratize access to sophisticated financial guidance by leveraging cutting-edge AI technology to deliver personalized, multilingual support that bridges the gap between financial complexity and user understanding.

## 3. Target Audience

* **Primary:** Newcomers to Canada (recent immigrants and international students, 0-5 years in Canada, 20-45 years old)
    * *Pain Points:*
        * Limited Canadian credit history and unfamiliarity with credit scoring system
        * Difficulty understanding bank/credit card statements in English/French
        * Language barriers affecting financial literacy
        * Urgent need to build credit for housing, vehicles, and other necessities
        * Tight budgets due to entry-level income or newcomer expenses
        * Loss of financial confidence post-arrival (from 61% to 31%)

* **Secondary:** Young professionals in Canada (25-40 years old) with multiple credit cards
    * *Pain Points:*
        * Tracking spending across multiple cards and accounts
        * Optimizing credit utilization to maintain/improve credit scores
        * Information overload from multiple financial statements
        * Missing payment dates or optimal payment timing
        * Difficulty getting unified view of finances across institutions

## 4. Core Value Proposition

ClariFi uniquely combines AI-powered budgeting with proactive credit optimization in a single, user-friendly platform. Unlike competitors who focus on either budgeting (Mint, YNAB) or credit monitoring (Credit Karma, Borrowell), ClariFi delivers:

* **Unified Budgeting & Proactive Credit Optimization:** Seamlessly integrates expense tracking with statement-date credit utilization management
* **Newcomer-Centric Design:** Multilingual support, culturally-aware content, and tailored financial education for the Canadian context
* **Actionable AI-Powered Insights:** Transforms raw statement data into personalized guidance through efficient LLM integration
* **Card-Agnostic & User-Controlled:** Works with existing accounts without requiring bank logins or card switching
* **Statement-Date Intelligence:** Unique credit utilization alerts timed to billing cycles for maximum credit score impact

## 5. MVP Philosophy

"Lean, High-Quality, Competitive, and Cost-Efficient Premium MVP" - This approach prioritizes delivering a polished, reliable product that directly competes on user experience and core value while maintaining extreme cost efficiency. Key principles:

* **Premium Feel, Lean Build:** The app must feel professional and trustworthy despite minimal resources
* **Automation-First:** Minimize founder burden through aggressive automation and self-service features
* **Client-Heavy Architecture:** Push processing to user devices to reduce server costs
* **Free Tier Maximization:** Leverage free tiers of best-in-class services (Supabase, Upstash, etc.)
* **Cost-Capped AI Usage:** Implement smart caching and rate limiting to control LLM expenses
* **Competitive from Day One:** Core features must match or exceed competitor offerings in quality

## 6. High-Level MVP Architecture Overview

ClariFi employs a modern, cost-efficient architecture that prioritizes client-side processing while maintaining security and scalability:

* **Client-Heavy Frontend:** React Native (Expo) app handles UI/UX, local data processing, and notification scheduling
* **Lean Backend:** NestJS monolith serves as API gateway, orchestrates AI services, and manages user data
* **AI Strategy:** External LLM APIs (Claude Haiku/GPT-3.5-Turbo) for categorization and insights, with aggressive caching
* **Key Services:** 
    * Google Vision API for OCR processing
    * Supabase for database, auth, and file storage
    * Redis/BullMQ for asynchronous job processing
    * Expo for push notifications

*[System Architecture Diagram - See ClariFi_System_Architecture.svg for detailed visualization]*

## 7. Core Technology Stack (MVP)

* **Frontend:** React Native (Expo) - Cross-platform mobile development
* **Backend:** NestJS - Scalable Node.js framework on Render.com (free/starter tier)
* **Database:** PostgreSQL via Supabase (free tier)
* **Authentication:** Supabase Auth with JWT/biometric support
* **File Storage:** Supabase Storage (S3-compatible, free tier)
* **Queue/Cache:** Redis via Upstash (free tier) with BullMQ
* **OCR:** Google Vision API (pay-per-use)
* **LLM:** Claude Haiku / GPT-3.5-Turbo (most cost-effective options)
* **Notifications:** Expo Local Notifications (primary), Expo Push (secondary)
* **Analytics:** PostHog (free tier)
* **Error Tracking:** Sentry (free tier)

## 8. Key Architectural Principles (MVP)

1. **Client-Heavy Logic:** Maximize processing on user devices to minimize server costs
2. **API-Driven AI:** Leverage external LLM services without in-house ML infrastructure
3. **Aggressive Caching:** Cache AI responses, merchant categorizations, and common queries
4. **Free Tier Maximization:** Build within limits of free tiers for all supporting services
5. **Asynchronous Processing:** Use job queues for OCR and AI tasks to handle load spikes
6. **Modularity:** Service-oriented design enables independent scaling and updates
7. **Security by Design:** End-to-end encryption, minimal PII storage, PIPEDA compliance
8. **Cost-Efficiency First:** Every architectural decision optimizes for minimal operational cost
9. **Scalability Foundation:** Architecture supports future growth without major refactoring

## 9. MVP Feature List Summary

1. User Onboarding & Statement Import
2. AI-Powered Data Extraction & Categorization (Ultra Cost-Efficient)
3. Instant Budget Dashboard & Insights
4. Credit Card Setup & Utilization Tracking
5. Proactive Credit Utilization Alerts
6. Multi-Card Optimization Advice
7. Basic Newcomer Financial Education
8. AI-Powered Q&A (Cost-Capped)
9. Monthly Cycle & Progress View
10. Lean Support System

*Full feature specifications available in: `ClariFi_MVP_Feature_Specifications_v1.0.md`*

## 10. Data Management & Privacy (MVP)

* **PIPEDA Compliance:** 
    * Clear consent mechanisms for data collection and usage
    * Transparent privacy policy outlining data handling practices
    * User control over data with export and deletion capabilities

* **Data Deletion:** 
    * Automated deletion of statement images after OCR processing
    * User-initiated account deletion removes all associated data
    * 30-day retention for deleted data recovery, then permanent removal

* **Temporary Storage:** 
    * Statement images stored only during processing pipeline
    * Extracted transaction data retained with user consent
    * No permanent storage of sensitive document images

* **PII Handling with AI Services:** 
    * Transaction descriptions sanitized before AI processing
    * No account numbers or personal identifiers sent to LLMs
    * Aggregate patterns used for categorization without individual details

* **User Data Export:** 
    * Full data export available in JSON/CSV formats
    * Transaction history, categorizations, and insights included
    * Compliance with data portability requirements

## 11. Operational Cost Targets (MVP: First ~1000-5000 Users)

* **Total Monthly Operational Costs:** 
    * Target: $100-$300/month
    * Acceptable range: Up to $500/month maximum
    * Includes all infrastructure, API usage, and third-party services

* **OCR/LLM Costs per Active User:** 
    * Target: <$0.10-$0.25 per month per active user
    * Achieved through caching, batch processing, and usage caps
    * Implement billing alerts at 50%, 75%, and 90% of budget thresholds

* **Cost Optimization Strategies:**
    * Merchant categorization caching reduces repeat LLM calls by ~80%
    * Batch OCR processing during off-peak hours for better rates
    * Progressive enhancement: Basic features free, advanced AI features metered
    * Client-side processing for data aggregation and basic calculations