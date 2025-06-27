# ClariFi Mobile App - Screen Layouts & Design System

## Overview
This document outlines all screens in the ClariFi mobile app, their layouts, and design requirements based on the PRD specifications.

## Design Principles
- **Apple Design Guidelines**: Clean, focused, intuitive
- **Financial App Standards**: Professional, trustworthy, data-driven
- **PRD Compliance**: Exact color palette, typography, and spacing
- **Accessibility**: WCAG 2.1 AA compliance

---

## 1. Authentication Flow

### 1.1 Welcome Screen (`/app/(auth)/welcome.tsx`)
**Purpose**: First impression, brand introduction
**Layout**:
- Top: ClariFi logo (responsive sizing)
- Middle: Hero message "Welcome to Financial Clarity"
- Bottom: CTA buttons (Get Started, Sign In)
**Status**: ✅ Completed - Responsive design with Apple principles

### 1.2 Registration Screen (`/app/(auth)/register.tsx`)
**Purpose**: Email collection for account creation
**Layout**:
- Header: Logo + back arrow
- Form: Email input with real-time validation
- Footer: Terms & Privacy disclaimer
**Status**: ✅ Completed - Clean, focused design

### 1.3 Password Creation (`/app/(auth)/password-creation.tsx`)
**Purpose**: Secure password setup with strength indicator
**Layout**:
- Header: Logo + back arrow
- Form: Password input with strength meter
- Requirements checklist with animated checkmarks
**Status**: ✅ Completed - Interactive strength validation

### 1.4 Bank Selection (`/app/(auth)/bank-selection.tsx`)
**Purpose**: Select primary Canadian bank
**Layout**:
- Header: Logo + back arrow
- Grid: 2x3 bank cards with logos
- Footer: "Multiple banks" option
**Status**: ✅ Completed - PRD-compliant grid layout

### 1.5 Statement Instructions (`/app/(auth)/statement-instructions.tsx`)
**Purpose**: Guide user through statement upload
**Status**: 🔄 Needs review for layout consistency

---

## 2. Main App Tabs

### 2.1 Dashboard (`/app/(tabs)/dashboard.tsx`)
**Purpose**: Financial overview and insights
**Status**: ✅ **COMPLETELY REDESIGNED** - Now follows modern financial app standards

**New Professional Layout**:
```
┌─────────────────────────────────────┐
│ Header: Greeting + Bell/Settings    │
│ "Good morning, Sarah 👋"            │
├─────────────────────────────────────┤
│ Balance Card (Hero Section)         │
│ ┌─────────────────────────────────┐ │
│ │ Total Balance    +2.4% ↗        │ │
│ │ $12,847.23      [👁]            │ │
│ │ [Add Money] [Send]              │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Metrics Cards (2-column grid)       │
│ ┌─────────────┐ ┌─────────────┐   │
│ │↙ Income     │ │↗ Spending   │   │
│ │$4,200       │ │$2,847       │   │
│ │+12% vs last│ │-8% vs last  │   │
│ └─────────────┘ └─────────────┘   │
├─────────────────────────────────────┤
│ Spending Insights Card              │
│ Progress bar + Category breakdown   │
│ Food & Dining    $847.32    30%    │
│ Transportation   $425.18    15%    │
├─────────────────────────────────────┤
│ Recent Transactions Card            │
│ Starbucks       -$5.47     2h ago  │
│ Salary Deposit  +$2,100    1d ago  │
├─────────────────────────────────────┤
│ Quick Actions Grid (2x2)            │
│ [Add Card] [Analytics]              │
│ [Goals]    [Settings]               │
└─────────────────────────────────────┘
```

**Key Improvements**:
- ✅ **Modern Card Design**: Rounded corners, proper shadows, professional spacing
- ✅ **Visual Hierarchy**: Clear information priority with typography scale
- ✅ **Professional Colors**: Design system integration, meaningful color usage
- ✅ **Interactive Elements**: Balance visibility toggle, progress indicators
- ✅ **Apple Design Principles**: Clean, focused layout with generous whitespace
- ✅ **Proper Data Visualization**: Progress bars, trend indicators, meaningful metrics
- ✅ **Professional Icons**: Lucide icons throughout, no more emojis
- ✅ **Responsive Layout**: Dynamic sizing based on screen dimensions

### 2.2 Cards Screen (`/app/(tabs)/cards.tsx`)
**Purpose**: Credit card management and utilization
**Layout**:
- Header: Total cards + utilization summary
- Carousel: Credit card items with swipe navigation
- Actions: Payment optimization CTA
**Status**: ✅ Good layout, needs minor refinement

### 2.3 Transactions (`/app/(tabs)/transactions.tsx`)
**Purpose**: Transaction list and management
**Status**: 🔄 Needs layout documentation

### 2.4 Categories (`/app/(tabs)/categories.tsx`)
**Purpose**: Expense category management
**Layout**:
- Header: Search + add button
- Filters: All/Income/Expense tabs
- List: Category items with usage stats
**Status**: ✅ Clean, functional design

### 2.5 Insights (`/app/(tabs)/insights.tsx`)
**Purpose**: AI-powered financial insights
**Status**: 🔄 Needs layout documentation

### 2.6 Profile (`/app/(tabs)/profile.tsx`)
**Purpose**: User settings and account management
**Status**: 🔄 Needs layout documentation

---

## 3. Modal Screens

### 3.1 AI Chat (`/app/modals/ai-chat.tsx`)
**Purpose**: Financial Q&A with AI assistant
**Status**: 🔄 Needs layout review

### 3.2 Add Statement (`/app/modals/add-statement.tsx`)
**Purpose**: Upload bank statements
**Status**: 🔄 Needs layout review

### 3.3 Transaction Detail (`/app/modals/transaction-detail.tsx`)
**Purpose**: View/edit individual transactions
**Status**: 🔄 Needs layout review

### 3.4 Credit Card Form (`/app/modals/credit-card-form.tsx`)
**Purpose**: Add/edit credit cards
**Status**: 🔄 Needs layout review

---

## 4. Design System Components

### 4.1 Cards & Containers
- **Surface Cards**: White background, subtle shadow, 16dp radius
- **Metric Cards**: Colored left border, icon + value + label
- **Interactive Cards**: Hover states, press animations

### 4.2 Charts & Data Visualization
- **Donut Chart**: Interactive spending breakdown
- **Line Charts**: Trend visualization
- **Progress Bars**: Goal tracking

### 4.3 Navigation
- **Bottom Tabs**: 5 primary sections
- **Stack Navigation**: Modal presentation
- **Breadcrumbs**: Deep navigation context

---

## 5. Priority Issues to Fix

### HIGH PRIORITY
1. **Dashboard Redesign**: Complete overhaul needed
   - Research modern dashboard patterns
   - Implement proper card layouts
   - Add meaningful data visualizations
   - Improve spacing and typography

2. **Visual Hierarchy**: Establish clear content hierarchy
3. **Interactive Elements**: Add micro-animations
4. **Data Density**: Balance information with whitespace

### MEDIUM PRIORITY
1. **Component Consistency**: Standardize all card styles
2. **Loading States**: Professional skeleton screens
3. **Empty States**: Engaging illustrations and CTAs

### LOW PRIORITY
1. **Dark Mode**: Design system extension
2. **Animations**: Polished transitions

---

## 6. Research Requirements

Before redesigning the dashboard, research:
1. **Mint.com** - Clean financial dashboard patterns
2. **Personal Capital** - Investment-focused layouts
3. **YNAB** - Budget-centric design
4. **Apple Card app** - iOS native financial design
5. **Modern admin dashboards** - Layout inspiration

## 7. Success Metrics

A successful dashboard should:
- ✅ Load key information in under 2 seconds
- ✅ Present data hierarchy clearly
- ✅ Enable quick actions (< 3 taps)
- ✅ Feel trustworthy and professional
- ✅ Pass accessibility standards
- ✅ Match or exceed competitor quality

---

*This document will be updated as screens are redesigned and improved.*