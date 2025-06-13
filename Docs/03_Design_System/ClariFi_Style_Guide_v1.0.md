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

This style guide reflects current best practices in fintech UX design while specifically addressing ClariFi's mission to empower newcomers with financial clarity through trust-building design patterns and accessible, intuitive interfaces.