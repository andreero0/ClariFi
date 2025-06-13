<goal>
You are an industry-veteran **mobile product designer**. You’ve built high-touch UIs for FANG-style companies.

Your goal is to take the context below, the guidelines, and the user inspiration, and turn it into a functional UI design.
</goal>

<inspirations>
No specific visual inspiration images are provided for this task. Your aesthetic direction should be inferred from the app overview, target audience, core values, and the desired feel described in the guidelines, using the **"Secure & Insightful Teal"** palette as the foundation.
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
Mark these designs with an **iPhone 16 Pro device screen frame**.
Use MOCKED DATA for any front-end views because this is just a design exercise.
Use React-Lucide for icons.
Use Tailwind for styling (conceptual application, actual output will be image/description).
Follow the style guide given below.
Place a number above each screen in sequential order so that I can easily give feedback on specific contained screens.
Make sure all screens contain files that hook specifically into our existing /src/App.json from create-react-app. Place all new components in /src/components/
</practicalities>
</guidelines>

<context>
<app-overview>
The AI-Powered Privacy-First Personal Finance App (Canada) is a mobile and web application designed to empower Canadians with intelligent financial management while prioritizing user control and data privacy. Users securely upload their bank and credit card statements (PDFs, CSVs, or images), and the app leverages AI (including OCR via AWS Textract and categorization via OpenAI GPT-3.5-turbo) to automatically extract transactions, categorize spending, track credit card utilization, and provide timely payment reminders. It offers essential budgeting tools, spending insights, and guidance on optimizing credit card usage, all without requiring direct linking to bank accounts, thus addressing key privacy concerns. The MVP focuses on English-speaking Canada and supports statements from major Canadian financial institutions, with a freemium model offering core features for free and advanced insights via a premium subscription.
</app-overview>

<task>
Follow the guidelines above precisely to ensure correctness.
Your output should be a horizontal series of vertical screens showcasing each view specified below. ONLY ONE SCREEN-VIEW PER ROW. Each screen should be clearly framed within an iPhone 16 Pro device mock.

Here’s the 1st feature.
## Feature 1: User Onboarding & Statement Import (MVP)

### Welcome Screen
##### Welcome Screen Initial State
* Full screen background gradient from Cloud Gray (#F7F9FC) at top transitioning to Pure White (#FFFFFF) at bottom
* ClariFi logo centered at 20% from top, 80dp height with subtle fade-in animation (300ms ease-out)
* "Welcome to Financial Clarity" headline in H1 style (32dp, Bold, Midnight Ink) appears 100ms after logo
* Three value proposition cards stacked vertically with 16dp spacing, each with 50ms staggered slide-up animation:
  * Card 1: Shield icon (24dp) in Clarity Blue, "Bank-level Security" title, "Your data stays private and encrypted" description
  * Card 2: Brain icon in Wisdom Purple, "AI-Powered Insights", "Smart categorization and recommendations"
  * Card 3: Maple leaf icon in Growth Green, "Built for Canada", "Supports all major Canadian banks"
* Primary CTA button "Get Started" (full width minus 48dp) fixed at bottom with 32dp margin
* "Already have an account? Sign in" text link centered below CTA in Body Small style
* Subtle particle animation in background moving upward at 20px/s creating sense of growth

##### Welcome Screen Transition State
* "Get Started" button scales to 0.97 on press with haptic feedback
* Screen content fades out (150ms) while sliding up 20dp
* Background gradient intensifies slightly during transition
* Logo scales down and moves to top-left corner position (becoming persistent app header)

### Email Registration Screen
##### Email Registration Input State
* Clean white background with persistent ClariFi logo (40dp height) in top-left
* Back arrow (24dp) in Clarity Blue, 16dp from logo
* "Let's get you started" in H2 style, 24dp below header
* "Enter your email to create your secure account" in Body Regular, Neutral Gray
* Email input field centered with 24dp top margin:
  * Mail icon (20dp) inside left padding area
  * "your@email.com" placeholder
  * Real-time validation showing green checkmark when valid email entered
  * Keyboard opens automatically on screen entry
* "Continue" button initially disabled (50% opacity) until valid email entered
* "By continuing, you agree to our Terms of Service and Privacy Policy" in Caption style with inline links

##### Email Registration Loading State
* Input field becomes read-only with 50% opacity
* "Continue" button shows circular spinner (20dp) replacing text
* Subtle shimmer effect on button indicating processing
* If email already exists, smooth transition to password entry with "Welcome back!" message

### Password Creation Screen
##### Password Creation Input State
* "Create a secure password" H2 header
* Password strength indicator bar (4dp height) below header, transitions from red to yellow to green
* Password input field with:
  * Lock icon (20dp) in left padding
  * Eye icon (20dp) on right for show/hide toggle
  * Real-time strength calculation shown below
* Password requirements checklist with animated checkmarks:
  * "At least 8 characters" 
  * "One uppercase letter"
  * "One number"
  * "One special character"
* Each requirement transitions from Neutral Gray to Success Green when met
* Second password field appears with slide-down animation once first password is valid
* "Create Account" button enables when passwords match

##### Password Creation Success State
* Checkmark animation (Lottie-style but CSS) draws in center of screen
* "Account created!" message fades in
* Automatic transition after 800ms

### Biometric Setup Screen
##### Biometric Setup Prompt State
* Illustration of Face ID/Touch ID (platform appropriate) centered
* "Quick & Secure Access" H2 header
* "Use biometric authentication for faster, more secure sign-ins" body text
* Two buttons with 24dp spacing:
  * Primary: "Enable Face ID" (or Touch ID based on device)
  * Secondary: "Set Up Later"
* Small info icon that reveals tooltip: "You can always change this in Settings"

##### Biometric Setup Authorization State
* System biometric prompt appears with platform-native styling
* Background slightly dims (20% black overlay)
* If successful: green checkmark animation and transition
* If failed: shake animation on prompt with "Try Again" option

### Bank Selection Screen
##### Bank Selection Grid State
* "Which bank do you use?" H2 header
* "Select your primary bank to get started" subtitle
* 2x3 grid of bank cards with 16dp spacing:
  * Each card 156dp x 100dp with bank logo centered
  * White background with Border/Divider stroke
  * On tap: border changes to Clarity Blue (2dp), subtle scale to 1.02
  * Supported banks: TD, RBC, BMO, Scotia, CIBC, National Bank
* "I use multiple banks" link below grid
* "My bank isn't listed" link at bottom
* Selected bank card shows blue border and check icon in top-right corner

##### Bank Selection Multiple State
* Grid expands to show checkboxes on each card
* "Select all banks you use" instruction appears
* Selected cards show Clarity Blue background at 10% opacity
* "Continue with X banks" dynamic button text

### Statement Import Screen
##### Statement Import Instructions State
* Custom illustration showing phone scanning a document
* "Import Your Statements" H2 header
* Tab selector for "Scan Document" vs "Upload PDF"
* Step-by-step visual guide with numbered circles (1, 2, 3):
  * "Open your banking app or grab a paper statement"
  * "Take a clear photo of the full statement"
  * "We'll extract and categorize everything automatically"
* "Import Statement" primary button with camera icon
* "How we protect your data" expandable section at bottom

##### Statement Import Camera State
* Native camera view with custom overlay
* Semi-transparent border highlighting capture area
* "Align statement within frame" instruction at top
* Auto-capture when document detected and focused
* Manual capture button at bottom center (64dp)
* Flash toggle and gallery access icons in corners
* Real-time edge detection highlights document borders in Clarity Blue

##### Statement Import Processing State
* Captured image shows with 50% opacity overlay
* Circular progress indicator with percentage text
* Three phase indicators below:
  * "Reading document" (with animated dots)
  * "Extracting transactions" 
  * "Categorizing expenses"
* Each phase highlights as active with Clarity Blue
* "This usually takes 10-30 seconds" helper text
* Cancel button available at bottom

##### Statement Import Success State
* Green checkmark animation
* "Successfully imported 47 transactions" success message
* Preview cards showing:
  * Total spending extracted
  * Number of categories found  
  * Date range covered
* "Import Another" secondary button
* "View Dashboard" primary CTA

### Onboarding Complete Screen
##### Onboarding Complete Celebration State
* Confetti animation (subtle, using CSS transforms)
* Trophy icon (48dp) in Wisdom Purple
* "You're all set!" H1 header
* "Here's what ClariFi found:" section with animated number counting:
  * "Monthly spending: $2,847" (counts up from 0)
  * "Credit utilization: 34%" (with mini gauge)
  * "Transactions categorized: 47"
* Three benefit reminder cards with staggered animations:
  * "Get alerts 3 days before statement dates"
  * "See AI-powered insights"
  * "Track progress with achievements"
* "Explore Your Dashboard" primary CTA pulsing gently
* "Take a Quick Tour" secondary option

</task>

<style-guide>
Here’s the app’s style guide:

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

</style-guide>
</context>

