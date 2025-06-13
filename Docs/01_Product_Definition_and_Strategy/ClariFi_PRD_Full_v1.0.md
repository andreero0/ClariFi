<prd_document>
    <title>ClariFi - TaskMaster-Optimized Product Requirements Document (MVP) - v1.0</title>
    <last_updated>[Current Date]</last_updated>
    <version>1.0</version>

    <section id="1" title="Introduction & Purpose">
        <subsection id="1.1" title="Document Purpose">
            <paragraph>This document serves as the comprehensive Product Requirements Document (PRD) for the Minimum Viable Product (MVP) of ClariFi. It is intended to provide a single source of truth for product strategy, feature requirements, technical architecture, design guidelines, and detailed UI/UX specifications to guide development, particularly for use with AI-powered development tools like TaskMaster AI MCP.</paragraph>
        </subsection>
        <subsection id="1.2" title="Product Vision for ClariFi">
            <paragraph>Empower every newcomer and credit user in Canada to achieve financial clarity, confidence, and control through AI-driven guidance that transforms complex financial data into actionable insights, enabling them to build strong credit, optimize spending, and navigate the Canadian financial system with ease.</paragraph>
        </subsection>
        <subsection id="1.3" title="Product Goals for MVP">
            <list type="bullet">
                <item>Validate the core value proposition of simplified budgeting and proactive credit optimization via statement uploads.</item>
                <item>Achieve initial user traction (target 500-1000 beta users, growing to 5000 users within 6 months post-public launch) and positive feedback within the Canadian newcomer segment.</item>
                <item>Test and prove the cost-efficiency (target <$0.15-$0.25/active user/month for OCR/LLM) and accuracy (>85% for AI categorization) of the API-driven AI model.</item>
                <item>Establish ClariFi as a trustworthy, secure, and user-friendly financial companion.</item>
                <item>Gather data on user behavior (via PostHog) to inform future development, feature prioritization, and monetization strategies.</item>
            </list>
        </subsection>
        <subsection id="1.4" title="Target Audience & User Personas">
            <paragraph>**Primary:** Newcomers to Canada (recent immigrants and international students, 0-5 years in Canada, 20-45 years old)</paragraph>
            <list type="bullet">
                <item>*Key Pain Points:* Limited Canadian credit history, unfamiliarity with credit scoring system, difficulty with financial statements in English/French, language barriers affecting financial literacy, urgent need to build credit for housing/vehicles, tight budgets due to entry-level income or newcomer expenses, loss of financial confidence post-arrival.</item>
            </list>
            <paragraph>**Secondary:** Young professionals in Canada (25-40 years old) with multiple credit cards</paragraph>
            <list type="bullet">
                <item>*Key Pain Points:* Difficulty tracking multi-card spending, optimizing credit utilization, information overload from multiple financial statements, managing payment timing, lack of a unified financial view.</item>
            </list>
            <paragraph>*(Further detailed personas will be developed/referenced separately if needed, focusing on specific newcomer journeys and tech savviness levels.)*</paragraph>
        </subsection>
    </section>

    <section id="2" title="MVP Philosophy & Guiding Principles">
        <paragraph>The ClariFi MVP is built on the philosophy of a **"Lean, High-Quality, Competitive, and Cost-Efficient Premium MVP."**</paragraph>
        <list type="bullet">
            <item>**Premium User Experience:** The app must feel polished, intuitive, reliable, and modern. User delight, ease of use, and speed are paramount. The design must instill trust and confidence from the first interaction.</item>
            <item>**Lean & Cost-Efficient Operations:** Architectural and technical decisions must prioritize minimizing recurring operational costs, especially for third-party APIs (OCR, LLM). This involves aggressive free-tier utilization for supporting services, client-heavy processing where sensible without degrading UX, efficient API call strategies (batching, minimal token usage), and robust caching. Target operational costs for the first ~1000-5000 users are aimed to be under $100-$300/month.</item>
            <item>**Automation-First:** Minimize manual founder/team intervention for routine operations through smart automation in statement processing, user support (via self-serve and AI Q&A), and notifications.</item>
            <item>**Competitive Core Value:** The MVP must excel at its core promises: simplifying budgeting from statements and providing actionable credit optimization insights that are as good as or better than existing solutions in terms of clarity, actionability, and newcomer focus.</item>
            <item>**Privacy-First:** User control over data and robust privacy measures are foundational. No direct bank linking is required for the MVP; data is sourced from user-uploaded statements, which are deleted immediately after processing. All data handling must be PIPEDA compliant.</item>
            <item>**Iterative Development:** Launch with a focused, high-quality feature set. Continuously gather user feedback and analytics to iterate rapidly and improve the product. Implement a waitlist system for controlled initial rollout.</item>
        </list>
    </section>

    <section id="3" title="Overall MVP Architecture & Technology Stack">
        <subsection id="3.1" title="High-Level Architecture Overview">
            <paragraph>ClariFi employs a client-heavy architecture for its mobile MVP to optimize for cost and provide a responsive user experience. The React Native (Expo) frontend handles significant UI rendering, local data storage (AsyncStorage), client-side calculations for dashboards and optimizations, local notification scheduling, and image preprocessing. The backend is a lean NestJS (Node.js) monolith, hosted on a cost-effective PaaS (e.g., Render.com free/starter tier), serving primarily as an API gateway, an orchestrator for external AI services (OCR/LLM), and for managing user authentication and asynchronous statement processing jobs via a Redis-based queue (BullMQ). Data persistence is handled by Supabase (PostgreSQL), with Supabase Auth for user management and Supabase Storage for temporary file uploads.</paragraph>
            <paragraph>*(Visual Aid: Refer to `ClariFi_System_Architecture_MVP_v1.0.svg` - this diagram will be provided separately to the AI IDE if it can process it, or its key elements are described herein.)*</paragraph>
            <paragraph>**Key Architectural Flow for Statement Processing:** User uploads statement (image/PDF) -> Client preprocesses image -> Secure upload to Supabase Storage (temporary) -> Backend API call to trigger processing -> Job added to BullMQ/Redis queue -> Backend worker picks up job -> Calls Google Vision API for OCR -> Sends extracted text to Claude Haiku/GPT-3.5-Turbo for transaction parsing & categorization (leveraging Redis merchant cache) -> Stores structured data in Supabase PostgreSQL -> Deletes original file from Supabase Storage -> Notifies client of completion (via polling or minimal WebSocket).</paragraph>
        </subsection>
        <subsection id="3.2" title="Core Technology Stack (MVP)">
            <list type="bullet">
                <item>**Frontend:** React Native (Expo) with TypeScript, Expo Router, high-quality built-in or minimal UI components (e.g., React Native SVG for charts, no heavy external UI kits unless essential and themeable).</item>
                <item>**Backend:** NestJS (Node.js, TypeScript) hosted on Render.com (free/starter tier) or similar cost-effective PaaS.</item>
                <item>**Database:** PostgreSQL via Supabase (free tier: 500MB DB).</item>
                <item>**Authentication:** Supabase Auth (free tier: 50K MAU, JWT, biometric support via client).</item>
                <item>**File Storage (Temporary):** Supabase Storage (free tier: 1GB, files deleted immediately post-processing).</item>
                <item>**Queue/Cache:** Redis via Upstash (free tier: 10K commands/day) with BullMQ for queue management and merchant/Q&A response caching.</item>
                <item>**OCR:** Google Vision API (aggressively utilize 1000 free units/month, budget for minimal overage).</item>
                <item>**LLM:** Anthropic Claude Haiku (primary for cost-efficiency) or OpenAI GPT-3.5-Turbo (secondary/comparison). NO GPT-4 for MVP core categorization/Q&A.</item>
                <item>**Push Notifications:** Expo Local Notifications (primary for client-side scheduling), Expo Push Notifications (free tier, for minimal server-triggered backup alerts).</item>
                <item>**Analytics:** PostHog (free tier: 1M events/month).</item>
                <item>**Error Tracking:** Sentry (free tier).</item>
                <item>**Local Development:** Docker & Docker Compose.</item>
            </list>
        </subsection>
        <subsection id="3.3" title="Key Architectural Principles (MVP)">
            <list type="bullet">
                <item>Client-Heavy Logic: Maximize processing on user devices.</item>
                <item>API-Driven AI: Leverage external LLM/OCR services efficiently.</item>
                <item>Aggressive Caching: For AI responses, merchant categorizations, common queries.</item>
                <item>Free Tier Maximization: Build within limits of free tiers for supporting services.</item>
                <item>Asynchronous Processing: Use job queues for OCR and AI tasks.</item>
                <item>Modularity (within Monolith): NestJS modules for clear domain separation.</item>
                <item>Security by Design: Encryption, minimal PII storage, PIPEDA compliance.</item>
                <item>Cost-Efficiency First: Every decision optimizes for minimal operational cost.</item>
                <item>Scalability Foundation (Lean): While optimized for low cost initially, the chosen technologies (Node.js, PostgreSQL, Redis) and modular design provide a path for scaling when funding and user growth allow.</item>
                <item>Minimal Backend State: Keep the backend as stateless as possible, relying on the database and cache for state, to simplify scaling of backend instances on PaaS.</item>
            </list>
        </subsection>
    </section>

    <section id="4" title="Core Design System Summary (ClariFi Style Guide Highlights)">
        <paragraph>*(The full `ClariFi_Style_Guide_v1.0.md` is the definitive source and should be considered embedded here for reference by TaskMaster. Key highlights are provided for immediate context. This summary is based on the "Clarity Blue, Midnight Ink, Growth Green, Wisdom Purple" palette. Ensure this matches the finalized Style Guide to be used for development.)*</paragraph>
        <subsection id="4.1" title="Core Color Palette">
            <list type="bullet">
                <item>**Primary Brand:** Clarity Blue - #2B5CE6 (Primary buttons, key interactive elements, headers)</item>
                <item>**Primary Text:** Midnight Ink - #1A1F36 (High readability on light backgrounds)</item>
                <item>**Primary Surface:** Pure White - #FFFFFF (Cards, content areas, input backgrounds)</item>
                <item>**Secondary Action/Hover:** Sky Trust - #4B7BF5 (Lighter blue for interactions)</item>
                <item>**Subtle Backgrounds/Inactive:** Cloud Gray - #F7F9FC (App background sections, disabled states)</item>
                <item>**Primary Accent (Positive/Growth):** Growth Green - #00C896 (Success states, positive financial indicators, some CTAs)</item>
                <item>**Secondary Accent (Guidance/Premium):** Wisdom Purple - #6B5DD3 (Educational content highlights, premium feature hints)</item>
                <item>**Functional:** Success (#00A76F), Error (#E53E3E), Warning (#F6AD55), Neutral Grays (#4A5568, #718096), Border (#E2E8F0).</item>
                <item>**App Background (Overall):** #FAFBFD (Subtle blue-tinted gray for visual comfort)</item>
                <item>**Dark Mode:** Primary BG #0F1419, Surface BG #1A202C, Text #F7FAFC, Adjusted Blues/Greens/Purples for contrast.</item>
            </list>
        </subsection>
        <subsection id="4.2" title="Core Typography">
            <list type="bullet">
                <item>**Font Family:** SF Pro Text (iOS) / Roboto (Android). Inter as a web fallback if ever needed.</item>
                <item>**Weights Used:** Regular (400), Medium (500), Semibold (600), Bold (700).</item>
                <item>**Key Styles (Size/Weight/Color defined in full Style Guide):** H1 (Screen Titles, e.g., 32dp Bold), H2 (Section Headers, e.g., 24dp Semibold), H3 (Card Headers, e.g., 18dp Semibold), Body Regular (Standard text, e.g., 16dp Regular), Body Small (Secondary info, e.g., 14dp Regular), Caption (Helper text, e.g., 12dp Regular), Button Text (e.g., 16dp Medium, Sentence case), Link Text (e.g., 16dp Regular, Clarity Blue).</item>
            </list>
        </subsection>
        <subsection id="4.3" title="Key Component Principles">
            <list type="bullet">
                <item>**Buttons:** Clear visual hierarchy for Primary (solid Clarity Blue), Secondary (outlined Clarity Blue), and Text buttons. Defined states (default, hover/pressed, disabled) with appropriate color changes and subtle animations (e.g., scale on press). Height: 48dp. Corner Radius: 12dp.</item>
                <item>**Cards:** Pure White background, 16dp corner radius, subtle shadow for elevation, 24dp internal padding.</item>
                <item>**Input Fields:** 52dp height, 12dp corner radius. Default border: Border/Divider gray. Focused state: 2dp Clarity Blue border with subtle glow. Error state: Error Red border and helper text. Placeholders in Neutral Gray (Secondary).</item>
                <item>**Icons:** Lucide React Native. Interactive icons use Clarity Blue. Non-interactive use Neutral Gray (Secondary). Sizes: 24dp general, 20dp small, 28dp Tab Bar.</item>
            </list>
        </subsection>
        <subsection id="4.4" title="Spacing & Motion Philosophy">
            <list type="bullet">
                <item>**Spacing:** Consistent 8dp base unit grid (4dp, 8dp, 12dp, 16dp, 24dp, 32dp, 48dp scale) for all margins, padding, and layouts.</item>
                <item>**Motion:** Purposeful, smooth (200-250ms, cubic-bezier easing), and feedback-oriented. Microinteractions (150ms) for tactile feel. Platform-native page transitions. Skeleton screens and small spinners for loading states.</item>
            </list>
        </subsection>
        <subsection id="4.5" title="Accessibility Mandate">
            <list type="bullet">
                <item>Strict adherence to WCAG 2.1 Level AA for color contrast (e.g., Clarity Blue on white is 5.2:1).</item>
                <item>Minimum touch targets of 44dp x 44dp (ideally 48dp).</item>
                <item>Support for dynamic type scaling and screen reader compatibility (descriptive labels for icons and images).</item>
                <item>Clear visual focus indicators for keyboard navigation.</item>
            </list>
        </subsection>
        <paragraph>*(Full Style Guide with detailed specifications for all components, states, dark mode, etc., is defined in `ClariFi_Style_Guide_v1.0.md` and must be strictly followed.)*</paragraph>
    </section>

    <section id="5" title="MVP Features - Detailed Requirements & UI/UX Specifications">

        <feature id="5.1" name="User Onboarding & Statement Import">
            <feature_goal>Create a premium, frictionless onboarding experience that guides users through account setup and historical statement import (up to 6 months backlog, 3-5 pages per statement) while minimizing operational costs through client-side processing and intelligent resource usage.</feature_goal>
            <core_requirements>
                <user_story>
                    <as_a>new user</as_a>
                    <i_want_to>register quickly and securely using my email and password, with an optional and easy setup for biometric login (Face ID/Touch ID)</i_want_to>
                    <so_that>I can access ClariFi efficiently and trust my data is safe.</so_that>
                    <acceptance_criteria>
                        <criterion>Real-time email validation is implemented using standard patterns.</criterion>
                        <criterion>Clear password strength requirements (e.g., min 8 chars, uppercase, number, special char) are displayed and validated in real-time.</criterion>
                        <criterion>Biometric setup is offered post-password creation and functions as expected per platform if enabled by the user.</criterion>
                        <criterion>Successful registration or login proceeds smoothly to the next onboarding step or dashboard with appropriate feedback.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>new user</as_a>
                    <i_want_to>easily select my bank(s) from a list of major Canadian institutions (Top 6 + National Bank)</i_want_to>
                    <so_that>ClariFi can accurately process my statements.</so_that>
                    <acceptance_criteria>
                        <criterion>A visually clear list or grid of supported bank logos and names is presented.</criterion>
                        <criterion>User can select one or more banks as applicable (MVP: one bank at a time during initial onboarding, multi-bank support via settings later).</criterion>
                        <criterion>Selection is clearly indicated visually (e.g., border change, checkmark overlay).</criterion>
                        <criterion>An option for "My bank isn't listed" provides appropriate information or a way to request support for other banks.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>new user</as_a>
                    <i_want_to>upload my bank/credit card statements for up to the last 6 months (typically 3-5 pages per statement) via either camera scan or PDF upload, with client-side preprocessing to optimize the file</i_want_to>
                    <so_that>I can populate ClariFi with my financial history efficiently and cost-effectively.</so_that>
                    <acceptance_criteria>
                        <criterion>Both camera capture (with guidance for multi-page documents if applicable) and PDF upload are functional and intuitive.</criterion>
                        <criterion>Client-side image optimization (compression, resizing, basic quality checks) significantly reduces file size before upload without compromising OCR readability.</criterion>
                        <criterion>Upload progress is clearly indicated to the user for each file.</criterion>
                        <criterion>System correctly handles multi-page statements if the format allows (e.g., multi-page PDF, or guided multi-image capture).</criterion>
                        <criterion>Original statement files are deleted from temporary storage (e.g., Supabase Storage) immediately after secure processing by the backend.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>receive clear, real-time validation and feedback throughout the statement capture and upload process, including image quality checks and processing status updates</i_want_to>
                    <so_that>I feel informed and in control, and can correct issues promptly.</so_that>
                    <acceptance_criteria>
                        <criterion>Client-side image quality checks (e.g., for blur, glare, cropping, orientation) provide instant feedback and actionable guidance to the user.</criterion>
                        <criterion>Upload status (uploading, processing) and subsequent asynchronous processing status (e.g., "Reading document," "Extracting transactions") are clearly communicated to the user via efficient polling or minimal WebSocket use.</criterion>
                        <criterion>Error messages are user-friendly and suggest corrective actions.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>new user</as_a>
                    <i_want_to>see a welcoming "Onboarding Complete" screen after successful registration and initial statement import</i_want_to>
                    <so_that>I feel my setup is successful, I am acknowledged for completing the process, and I am guided to the main dashboard.</so_that>
                    <acceptance_criteria>
                        <criterion>A positive, visually engaging confirmation screen is displayed upon completion of the initial onboarding steps.</criterion>
                        <criterion>Key initial findings (e.g., number of transactions imported from the first statement, a teaser insight) may be briefly and engagingly summarized.</criterion>
                        <criterion>A clear Call to Action (CTA) navigates the user to the main dashboard or offers a quick tour.</criterion>
                    </acceptance_criteria>
                </user_story>
            </core_requirements>
            <technical_summary>
                <frontend>React Native/Expo. Onboarding navigator (Expo Router) with screens: Welcome, Email/Password Registration, Biometric Setup, Bank Selection, Statement Import Instructions, Camera Capture/File Picker, Processing Progress, Onboarding Complete. Heavy use of AsyncStorage for persisting onboarding state and user preferences. Client-side image preprocessing libraries. Efficient polling for status updates.</frontend>
                <backend>NestJS. Auth module integrates with Supabase Auth for registration/login. Statements module provides endpoints for preparing secure upload URLs (to Supabase Storage), confirming uploads, and adding statement processing jobs to a BullMQ queue. Minimal backend logic directly involved in the onboarding UI flow itself; primarily acts as an orchestrator for subsequent asynchronous processing.</backend>
                <ai_llm_integration>OCR (Google Vision API) will be called by the backend statement processor *after* this onboarding feature successfully queues a statement. No direct LLM for categorization is invoked *during* this specific onboarding feature's immediate user flow; categorization is a subsequent, separate asynchronous job.</ai_llm_integration>
                <database>Supabase/PostgreSQL: `users_profile` table (linked to `auth.users` via ID, stores `preferred_language`, `onboarding_completed` status, `notification_preferences`). `statement_imports` table to track job `id`, `user_id`, `bank_name`, `statement_date`, `import_status` (`pending`, `processing`, `completed`, `failed`), `file_key` (in Supabase Storage, temporary), `processed_at`, `error_message`.</database>
            </technical_summary>
            <ui_ux_summary>
                <screen name="Welcome Screen">
                    <state name="Default/Initial View">
                        <description>Full-screen background: `App Background (#FAFBFD)`. ClariFi logo (specific asset, e.g., 60dp height, `Midnight Ink` or a version with `Clarity Blue` elements) centered horizontally, approximately 20% from top (e.g., 120dp), 48dp height. Headline (H1 Style): "Welcome to ClariFi" or "Financial Clarity Starts Here" in `Midnight Ink (#1A1F36)`. Centered below the logo. Tagline (Body Large Style): "AI-powered budgeting and credit optimization, built for Canada." in `Neutral Gray (Primary) (#4A5568)`. Centered below the headline. Primary Button "Get Started" (Style Guide: Primary Button - `Clarity Blue` bg, `Pure White` text), full width (minus 48dp total horizontal margin), positioned approx. 80dp from the bottom. Text Button "I already have an account" (Style Guide: Text Button - `Clarity Blue` text) centered 16dp below the "Get Started" button. Layout emphasizes breathable whitespace. Subtle fade-in animation (250ms, ease-out) for logo, then text, then buttons. Accessibility: Logo alt text. High contrast text.</description>
                    </state>
                    <state name=""Get Started" Button Pressed">
                        <description>Primary Button shows "pressed" state (Style Guide: `Sky Trust` background, slight scale down to 0.97). Haptic feedback. Screen transitions to Email Registration Screen (platform-native slide animation, 300ms).</description>
                    </state>
                    <state name=""Sign In" Text Button Pressed">
                        <description>Text Button shows "pressed" state (Style Guide: `Sky Trust` text color, underline appears). Screen transitions to a dedicated Login Screen (platform-native slide animation, 300ms).</description>
                    </state>
                </screen>
                <screen name="Email & Password Registration Screen">
                    <state name="Default Input View">
                        <description>`App Background (#FAFBFD)`. Header with a "Back" arrow icon (`Lucide ChevronLeft`, 24dp, `Clarity Blue`) on the left and screen title "Create Your Account" (H2 Style, `Midnight Ink`) centered or left-aligned. Email Input Field (Style Guide: Input Field - 52dp height, `Pure White` bg, `Border/Divider (#E2E8F0)` border, 12dp corner radius). Placeholder "Email address" (`Neutral Gray (Secondary)`). Leading mail icon (`Lucide Mail`, 20dp, `Neutral Gray (Secondary)`). Password Input Field (same styling). Placeholder "Create password". Leading lock icon (`Lucide Lock`, 20dp, `Neutral Gray (Secondary)`). Trailing eye icon (`Lucide Eye/EyeOff`, 20dp, `Neutral Gray (Secondary)`) to toggle password visibility. Password Strength Indicator bar (4dp height, below password field, dynamically colored `Error Red` -> `Warning Amber` -> `Success Green`). Password Requirements Checklist (Caption Style, `Neutral Gray (Secondary)`), e.g., "✓ At least 8 characters". Checkmarks `Lucide Check` in `Success Green`. Primary Button "Continue", initially Disabled state. Legal text "By continuing..." (Body Small, `Neutral Gray (Secondary)`) with links in `Clarity Blue`. Vertical stacking with 16dp spacing. Smooth focus animations. Checklist items animate checkmarks.</description>
                    </state>
                    <state name="Input Field Focused">
                        <description>Focused input field: 2dp `Clarity Blue` border, subtle glow (0 0 0 4dp rgba(43, 92, 230, 0.15)). Keyboard visible. UI scrolls if needed.</description>
                    </state>
                    <state name="Real-time Validation Error">
                        <description>Invalid field: 2dp `Error (#E53E3E)` border, light `Error` background tint (rgba(229, 62, 62, 0.04)). Helper text (Caption Style, `Error (#E53E3E)`) below input, e.g., "Please enter a valid email." Optional `Lucide AlertCircle` icon (`Error Red`) in helper text. Error message fades/slides in (150ms).</description>
                    </state>
                    <state name="All Fields Valid, "Continue" Enabled">
                        <description>"Continue" button transitions to enabled Primary Button style (`Clarity Blue` bg, `Pure White` text).</description>
                    </state>
                    <state name=""Continue" Pressed - Loading">
                        <description>"Continue" button: text replaced by centered circular spinner (20dp, `Pure White` on `Clarity Blue` bg). Button non-interactive. Subtle shimmer on button.</description>
                    </state>
                    <state name="Registration API Error (e.g., Email Exists)">
                        <description>Non-modal toast/banner (slides from top/bottom, `Error` bg, `Pure White` text): "Error: Email already registered. Please log in or use a different email." "Continue" button reverts to enabled state. Focus may return to email field.</description>
                    </state>
                    <state name="Registration Success">
                        <description>Brief success feedback (e.g., button shows `Lucide Check` icon in `Success Green` momentarily). Transition to Biometric Setup Screen (platform-native slide, 300ms).</description>
                    </state>
                </screen>
                <screen name="Biometric Setup Screen">
                    <state name="Default Prompt View">
                        <description>`App Background (#FAFBFD)`. Screen Title "Quick & Secure Access" (H2, `Midnight Ink`), centered. Large, friendly illustration/icon for biometrics (`Clarity Blue` & `Sky Trust` accents, 80-100dp size). Body Regular text "Enable biometric login..." (`Neutral Gray (Primary)`), centered, 32dp horizontal padding. Primary Button "Enable Face ID/Touch ID" (`Clarity Blue` bg). Text Button "Skip for Now" (`Clarity Blue` text). Buttons grouped at bottom with 16dp spacing between them, 32dp from screen bottom.</description>
                    </state>
                    <state name=""Enable Biometrics" Pressed - System Prompt Active">
                        <description>App triggers native iOS/Android biometric authentication prompt. ClariFi UI behind dims (e.g., 40% black overlay on `App Background`).</description>
                    </state>
                    <state name="Biometric Setup Success">
                        <description>System prompt dismisses. On ClariFi screen: Large `Lucide CheckCircle` icon (64dp, `Success Green`) animates in (e.g., draw effect or scale-up with bounce). Text "Biometrics Enabled!" (H3, `Midnight Ink`) fades in below. Auto-transition to Bank Selection Screen after 1.5 seconds.</description>
                    </state>
                    <state name="Biometric Setup Failed/Cancelled / "Skip for Now" Pressed">
                        <description>If failed/cancelled from system prompt, a brief, non-intrusive toast message: "Biometric setup skipped. You can enable it later in Settings." Screen transitions to Bank Selection Screen (platform-native slide, 300ms).</description>
                    </state>
                </screen>
                <screen name="Bank Selection Screen">
                    <state name="Default View / Single Bank Selection Mode">
                        <description>`App Background (#FAFBFD)`. Header: "Back" arrow (`Lucide ChevronLeft`, `Clarity Blue`), Title "Connect Your Bank" (H1, `Midnight Ink`). Subtitle "Select your primary bank to import statements." (Body Regular, `Neutral Gray (Primary)`). Responsive grid (2 columns on phone, 16dp gap) of bank selection cards. Each card: `Pure White` bg, 16dp corner radius, subtle shadow (Style Guide spec), 24dp padding. Contains official bank logo (e.g., 40dp height, aspect ratio preserved) and bank name (Body Regular, `Midnight Ink`) below logo. Supported banks listed. "My bank isn't listed" Text Button (`Clarity Blue`) at bottom. Primary Button "Continue", initially disabled (Style Guide disabled state).</description>
                    </state>
                    <state name="Bank Card Tapped/Selected">
                        <description>Tapped bank card: gets 2dp `Clarity Blue` border. Small `Lucide CheckCircle` icon (20dp, `Pure White` fill on `Clarity Blue` circular background, 8dp size) appears in top-right corner of card with a gentle scale/fade-in animation. Card might slightly elevate (increased shadow). If another card was selected, it reverts to default state. "Continue" button becomes enabled (Primary Button style).</description>
                    </state>
                    <state name=""My bank isn't listed" Tapped">
                        <description>Informational modal or inline message appears: "We're working to support more banks! For now, please proceed if your bank provides PDF statements you can upload manually. You can also request your bank via our support channel." (Body Regular). Link to support. "Continue" button might enable if manual upload is an immediate option, or user is guided back.</description>
                    </state>
                </screen>
                <screen name="Statement Import Instructions Screen">
                    <state name="Default View">
                        <description>`App Background (#FAFBFD)`. Header: "Back" arrow, Title "Import [Selected Bank Name] Statements" (H1). Friendly illustration (e.g., phone scanning statement, `Clarity Blue` & `Growth Green` accents). Headline "Ready to Import?" (H2). Instructional steps (Body Regular, `Midnight Ink`, with `Lucide CheckCircle` icons in `Clarity Blue`): 1. "Gather statements (up to 6 months, PDF/photos)." 2. "Ensure full, clear pages." 3. "ClariFi will securely process them." Primary Button "Scan Statement with Camera" (Icon: `Lucide Camera`). Secondary Button "Upload PDF File" (Icon: `Lucide FileText`). Buttons stacked vertically with 16dp spacing. Privacy Note (Caption, `Neutral Gray (Secondary)`) with link.</description>
                    </state>
                </screen>
                <screen name="Statement Capture / File Picker Screen">
                    <state name="Camera View (for "Scan Statement")">
                        <description>Native camera view. Overlay: semi-transparent with rectangular cutout. `Clarity Blue` corner guides animate subtly. Text "Align statement within frame." Capture button (large circular, `Pure White` with `Clarity Blue` border). Flash toggle (`Lucide Zap`), gallery access (`Lucide Image`). Real-time edge detection highlights document borders in `Growth Green`. Blur detection shows `Warning Amber` icon/message.</description>
                    </state>
                    <state name="PDF File Picker View (for "Upload PDF")">
                        <description>Native OS file picker interface is presented.</description>
                    </state>
                    <state name="Client-Side Preprocessing (after image/PDF selected)">
                        <description>Small modal/overlay: circular progress spinner (`Clarity Blue`), text "Optimizing image..." or "Preparing PDF...". User cannot interact.</description>
                    </state>
                    <state name="Preprocessing Error">
                        <description>Error message (e.g., "Image too blurry, please retake" or "Invalid PDF file") in `Error Red` text and `Lucide AlertTriangle` icon. Options "Try Again" (Secondary Button) or "Cancel" (Text Button).</description>
                    </state>
                    <state name="Ready to Upload (after preprocessing)">
                        <description>Thumbnail of preprocessed image/PDF icon shown. Text "Ready to upload [filename]?" Primary Button "Upload & Process".</description>
                    </state>
                </screen>
                <screen name="Statement Processing Progress Screen">
                    <state name="Uploading">
                        <description>`App Background`. Large animated `Lucide FileUp` icon (`Clarity Blue`, upward motion). Text "Uploading statement..." (H3, `Midnight Ink`). Linear progress bar (`Clarity Blue` fill on `Cloud Gray` track) showing upload percentage.</description>
                    </state>
                    <state name="Processing (Asynchronous - after upload confirmation)">
                        <description>Icon changes (e.g., to `Lucide BrainCircuit` with subtle animation). Text updates sequentially: "Processing statement..." -> "Extracting transactions..." -> "Categorizing expenses..." (H3, text animates/updates). Step indicator: 1. `Lucide Eye` (Reading document) - Active (`Clarity Blue`); 2. `Lucide ListChecks` (Extracting) - Pending (`Neutral Gray (Secondary)`), etc. Helper text "This may take a minute. Feel free to navigate away, we'll notify you." (Body Small, `Neutral Gray (Primary)`). Option to "Notify me when done" or "Wait here".</description>
                    </state>
                    <state name="Processing Error (Backend/API Error)">
                        <description>Error icon (`Lucide AlertTriangle`, `Error Red`). Text "Oops! Something went wrong..." (H3, `Midnight Ink`). "Please try uploading again or contact support." (Body Regular, `Neutral Gray (Primary)`). Secondary Button "Try Another Statement". Text Button "Go to Dashboard".</description>
                    </state>
                </screen>
                <screen name="Onboarding Complete Screen">
                    <state name="Celebration View">
                        <description>`App Background` or a subtle celebratory gradient (e.g., `Cloud Gray` to light `Growth Green` tint). Large animated `Lucide PartyPopper` or `CheckCircle` icon (`Growth Green` or `Wisdom Purple`), e.g., 80dp. Subtle confetti animation (`Clarity Blue`, `Growth Green`, `Wisdom Purple` particles). Headline "You're All Set, [User Name]!" (H1, `Midnight Ink`). Body Large "ClariFi is ready to bring you financial clarity." (`Neutral Gray (Primary)`). Optional: "We've started processing your first [N] statements!" Primary Button "Explore Your Dashboard" (`Clarity Blue` bg, `Pure White` text), full width, positioned towards bottom with subtle pulse animation. Text Button "Take a Quick Tour" (`Clarity Blue` text) below.</description>
                    </state>
                    <state name=""Explore Dashboard" Pressed">
                        <description>Smooth transition (e.g., fade out current, fade in new, or platform slide) to the Main Dashboard screen.</description>
                    </state>
                </screen>
            </ui_ux_summary>
            <api_relationships_backend>
                <api_endpoint method="POST" path="/auth/register">Supabase Auth for user creation.</api_endpoint>
                <api_endpoint method="POST" path="/auth/login">Supabase Auth for user login.</api_endpoint>
                <api_endpoint method="POST" path="/statements/upload-url">Generates a pre-signed URL for Supabase Storage.</api_endpoint>
                <api_endpoint method="POST" path="/statements/process-job">Confirms upload and adds job to BullMQ queue for OCR/categorization.</api_endpoint>
                <api_endpoint method="GET" path="/statements/job-status/:jobId">Client polls this for status updates on statement processing.</api_endpoint>
            </api_relationships_backend>
            <nfrs_feature>
                <nfr_item>Onboarding completion time (first statement queued): Target < 3 minutes.</nfr_item>
                <nfr_item>Client-side image preprocessing: Target file size reduction of >70% without critical loss of OCR readability.</nfr_item>
                <nfr_item>Statement processing (asynchronous backend job): Target P95 under 2 minutes from upload confirmation to data available in DB (after initial user backlog).</nfr_item>
                <nfr_item>Accessibility: All onboarding screens must be WCAG 2.1 AA compliant, including support for screen readers and dynamic font scaling.</nfr_item>
                <nfr_item>Reliability: Statement upload success rate >99% for supported formats and good quality images.</nfr_item>
            </nfrs_feature>
            <cost_optimizations_feature>
                <optimization>Aggressive client-side image preprocessing (compression, resizing, quality checks) to minimize data sent to OCR and reduce OCR API calls/costs.</optimization>
                <optimization>Immediate deletion of original statement files from Supabase Storage after successful data extraction by the backend to minimize storage costs (stay within free tier).</optimization>
                <optimization>Efficient polling mechanism for status updates rather than persistent WebSockets for MVP to conserve free tier PaaS resources, unless a very lightweight WebSocket solution within free limits is viable.</optimization>
                <optimization>Leverage Supabase free tiers for Auth (50K MAU) and Storage (1GB, used temporarily per upload).</optimization>
                <optimization>Guide users to provide high-quality images/PDFs to reduce OCR failures and reprocessing costs.</optimization>
            </cost_optimizations_feature>
        </feature>

        <feature id="5.2" name="AI-Powered Data Extraction & Categorization (Ultra Cost-Efficient)">
            <feature_goal>Implement a hyper-optimized OCR-to-LLM pipeline targeting <$0.15 per user/month for API costs through aggressive caching, minimal token usage, and smart fallbacks to achieve 85%+ initial AI categorization accuracy, with user corrections further improving the system.</feature_goal>
            <core_requirements>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>have my uploaded statements processed automatically in the background</i_want_to>
                    <so_that>I can continue using other parts of the app or close it without waiting for completion.</so_that>
                    <acceptance_criteria>
                        <criterion>Statement processing is handled by an asynchronous queue (BullMQ/Redis).</criterion>
                        <criterion>Users are informed that processing is happening and they will be notified (or can check status).</criterion>
                        <criterion>App remains fully responsive during background processing.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>see transactions accurately extracted (merchant, date, amount) from my statements by the OCR process</i_want_to>
                    <so_that>the data forming the basis of my budget is correct.</so_that>
                    <acceptance_criteria>
                        <criterion>Google Vision API is used for OCR with configurations optimized for Canadian bank statement formats.</criterion>
                        <criterion>Extraction accuracy for key fields (merchant, date, amount) is >95% for supported banks and good quality uploads.</criterion>
                        <criterion>System handles common date formats and currency symbols found on Canadian statements.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>have my extracted transactions intelligently categorized by AI (using cost-effective LLMs like Claude Haiku or GPT-3.5-Turbo) with minimal errors</i_want_to>
                    <so_that>I get an immediate understanding of my spending without manual effort.</so_that>
                    <acceptance_criteria>
                        <criterion>A merchant-to-category cache (Redis) is checked before any LLM call.</criterion>
                        <criterion>Client-side rule engine/pattern matching attempts categorization for very common/obvious merchants first.</criterion>
                        <criterion>LLM API calls use token-optimized prompts and are made only for uncached/unmatched transactions.</criterion>
                        <criterion>Initial AI categorization accuracy (before user correction) is >85%.</criterion>
                        <criterion>Target API cost for categorization is <$0.10 per statement (assuming average number of transactions).</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>easily review my categorized transactions and quickly correct any miscategorizations</i_want_to>
                    <so_that>my financial data is accurate and reflects my actual spending habits.</so_that>
                    <acceptance_criteria>
                        <criterion>A clear list of transactions with their AI-assigned categories is presented.</criterion>
                        <criterion>An intuitive interface (e.g., tap to edit, category picker modal) allows for quick correction of categories.</criterion>
                        <criterion>Bulk categorization options are available for similar uncategorized or miscategorized transactions.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>ClariFi system</as_a>
                    <i_want_to>learn from user corrections to improve the merchant-to-category cache</i_want_to>
                    <so_that>future categorizations for that user and potentially globally (anonymized) become more accurate and require fewer LLM calls.</so_that>
                    <acceptance_criteria>
                        <criterion>User corrections update their local/user-specific merchant cache mappings.</criterion>
                        <criterion>Aggregated, anonymized correction data is used to refine global merchant cache suggestions or rule-based fallbacks over time.</criterion>
                        <criterion>Target merchant cache hit rate is >90% after 2-3 months of user activity.</criterion>
                    </acceptance_criteria>
                </user_story>
            </core_requirements>
            <technical_summary>
                <frontend>React Native/Expo. Screens/components for displaying processing status, a detailed Transaction Review List (with items showing merchant, amount, category), a Category Selection Modal for corrections, and UI for bulk actions. Client-side rule engine for pre-filtering common merchant patterns to reduce backend load.</frontend>
                <backend>NestJS. Statement processor module (BullMQ worker). Orchestrates:
                    1. Fetching raw text from OCR (Google Vision).
                    2. Parsing text to identify potential transactions.
                    3. Checking Redis merchant cache.
                    4. (If cache miss/low confidence) Checking client-side pattern matches (if any passed from client).
                    5. (If still needed) Calling LLM (Claude Haiku/GPT-3.5-Turbo) with token-optimized prompts for categorization.
                    6. Storing categorized transactions in PostgreSQL (Supabase).
                    7. Updating Redis merchant cache with new/corrected mappings.
                    API endpoints for initiating processing (from Feature 1), getting status, and submitting corrections.
                </backend>
                <ai_llm_integration>Google Vision API for OCR. Claude Haiku or GPT-3.5-Turbo for categorization. Prompts designed for structured JSON output, minimal token usage. No GPT-4 for MVP categorization. Focus on prompt engineering for accuracy with cheaper models.</ai_llm_integration>
                <database>Supabase/PostgreSQL: `transactions` table (stores `user_id`, `statement_import_id`, `date`, `description`, `amount`, `category_id`, `merchant_name_normalized`, `is_recurring`, `user_corrected_category_id`). `categories` table (system and user-defined). `merchants` table (for learned global mappings, `normalized_name`, `category_id`, `confidence_score`, `usage_count`). Redis (Upstash) for fast L1 merchant cache (key: normalized merchant name, value: category_id).</database>
            </technical_summary>
            <ui_ux_summary>
                <screen name="Statement Processing Status Screen (Modal or Full Screen)">
                    <state name="Active Processing View">
                        <description>`App Background (#FAFBFD)` or a semi-transparent overlay if modal. Large animated icon (e.g., `Lucide Bot` with cogwheels or `Lucide BrainCircuit` with pulsing nodes, `Clarity Blue`), 64dp. Headline (H2, `Midnight Ink`): "ClariFi is Working Its Magic!" Sub-headline (Body Regular, `Neutral Gray (Primary)`): "Analyzing your statement to extract and categorize transactions." Step-by-step progress indicator:
                            1. `Lucide ScanLine` "Reading Document" - Text `Clarity Blue`, icon `Clarity Blue` (when active).
                            2. `Lucide ListChecks` "Extracting Transactions" - Text `Neutral Gray (Secondary)` (pending), then `Clarity Blue` (active).
                            3. `Lucide Tags` "Categorizing Expenses" - Text `Neutral Gray (Secondary)` (pending), then `Clarity Blue` (active).
                            4. `Lucide Sparkles` "Finding Insights" - Text `Neutral Gray (Secondary)` (pending), then `Clarity Blue` (active).
                        Each step gets a `Success Green` checkmark (`Lucide CheckCircle`) upon completion with a brief, satisfying animation (e.g., pop and fade). A subtle linear progress bar at the bottom can show overall progress. Optional: "This usually takes 30-90 seconds per statement." (Caption, `Neutral Gray (Secondary)`). User can navigate away; processing continues in background.</description>
                    </state>
                    <state name="Processing Error (e.g., OCR Failure, LLM Unresponsive)">
                        <description>Icon changes to `Lucide AlertTriangle` (64dp, `Error Red`) with a subtle shake animation. Headline (H2, `Error Red`): "Processing Issue." Sub-headline (Body Regular, `Neutral Gray (Primary)`): "We encountered a problem while processing your statement: [Brief, user-friendly error message, e.g., 'Could not read text clearly' or 'AI categorization service is temporarily unavailable']." Primary Button "Try Reprocessing" (`Clarity Blue` bg). Secondary Button "Review Manually Later" (Style Guide: Secondary Button). Text Link "Contact Support" (`Clarity Blue`).</description>
                    </state>
                    <state name="Processing Complete & Successful">
                        <description>Large `Lucide PartyPopper` or `CheckCircle` icon (64dp, `Success Green`) with celebratory animation. Headline (H2, `Midnight Ink`): "All Done!" Sub-headline (Body Regular, `Neutral Gray (Primary)`): "[Number] transactions have been extracted and categorized." Primary Button "Review Transactions" (`Clarity Blue` bg). Auto-transition to Transaction Review Screen after 2-3 seconds if no interaction, or on button press.</description>
                    </state>
                </screen>
                <screen name="Transaction Review Screen">
                    <state name="Default List View (with data)">
                        <description>`App Background (#FAFBFD)`. Header: "Review Transactions" (H1, `Midnight Ink`), statement source/date (Body Small, `Neutral Gray (Primary)`). Filter/Sort options icon (`LucideSlidersHorizontal`, `Clarity Blue`) in header right. Sticky date section headers (e.g., "October 26, 2024" - H3 Style, `Midnight Ink` on `Cloud Gray` subtle background bar). Transactions listed as cards (Style Guide: Card - `Pure White` bg, 16dp radius, subtle shadow, 16dp padding). Each transaction card:
                            - Left: Category icon (`Lucide [CategoryIcon]`, 24dp, colored by category or `Clarity Blue`).
                            - Center: Merchant Name (Body Large, `Midnight Ink`), Original Description (Caption, `Neutral Gray (Secondary)` below merchant).
                            - Right: Amount (Body Large, Bold, `Midnight Ink` for expenses, `Growth Green` for income). Assigned Category (Body Small, `Neutral Gray (Primary)`) below amount.
                        Tapping a transaction card navigates to Edit Transaction Screen/Modal. Long-press could initiate multi-select mode. Pull-to-refresh is NOT for re-categorizing all, but for syncing any new statements if applicable here (unlikely for this specific review screen).</description>
                    </state>
                    <state name="Empty State (No transactions or after filtering yields no results)">
                        <description>Centered illustration (e.g., `Lucide FileSearch` with a question mark, 80dp, `Neutral Gray (Secondary)`). Headline (H2, `Midnight Ink`): "No Transactions Found." Body Regular (`Neutral Gray (Primary)`): "Either no transactions were extracted, or your filters didn't match any. Try adjusting your filters or importing another statement." Primary Button "Import New Statement" (if contextually appropriate).</description>
                    </state>
                    <state name="Loading State (e.g., initial load, applying filters)">
                        <description>Skeleton screen: Placeholder cards with shimmering `Cloud Gray` blocks for text lines and icons. Or a centered circular spinner (`Clarity Blue`, 32dp) with "Loading transactions..." text (Body Regular, `Neutral Gray (Primary)`).</description>
                    </state>
                </screen>
                <screen name="Edit Transaction Screen (Modal or Full Screen)">
                    <state name="Default Edit View">
                        <description>If modal, slides up from bottom (Style Guide: Card style with shadow, `Pure White` bg). If full screen, standard header with "Back" arrow and "Edit Transaction" title (H2). Form fields (Style Guide: Input Field style):
                            - Merchant Name: Text input, pre-filled.
                            - Amount: Numeric input, pre-filled.
                            - Date: Date picker, pre-filled.
                            - Category: Dropdown/Picker showing current category, opens Category Selection Modal on tap. Icon `Lucide ChevronDown`.
                            - Notes: Optional multi-line text input.
                        Primary Button "Save Changes" (`Clarity Blue` bg). Text Button "Cancel" (`Clarity Blue` text). Buttons at bottom. Real-time validation on amount/date.</description>
                    </state>
                    <state name="Saving State">
                        <description>"Save Changes" button shows centered circular spinner (`Pure White` on `Clarity Blue` bg). Fields become non-interactive.</description>
                    </state>
                    <state name="Save Error State">
                        <description>Toast/banner message: "Could not save changes. Please try again." (`Error` bg, `Pure White` text). "Save Changes" button reverts to enabled.</description>
                    </state>
                </screen>
                <screen name="Category Selection Modal (for editing a transaction's category)">
                    <state name="Default View">
                        <description>Bottom sheet modal (slides up, `Pure White` bg, 16dp top corner radius, drag handle at top). Header "Select Category" (H3, `Midnight Ink`). Search input field (Style Guide: Input Field) at top of modal content. List of categories (scrollable):
                            - Each item: Category icon (`Lucide [CategoryIcon]`, 24dp, colored by category or `Clarity Blue`), Category Name (Body Regular, `Midnight Ink`).
                            - Current category has a `Lucide Check` icon (`Clarity Blue`) on the right.
                            - Tapping a category selects it and closes the modal with an animation.
                        "Create New Category" option (Text Button, `Clarity Blue`, `Lucide PlusCircle` icon) at the bottom of the list.</description>
                    </state>
                    <state name="Search Active State">
                        <description>As user types in search, category list filters in real-time. Non-matching items fade/filter out. "No results found" message if applicable.</description>
                    </state>
                </screen>
            </ui_ux_summary>
            <api_relationships_backend>
                <api_endpoint method="INTERNAL_JOB">Statement Processor (BullMQ worker) calls Google Vision API.</api_endpoint>
                <api_endpoint method="INTERNAL_JOB">Statement Processor calls Claude Haiku/GPT-3.5-Turbo API.</api_endpoint>
                <api_endpoint method="INTERNAL_SERVICE">Interaction with Redis (Upstash) for merchant cache get/set.</api_endpoint>
                <api_endpoint method="POST" path="/transactions/:id/correct-category">User submits a category correction for a transaction. Updates user-specific cache and flags for global learning.</api_endpoint>
                <api_endpoint method="GET" path="/transactions">Fetches paginated list of transactions for review (with filters for date, category, etc.).</api_endpoint>
                <api_endpoint method="GET" path="/categories">Returns list of system and user-defined categories.</api_endpoint>
            </api_relationships_backend>
            <nfrs_feature>
                <nfr_item>OCR Accuracy (Google Vision): >95% for key fields on supported bank statement formats.</nfr_item>
                <nfr_item>AI Categorization Accuracy (LLM + Cache, pre-user correction): >85%.</nfr_item>
                <nfr_item>Merchant Cache Hit Rate (after 2-3 months of user activity): >90%.</nfr_item>
                <nfr_item>LLM Token Usage: Average <100 tokens per unique transaction categorization (after cache miss).</nfr_item>
                <nfr_item>End-to-End Statement Processing Time (P95, after upload, for 3-5 page statement): <2 minutes.</nfr_item>
                <nfr_item>Transaction Review Screen Load Time (for a month's data): <1.5 seconds.</nfr_item>
            </nfrs_feature>
            <cost_optimizations_feature>
                <optimization>Aggressive Redis caching of merchant-to-category mappings; user corrections update this cache to improve hit rate.</optimization>
                <optimization>Client-side rule engine/pattern matching for very common, unambiguous merchants to avoid any backend/API call for these.</optimization>
                <optimization>Use cheapest viable LLM (Claude Haiku or similar) for bulk categorization; GPT-3.5-Turbo as a slightly more capable but still cost-effective option. No GPT-4 for MVP categorization.</optimization>
                <optimization>Meticulous prompt engineering for LLMs to minimize input/output tokens per categorization request, including requesting structured JSON output.</optimization>
                <optimization>Batch multiple uncached transactions (from a single statement) into fewer LLM API calls if the API supports it and it proves cost-effective.</optimization>
                <optimization>Strict monitoring of API costs with alerts if approaching budget thresholds (target <$0.15/user/month for OCR+LLM combined).</optimization>
                <optimization>Temporary storage of raw OCR text (e.g., 7 days) for reprocessing with updated prompts/logic if initial categorization is poor, avoiding repeated OCR costs.</optimization>
            </cost_optimizations_feature>
        </feature>
                <feature id="5.3" name="Instant Budget Dashboard & Insights">
            <feature_goal>Deliver a beautiful, fully client-side dashboard with offline capabilities, pre-computed insights during statement processing, and zero backend calls for viewing to eliminate recurring costs, providing users with instant clarity on their spending.</feature_goal>
            <core_requirements>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>see a clear, visually appealing summary of my income, expenses, and savings for the current period immediately upon opening the dashboard</i_want_to>
                    <so_that>I can quickly understand my overall financial status.</so_that>
                    <acceptance_criteria>
                        <criterion>Dashboard loads in <1 second with cached/locally stored data.</criterion>
                        <criterion>Key metrics (total income, total expenses, net savings/overspending) are prominently displayed using H2/H1 typography and relevant accent colors (`Growth Green` for savings, `Error Red` for overspending).</criterion>
                        <criterion>Summary cards are used for these key metrics, styled according to the Style Guide.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>see a breakdown of my spending by category in an easy-to-understand visual format (e.g., pie chart, bar chart)</i_want_to>
                    <so_that>I can identify my major spending areas.</so_that>
                    <acceptance_criteria>
                        <criterion>A spending chart (custom SVG, no heavy libraries) is displayed, showing proportions for top 5-7 categories and an "Other" category.</criterion>
                        <criterion>Chart segments use distinct, accessible colors (potentially derived from category colors or a defined chart palette within the Style Guide).</criterion>
                        <criterion>Chart animations are smooth (60fps) and non-distracting during initial load or data updates.</criterion>
                        <criterion>Tapping a chart segment highlights it and shows the category name and amount/percentage in a tooltip or linked list.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>view my spending trends over the last few months (if data is available)</i_want_to>
                    <so_that>I can see if my spending in key categories is increasing or decreasing.</so_that>
                    <acceptance_criteria>
                        <criterion>A simple trend indicator (e.g., up/down arrow with percentage change next to category spending) is shown compared to the previous period.</criterion>
                        <criterion>If more historical data exists (up to 6-12 months locally), a simple line or bar chart can show trends for overall spending or selected categories.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>access my dashboard and last processed insights even when I am offline</i_want_to>
                    <so_that>I can check my finances anytime, anywhere.</so_that>
                    <acceptance_criteria>
                        <criterion>All data required for dashboard display (summaries, transactions for the current/last period, pre-computed insights) is stored locally using AsyncStorage.</criterion>
                        <criterion>The dashboard is fully functional for viewing when the device is offline.</criterion>
                        <criterion>A clear indicator is shown if the data might be stale due to being offline, with a prompt to sync when connectivity returns.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>be able to export my monthly summary or transaction list from the dashboard</i_want_to>
                    <so_that>I can use it for my own records or share it if needed.</so_that>
                    <acceptance_criteria>
                        <criterion>An export option is available (e.g., via a share icon or menu).</criterion>
                        <criterion>Data can be exported client-side into CSV and JSON formats.</criterion>
                        <criterion>A simple PDF summary export (client-side generation) is also available.</criterion>
                    </acceptance_criteria>
                </user_story>
            </core_requirements>
            <technical_summary>
                <frontend>React Native/Expo. Dashboard screen with components for Month Selector, Summary Cards (Income, Expenses, Savings), Spending Chart (custom SVG using `react-native-svg` or similar, no heavy external charting libraries), Category Breakdown list, Insights Feed. All calculations and rendering are client-side using data stored in AsyncStorage. Pre-computation of summaries and insights happens during the statement import/categorization process and results are stored locally. Client-side logic for generating CSV/JSON/simple PDF exports.</frontend>
                <backend>NestJS. No direct backend API calls for *viewing* the dashboard. The backend's role is to provide the processed transaction data (via Feature 5.2) which is then stored client-side. An optional, very lightweight endpoint might exist for the client to ping if it wants to trigger a background sync of *newly available processed statements* if the app was closed during processing, but the dashboard itself reads from local data.</backend>
                <ai_llm_integration>No direct LLM calls for dashboard display. "Pre-computed insights" are generated by the LLM during the Feature 5.2 (AI Categorization) process and stored with the transaction data. The dashboard merely displays these stored insights.</ai_llm_integration>
                <database>Client-Side: AsyncStorage is the primary "database" for this feature. It stores monthly summaries (total income, expenses, category breakdowns, top merchants, pre-computed insights) and potentially a cache of recent transactions for the current/selected period. Structure to allow for ~6-12 months of summary data. Target <50KB data per month stored locally. Server-Side (Supabase/PostgreSQL): Holds the master transaction data, but is not queried directly for dashboard rendering in real-time to save costs.</database>
            </technical_summary>
            <ui_ux_summary>
                <screen name="Main Dashboard Screen">
                    <state name="Default View (Current Month Data)">
                        <description>`App Background (#FAFBFD)`. Header: "Dashboard" (H1, `Midnight Ink`), potentially with a small, friendly greeting like "Hello, [User Name]!" (Body Regular, `Neutral Gray (Primary)`). Month selector pills (e.g., "Oct", "Nov", "Dec") horizontally scrollable, current month active (`Clarity Blue` bg, `Pure White` text), others (`Cloud Gray` bg, `Midnight Ink` text).
                        **Summary Section:** Three horizontally scrollable or fixed prominent cards (Style Guide: Card - `Pure White` bg, 16dp radius, shadow, 24dp padding) at the top:
                            1.  **Income Card:** `Lucide TrendingUp` icon (24dp, `Growth Green`). Title "Income this Month" (H3, `Midnight Ink`). Amount (H1 style but slightly smaller, e.g., 28dp Bold, `Growth Green`). Subtext "vs. [Avg/Last Month]" (Caption, `Neutral Gray (Secondary)`).
                            2.  **Expenses Card:** `Lucide ShoppingCart` icon (24dp, `Clarity Blue`). Title "Expenses this Month" (H3, `Midnight Ink`). Amount (H1 style but smaller, 28dp Bold, `Midnight Ink`). Subtext with top category (Caption, `Neutral Gray (Secondary)`).
                            3.  **Savings/Net Card:** `Lucide PiggyBank` icon (24dp, `Wisdom Purple`). Title "Net Savings" (H3, `Midnight Ink`). Amount (H1 style but smaller, 28dp Bold, color conditional: `Growth Green` if positive, `Error Red` if negative). Subtext "([X]% of Income)" (Caption, `Neutral Gray (Secondary)`).
                        **Spending Breakdown Section:** Title "Spending by Category" (H2, `Midnight Ink`).
                            -   **Chart:** Custom SVG Pie Chart or Bar Chart (user toggleable via small icon button `Lucide PieChart`/`BarChart2` in `Clarity Blue`). Smooth animation (60fps) on load/data change. Segments colored using a predefined accessible chart palette (can be derived from Style Guide accents or a dedicated chart color set). Interactive: tapping a segment highlights it (e.g., slight extrusion/brighter color) and displays category name & amount in a tooltip or a linked list item below.
                            -   **List:** Below chart, a list of top 5-7 categories. Each item: Category color dot (8dp), Category Name (Body Regular, `Midnight Ink`), Amount (Body Regular, `Midnight Ink`, right-aligned), Percentage of total expenses (Body Small, `Neutral Gray (Primary)`). Progress bar visual for each category relative to total spending or budget (if set).
                        **Insights Section:** Title "ClariFi Insights" (H2, `Midnight Ink`). Horizontally scrollable row of 2-3 Insight Cards (Style Guide: Card, potentially with accent color border e.g., `Wisdom Purple` for general insight, `Warning Amber` for an alert). Each card: Icon (`Lucide Lightbulb`, `Lucide AlertTriangle`), Insight Title (H3), Brief Description (Body Small). Tap to expand/view detail.
                        **Floating Action Button (FAB):** Optional, `Lucide Plus` icon, `Clarity Blue` background, for "Add Manual Transaction" or "Import New Statement".
                        All numerical values animate smoothly when updated (e.g., number counting up).</description>
                    </state>
                    <state name="Loading State (Initial load or month switch)">
                        <description>Skeleton screens for summary cards, chart area, and category list. `Cloud Gray` placeholder shapes with subtle shimmer animation (Style Guide: Loading States). Text "Loading your financial overview..." (Body Regular, `Neutral Gray (Primary)`) can be displayed centrally if loading takes more than 1-2 seconds. Animations are smooth and non-jarring.</description>
                    </state>
                    <state name="Empty State (No data imported yet for any month)">
                        <description>Centered illustration (e.g., `Lucide FilePlus` with a friendly piggy bank, 80dp, `Neutral Gray (Secondary)`). Headline (H2, `Midnight Ink`): "Your Dashboard Awaits!" Body Regular (`Neutral Gray (Primary)`): "Import your first statement to see your financial insights and start budgeting with ClariFi." Primary Button "Import First Statement" (`Clarity Blue` bg), navigates to statement import flow.</description>
                    </state>
                    <state name="Offline State">
                        <description>Dashboard displays last synced data. A small, non-intrusive banner at the top or bottom of the screen: "Offline - Showing last updated data. Sync when online." (Caption style, `Neutral Gray (Primary)` background, `Midnight Ink` text, `Lucide WifiOff` icon). All viewing functionality remains active. Export button might be disabled or inform user it requires online for some formats if they involve server-side generation (though MVP aims for client-side).</description>
                    </state>
                </screen>
                <screen name="Data Export Options Screen (Modal)">
                    <state name="Default View">
                        <description>Bottom sheet modal (slides up, `Pure White` bg, 16dp top radius, drag handle). Header "Export Data" (H3, `Midnight Ink`).
                        Options list:
                            - "Export Current Month Summary (PDF)" (`Lucide FileText`, `Clarity Blue` icon).
                            - "Export Current Month Transactions (CSV)" (`Lucide List`, `Clarity Blue` icon).
                            - "Export All My Data (JSON)" (`Lucide Database`, `Clarity Blue` icon).
                        Each option is a tappable row with text (Body Regular, `Midnight Ink`).
                        Brief description below each option (Caption, `Neutral Gray (Secondary)`).
                        "Cancel" Text Button at the bottom.</description>
                    </state>
                    <state name="Export in Progress State">
                        <description>After tapping an export option, a small overlay/toast appears: "Generating your [Format] export..." with a circular spinner (`Clarity Blue`). User can still interact with the modal (e.g., to cancel if export takes too long, though client-side should be fast).</description>
                    </state>
                    <state name="Export Complete / Share State">
                        <description>Native OS Share Sheet is triggered with the generated file (CSV, JSON, or client-generated simple PDF). A success toast "Export ready to share!" (`Success Green` bg, `Pure White` text) appears briefly.</description>
                    </state>
                    <state name="Export Error State">
                        <description>Toast message: "Could not generate export. Please try again." (`Error Red` bg, `Pure White` text).</description>
                    </state>
                </screen>
            </ui_ux_summary>
            <api_relationships_backend>
                <api_endpoint method="NONE_FOR_VIEWING">Dashboard data is read entirely from client-side AsyncStorage. No direct backend API calls are made to render the dashboard to ensure zero recurring viewing costs and full offline capability.</api_endpoint>
                <api_endpoint method="BACKGROUND_SYNC_OPTIONAL">A potential lightweight endpoint `GET /statements/latest-processed-status?lastKnownJobId=[ID]` could be polled very infrequently by the client (e.g., on app open after a long period) to see if new statements were processed in the background while the app was closed, to then trigger a client-side data refresh from its local master data store (which would have been updated by the statement processing feature).</api_endpoint>
            </api_relationships_backend>
            <nfrs_feature>
                <nfr_item>Dashboard Initial Load Time (from local data): <1 second.</nfr_item>
                <nfr_item>Animations & Transitions: Maintain 60fps for all dashboard interactions and animations.</nfr_item>
                <nfr_item>Offline Functionality: 100% of dashboard viewing and interaction with last synced data must be available offline.</nfr_item>
                <nfr_item>Local Data Storage Footprint (for dashboard summaries & recent transactions): Target <50KB per month of data, aiming to store 6-12 months of summary data comfortably within typical device storage.</nfr_item>
                <nfr_item>Client-Side Export Generation Time (CSV/JSON): <5 seconds for a typical month's data.</nfr_item>
            </nfrs_feature>
            <cost_optimizations_feature>
                <optimization>All dashboard rendering, calculations, and insights display are performed 100% client-side using data stored in AsyncStorage, resulting in zero backend API calls or server processing costs for viewing.</optimization>
                <optimization>"Insights" are pre-computed during the statement import/categorization phase (Feature 5.2) and stored locally, not generated on-the-fly by the dashboard.</optimization>
                <optimization>Use of performant, built-in React Native components (e.g., `react-native-svg` for custom charts) instead of heavy third-party charting libraries to keep app bundle size small and rendering efficient.</optimization>
                <optimization>Data export (CSV, JSON, simple PDF) is generated entirely client-side, avoiding server-side processing and file storage costs for exports.</optimization>
                <optimization>Efficient data structures in AsyncStorage and memoized calculations in the frontend to ensure performance even with several months of data.</optimization>
            </cost_optimizations_feature>
        </feature>
        <feature id="5.4" name="Credit Card Setup & Utilization Tracking">
            <feature_goal>Enable users to easily add and manage their credit cards within ClariFi, with all utilization calculations, tracking, and basic predictive alerts performed entirely client-side to eliminate backend processing costs while providing accurate and actionable information.</feature_goal>
            <core_requirements>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>manually add my credit card details (nickname, credit limit, statement closing day, payment due days)</i_want_to>
                    <so_that>ClariFi can track its utilization and provide relevant alerts.</so_that>
                    <acceptance_criteria>
                        <criterion>A simple form allows input of card nickname, limit, statement day (1-31), and payment due days after statement.</criterion>
                        <criterion>Input validation ensures data integrity (e.g., statement day is valid, limit is numeric).</criterion>
                        <criterion>Users can add multiple cards (target support for 10+ cards locally).</criterion>
                        <criterion>Added card details are stored securely on the client device (AsyncStorage).</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>see a clear visual representation of my current utilization for each credit card and my overall utilization</i_want_to>
                    <so_that>I can quickly understand my credit health.</so_that>
                    <acceptance_criteria>
                        <criterion>Each card displays its current balance (manually updated or derived from transactions), credit limit, and utilization percentage.</criterion>
                        <criterion>Utilization is shown with a visual indicator (e.g., gauge, progress bar) colored according to risk (e.g., Green for <30%, Yellow for 30-50%, Red for >50%).</criterion>
                        <criterion>An overall utilization across all cards is also displayed if multiple cards are added.</criterion>
                        <criterion>All calculations are performed client-side and update in real-time based on local data.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>easily log payments made to my credit cards</i_want_to>
                    <so_that>my balance and utilization information in ClariFi remains accurate.</so_that>
                    <acceptance_criteria>
                        <criterion>A simple interface allows users to log a payment amount and date for a specific card.</criterion>
                        <criterion>Logging a payment updates the card's current balance and utilization percentage in real-time on the client.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>see upcoming statement closing dates and payment due dates for my cards</i_want_to>
                    <so_that>I can plan my payments effectively.</so_that>
                    <acceptance_criteria>
                        <criterion>The app accurately calculates and displays the next statement closing date and payment due date for each card based on user input.</criterion>
                        <criterion>A countdown or clear date display is provided for these key dates.</criterion>
                    </acceptance_criteria>
                </user_story>
            </core_requirements>
            <technical_summary>
                <frontend>React Native/Expo. Screens for Cards List, Add/Edit Card Form, Card Detail View. All card data (nickname, limit, statement day, due days, manually entered balance/payments) stored in AsyncStorage. All calculations (utilization, next statement/due dates) performed client-side using JavaScript date/math logic. Local notification scheduling (via Expo Local Notifications) for payment reminders based on these client-side calculations. UI components for displaying card information, utilization gauges (custom SVG or simple progress bars), and input forms.</frontend>
                <backend>NestJS. No backend involvement for core card setup, utilization tracking, or alert scheduling for this feature in MVP to ensure zero recurring server costs. Backend is not aware of specific card details beyond what might be inferred from statement processing (Feature 5.2), and even then, it doesn't store these specific card parameters like limit or statement day for this feature.</backend>
                <ai_llm_integration>None for this feature in MVP. Predictive alerts are based on simple client-side patterns or user-set reminders, not complex AI/ML models.</ai_llm_integration>
                <database>Client-Side: AsyncStorage is the sole database for this feature. Stores an array of card objects, each containing `id`, `nickname`, `lastFourDigits` (optional, if user wants to add), `creditLimit`, `statementDay`, `paymentDueDays`, `currentBalance` (manually updated by user or via logged payments), `colorTag` (user-selected for UI). Also stores `utilization_settings` (target utilization, alert preferences). Server-Side (Supabase/PostgreSQL): No specific tables for this feature's core data to maintain zero backend cost.</database>
            </technical_summary>
            <ui_ux_summary>
                <screen name="Cards List Screen">
                    <state name="Empty State (No cards added)">
                        <description>`App Background (#FAFBFD)`. Centered illustration (e.g., `Lucide CreditCard` with a `Lucide PlusCircle` icon, 80dp, `Neutral Gray (Secondary)`). Headline (H2, `Midnight Ink`): "Add Your Credit Cards". Body Regular (`Neutral Gray (Primary)`): "Track utilization, get payment reminders, and optimize your credit health all in one place." Primary Button "Add First Card" (`Clarity Blue` bg, `Pure White` text, `Lucide Plus` icon).</description>
                    </state>
                    <state name="Default View (With Cards)">
                        <description>`App Background (#FAFBFD)`. Header: "My Cards" (H1, `Midnight Ink`). Optional: Small badge showing overall average utilization if more than one card. Vertically scrollable list of cards. Each card item (Style Guide: Card - `Pure White` bg, 16dp radius, shadow, 16dp padding):
                            - Top: Card Nickname (H3, `Midnight Ink`), Bank Name (Body Small, `Neutral Gray (Primary)` if provided). `Lucide MoreVertical` icon on right for Edit/Delete.
                            - Middle: Large Utilization Percentage (e.g., 28dp Bold, color-coded: `Growth Green` <30%, `Warning Amber` 30-70%, `Error Red` >70%). Below it, "Current Balance: $[Amount] / Limit: $[Amount]" (Body Small, `Neutral Gray (Primary)`).
                            - Bottom: Visual Utilization Bar (linear progress bar, 8dp height, color-coded like percentage text).
                            - Footer: "Statement in [X] days" or "Payment due in [Y] days" (Caption, `Clarity Blue` or `Warning Amber`).
                        Tapping a card navigates to Card Detail Screen. Floating Action Button (FAB) (`Clarity Blue` bg, `Lucide Plus` icon in `Pure White`, 56dp) at bottom right to add a new card.</description>
                    </state>
                    <state name="Card Item Pressed State">
                        <description>Card item shows pressed state (e.g., slight scale down to 0.98, increased shadow intensity) for 150ms before navigating.</description>
                    </state>
                </screen>
                <screen name="Add/Edit Card Screen (Modal or Full Screen)">
                    <state name="Default Input View">
                        <description>If modal, slides up (`Pure White` bg, 16dp top radius). Header: "Add New Card" or "Edit [Card Nickname]" (H2, `Midnight Ink`), "Cancel" Text Button (left), "Save" Primary Button (right, initially disabled). Form fields (Style Guide: Input Field style) with labels (Caption style, `Neutral Gray (Primary)`) above each:
                            - Card Nickname (e.g., "TD Aeroplan Visa").
                            - Credit Limit (Numeric input, currency pre-filled based on locale).
                            - Statement Closing Day (Picker for 1-31). Helper text: "The day your statement usually closes each month."
                            - Payment Due Days After Statement (Picker for 1-30, e.g., "21 days"). Helper text: "How many days after statement closing is your payment due?"
                            - Optional: Bank Name (Dropdown of common Canadian banks or text input).
                            - Optional: Last 4 Digits (Numeric input, for user reference only).
                        "Save" button enables when required fields (Nickname, Limit, Statement Day) are valid.</description>
                    </state>
                    <state name="Input Validation Error">
                        <description>Invalid field gets `Error Red` border. Helper text below input (Caption, `Error Red`), e.g., "Please enter a valid number."</description>
                    </state>
                    <state name="Saving State">
                        <description>"Save" button shows centered circular spinner (`Pure White` on `Clarity Blue` bg). Fields non-interactive.</description>
                    </state>
                    <state name="Save Success">
                        <description>Brief success toast "Card saved!" (`Success Green` bg). Modal dismisses or navigates back to Cards List Screen. New/updated card animates into list.</description>
                    </state>
                </screen>
                <screen name="Card Detail Screen">
                    <state name="Overview State">
                        <description>`App Background (#FAFBFD)`. Header: Card Nickname (H1, `Midnight Ink`), "Back" arrow. Large visual representation of the card at the top (can be a stylized card with user-chosen color/gradient, bank logo if selected, last 4 digits).
                        **Key Metrics Section (Card style):**
                            - Current Balance (H1 size, `Midnight Ink`).
                            - Credit Limit (Body Regular, `Neutral Gray (Primary)`).
                            - Utilization Percentage (Large, e.g., 40dp Bold, color-coded: `Growth Green`, `Warning Amber`, `Error Red`).
                            - Visual Utilization Gauge (large circular progress, animated, Style Guide colors).
                        **Dates Section (Card style):**
                            - "Next Statement Date: [Date] ([X] days)" (Body Large, `Midnight Ink`).
                            - "Payment Due Date: [Date] ([Y] days)" (Body Large, `Midnight Ink`).
                        **Actions Section:**
                            - Primary Button "Log Payment" (`Clarity Blue` bg).
                            - Secondary Button "View Transactions for this Card" (if transactions are associated from statements).
                            - Text Button "Edit Card Details" (`Clarity Blue` text).
                        **Recent Payments (if any logged for this card):** List of recent payments (Date, Amount).</description>
                    </state>
                    <state name="Logging Payment (Modal from Card Detail)">
                        <description>Modal slides up. Title "Log Payment for [Card Nickname]" (H3). Amount input (Numeric). Date picker (defaults to today). Optional "Notes" field. "Save Payment" Primary Button. Updates balance and utilization on Card Detail screen in real-time upon saving, with smooth number animations.</description>
                    </state>
                </screen>
            </ui_ux_summary>
            <api_relationships_backend>
                <api_endpoint method="NONE">This feature is designed to be entirely client-side for MVP to minimize operational costs. All data is stored and processed locally on the user's device using AsyncStorage.</api_endpoint>
                <api_endpoint method="CLIENT_ONLY_NOTIFICATIONS">Uses Expo Local Notifications API for scheduling alerts.</api_endpoint>
            </api_relationships_backend>
            <nfrs_feature>
                <nfr_item>Accuracy: Date calculations for statement/due dates must be 100% accurate, handling month-end and leap year complexities.</nfr_item>
                <nfr_item>Performance: All utilization calculations and UI updates on balance change must be instantaneous (<50ms).</nfr_item>
                <nfr_item>Offline Capability: 100% functional offline as all data and logic are local.</nfr_item>
                <nfr_item>Data Persistence: Card data stored in AsyncStorage must persist reliably across app sessions and updates.</nfr_item>
                <nfr_item>Scalability (Local): App should handle 10+ cards with their associated data smoothly on device.</nfr_item>
            </nfrs_feature>
            <cost_optimizations_feature>
                <optimization>Entire feature is client-side, resulting in zero backend processing or storage costs for card management and utilization tracking.</optimization>
                <optimization>Local notifications (via Expo) are free, avoiding costs associated with server-side push notification infrastructure for these reminders.</optimization>
                <optimization>No API calls are made for core functionality, preserving API quotas for other features like OCR/LLM.</optimization>
                <optimization>Minimal data footprint in AsyncStorage by storing only essential card metadata and recent utilization history if needed for trends.</optimization>
            </cost_optimizations_feature>
        </feature>
        <feature id="5.5" name="Proactive Credit Utilization Alerts">
            <feature_goal>Deliver timely and actionable credit utilization alerts to users primarily via local device notifications, with a minimal server-side backup, to help them manage their credit effectively before statement closing dates, achieving a high delivery rate with near-zero operational costs.</feature_goal>
            <core_requirements>
                <user_story>
                    <as_a>user with at least one credit card set up</as_a>
                    <i_want_to>receive a notification a few days before my credit card statement closing date if my utilization is high</i_want_to>
                    <so_that>I have an opportunity to make a payment and lower my reported utilization to credit bureaus.</so_that>
                    <acceptance_criteria>
                        <criterion>Alerts are scheduled locally on the device based on the card's statement closing day and user-defined preferences (e.g., 3-7 days before).</criterion>
                        <criterion>The notification clearly states the card, current estimated utilization, and the upcoming statement date.</criterion>
                        <criterion>The notification provides a simple, actionable suggestion (e.g., "Pay down $[Amount] to reach [Target]% utilization").</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>customize when and how I receive utilization alerts</i_want_to>
                    <so_that>they are helpful and not intrusive.</so_that>
                    <acceptance_criteria>
                        <criterion>Users can enable/disable utilization alerts globally and per card.</criterion>
                        <criterion>Users can set the number of days before the statement date they wish to be alerted.</criterion>
                        <criterion>Users can define a utilization threshold (e.g., alert me if utilization is above 30%) that triggers an alert.</criterion>
                        <criterion>Users can set "quiet hours" during which notifications will be silenced or delayed.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>interact with the alert notification to quickly log a payment or view more details</i_want_to>
                    <so_that>I can take immediate action to manage my credit.</so_that>
                    <acceptance_criteria>
                        <criterion>Push notifications include actionable buttons (e.g., "Log Payment," "View Card Details").</criterion>
                        <criterion>Tapping an action deep-links directly to the relevant screen in the app (e.g., payment logging screen for the specific card).</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>ClariFi system</as_a>
                    <i_want_to>ensure high reliability for critical alerts with a minimal-cost server backup if local notifications fail or are not possible (e.g., app uninstalled, notifications disabled system-wide)</i_want_to>
                    <so_that>users don't miss crucial financial reminders.</so_that>
                    <acceptance_criteria>
                        <criterion>Primary notification delivery is via Expo Local Notifications scheduled on the client.</criterion>
                        <criterion>A minimal server-side cron job checks for critical upcoming alerts for users who have opted-in and whose local notifications might have failed (e.g., based on last app open time or if push token is available and no recent local confirmation received). This backup uses Expo Push Notifications (free tier) and is a low-volume fallback.</criterion>
                        <criterion>Target local notification delivery success rate >95%; server backup used for <5% of critical alerts.</criterion>
                    </acceptance_criteria>
                </user_story>
            </core_requirements>
            <technical_summary>
                <frontend>React Native/Expo. UI for Notification Settings screen (global and per-card preferences, quiet hours, test notification). Client-side logic (JavaScript) for:
                    - Calculating when alerts should be scheduled based on card statement dates and user preferences.
                    - Scheduling local notifications using `expo-notifications`.
                    - Constructing personalized notification content.
                    - Handling user interactions with notifications (deep linking).
                    - Storing notification preferences and history in AsyncStorage.
                    - Minimal logic to report to backend if a local notification was scheduled/delivered successfully (for server backup decisioning).
                </frontend>
                <backend>NestJS. Minimal module for notification backup. A simple cron job runs periodically (e.g., daily) to:
                    - Identify users with upcoming critical statement dates who might have missed local notifications (e.g., app not opened recently, or if a more complex delivery confirmation from client to server is implemented).
                    - For these few users, trigger a push notification via Expo Push Notification service (server-to-server).
                    - Store minimal data in PostgreSQL (Supabase) related to server-sent backup notifications (e.g., `user_id`, `notification_type`, `sent_at`, `status`).
                </backend>
                <ai_llm_integration>None for this feature in MVP. Alert timing and content are rule-based and preference-driven.</ai_llm_integration>
                <database>Client-Side (AsyncStorage): Stores `notification_schedule` (upcoming local notifications), `notification_preferences` (user settings), `notification_interaction_history`. Server-Side (Supabase/PostgreSQL): Minimal `notification_backup_log` table to track server-sent backup alerts for auditing and to avoid re-sending.</database>
            </technical_summary>
            <ui_ux_summary>
                <screen name="Notification Settings Screen">
                    <state name="Default View">
                        <description>`App Background (#FAFBFD)`. Header: "Notification Settings" (H1, `Midnight Ink`), "Back" arrow.
                        **Global Alerts Section (Card style):**
                            - Title "Credit Utilization Alerts" (H3, `Midnight Ink`).
                            - Master Toggle Switch (`Clarity Blue` when on) with label "Enable Utilization Alerts" (Body Regular).
                            - Description (Body Small, `Neutral Gray (Primary)`): "Get timely reminders to manage your credit utilization before your statement closes."
                        **When Master Toggle is ON (options slide down with 200ms ease-out animation):**
                            - "Alert me [X] days before statement closing": Slider component (1-7 days, `Clarity Blue` track/thumb), current value displayed (Body Regular).
                            - "If utilization is above [Y]%": Slider component (20%-90%, `Clarity Blue`), current value displayed.
                            - "Quiet Hours": Tappable row opening a time range picker. Displays "Set Quiet Hours" or "[Start Time] - [End Time]" (Body Regular, `Clarity Blue` if set). Icon `LucideMoon`.
                        **Per-Card Settings Section (Card style, appears if cards exist):**
                            - Title "Customize by Card" (H3, `Midnight Ink`).
                            - List of user's credit cards (Card Nickname, small bank logo). Each row has a toggle switch (`Clarity Blue` when on) to enable/disable alerts for that specific card.
                            - Tapping a card row (if alerts for it are on) could navigate to a detail screen to override global threshold/timing for that card (Post-MVP enhancement, for MVP global settings apply to all enabled cards).
                        "Test Notification" Text Button (`Clarity Blue`) at the bottom to trigger a sample alert.</description>
                    </state>
                    <state name="Time Picker Active (for Quiet Hours - Modal)">
                        <description>Native OS time picker or custom time range picker modal. `Clarity Blue` accents for selection. "Save" and "Cancel" buttons.</description>
                    </state>
                </screen>
                <screen name="Notification Display (System UI - Lock Screen/Banner)">
                    <state name="Standard Alert View">
                        <description>Uses native OS notification styling.
                            - **App Icon:** ClariFi logo.
                            - **Title:** "ClariFi Credit Alert" (Bold).
                            - **Body:** "Your [Card Nickname e.g., TD Visa] is at [XX]% utilization. Statement closes in [Y] days. Consider paying $[Amount] to reach [Target]%."
                            - **Rich Content (if platform supports):** May include a mini utilization gauge visual.
                            - **Actions (if platform supports):** Button 1: "View Details" (deep links to Card Detail screen). Button 2: "Log Payment" (deep links to payment logging for that card). Button 3: "Snooze 1 Day".
                        Colors used in rich content should be subtle and align with app branding where possible (e.g., `Clarity Blue` for accents, `Warning Amber` or `Error Red` for high utilization indication within the notification itself if possible).</description>
                    </state>
                </screen>
                <screen name="In-App Notification Banner (if app is open)">
                    <state name="Banner Display">
                        <description>A non-modal banner slides down from the top of the screen (over current content, which may dim slightly). `Cloud Gray (#F7F9FC)` or `Pure White (#FFFFFF)` background with subtle shadow.
                            - Left: Icon (`Lucide AlertTriangle` in `Warning Amber` or `Error Red` depending on utilization severity, or `Lucide Bell` in `Clarity Blue` for general reminder).
                            - Center: Title "Credit Alert: [Card Nickname]" (Body Large, `Midnight Ink`). Message "Currently [XX]% utilized. Statement in [Y] days." (Body Small, `Neutral Gray (Primary)`).
                            - Right: "Dismiss" (Text Button, `Neutral Gray (Secondary)`) or `Lucide X` icon.
                        Tapping the banner deep links to the Card Detail screen. Auto-dismisses after 5-8 seconds with a slide-up animation if not interacted with.</description>
                    </state>
                </screen>
                <screen name="Alert Response Screen (Deep linked from notification - e.g., Log Payment)">
                    <state name="Pre-filled Payment Log View">
                        <description>Navigates directly to the "Log Payment" screen (as defined in Feature 5.4 UI/UX) for the specific card mentioned in the alert.
                        The "Amount" field may be pre-filled with the *suggested payment amount* from the notification.
                        User can confirm or adjust and save.
                        A small header or context message "Responding to alert for [Card Nickname]" (Caption, `Neutral Gray (Primary)`) might be shown.</description>
                    </state>
                </screen>
            </ui_ux_summary>
            <api_relationships_backend>
                <api_endpoint method="POST" path="/notifications/register-push-token">Client sends Expo Push Token to backend if server-side backup notifications are to be supported. Minimal use.</api_endpoint>
                <api_endpoint method="INTERNAL_CRON_JOB">A very lightweight cron job on the backend (e.g., daily) to check for users who might need a backup server-sent push notification (e.g., if app hasn't been opened in X days and a critical statement date is approaching). This job would call Expo Push Notification service.</api_endpoint>
            </api_relationships_backend>
            <nfrs_feature>
                <nfr_item>Notification Delivery Reliability (Local First): >95% of scheduled local notifications delivered successfully.</nfr_item>
                <nfr_item>Server Backup Usage: <5% of total critical alerts sent via server backup to keep costs minimal.</nfr_item>
                <nfr_item>Battery Efficiency: Client-side scheduling logic must be highly optimized to minimize battery drain from background checks or tasks.</nfr_item>
                <nfr_item>Timeliness: Alerts should be delivered within the user-defined window (e.g., X days before statement) and respect quiet hours.</nfr_item>
                <nfr_item>User Control: Users must have clear and easy control over enabling/disabling and customizing alerts.</nfr_item>
            </nfrs_feature>
            <cost_optimizations_feature>
                <optimization>Primary reliance on Expo Local Notifications, which are free and operate on-device.</optimization>
                <optimization>Minimal server infrastructure for backup notifications; a simple cron job on the lean PaaS (Render.com free tier) calling Expo's free push service.</optimization>
                <optimization>No SMS or paid email services for alerts in MVP.</optimization>
                <optimization>Client-side logic for determining notification timing and content, reducing backend processing.</optimization>
                <optimization>Smart batching or consolidation of less critical reminders if ever implemented to avoid notification fatigue (though MVP focuses on critical utilization alerts).</optimization>
            </cost_optimizations_feature>
        </feature>
        <feature id="5.6" name="Multi-Card Optimization Advice">
            <feature_goal>Provide users with clear, actionable, and instant recommendations on how to best allocate available funds across multiple credit cards to optimize their credit utilization and potentially save on interest, using entirely client-side algorithms and pre-computed models for a responsive, cost-free experience.</feature_goal>
            <core_requirements>
                <user_story>
                    <as_a>user with multiple credit cards set up in ClariFi</as_a>
                    <i_want_to>input an amount I can afford to pay towards my credit cards this month</i_want_to>
                    <so_that>ClariFi can suggest the most effective way to distribute that payment.</so_that>
                    <acceptance_criteria>
                        <criterion>A simple input field allows the user to enter their available payment amount.</criterion>
                        <criterion>The input is validated as a numeric value.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>see a prioritized list of which cards to pay and how much to pay on each, based on a strategy like minimizing high-interest debt or maximizing credit score improvement (by lowering utilization on high-utilization cards first)</i_want_to>
                    <so_that>I can make informed payment decisions.</so_that>
                    <acceptance_criteria>
                        <criterion>The app presents a clear, ranked list of payment suggestions per card.</criterion>
                        <criterion>The default strategy focuses on paying down cards with the highest utilization first to positively impact credit scores.</criterion>
                        <criterion>The logic for prioritization is simple, transparent, and calculated client-side.</criterion>
                        <criterion>The suggested payment amounts do not exceed the available funds entered by the user or the balance on the card.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>visualize the potential impact of following the payment advice on my overall and per-card utilization, and potentially on my credit score (estimated)</i_want_to>
                    <so_that>I understand the benefits of the recommendations.</so_that>
                    <acceptance_criteria>
                        <criterion>The UI shows "before" and "after" utilization percentages for each card and overall, based on the suggested payments.</criterion>
                        <criterion>A simple, pre-computed model provides a qualitative estimate of potential credit score impact (e.g., "This plan could positively impact your score").</criterion>
                        <criterion>Visualizations (e.g., updated gauges or bars) clearly show the projected changes.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>be able to manually adjust the suggested payment amounts for each card within the optimization tool and see the impact update in real-time</i_want_to>
                    <so_that>I can create a payment plan that I am comfortable with.</so_that>
                    <acceptance_criteria>
                        <criterion>Users can interactively modify suggested payment amounts (e.g., via sliders or input fields).</criterion>
                        <criterion>All utilization and potential score impact visuals update instantly on the client as adjustments are made.</criterion>
                        <criterion>The tool prevents allocating more than the total available funds.</criterion>
                    </acceptance_criteria>
                </user_story>
            </core_requirements>
            <technical_summary>
                <frontend>React Native/Expo. A dedicated "Optimization" screen or section. UI components for:
                    - Inputting available payment funds.
                    - Displaying current utilization per card and overall.
                    - Presenting a list of suggested payments per card.
                    - Visualizing "before" and "after" utilization (e.g., using the same gauge components from Feature 5.4).
                    - Interactive elements (sliders/inputs) for users to adjust suggested payments.
                    - Displaying estimated credit score impact (qualitative or based on a simple client-side model).
                All logic for calculating current utilization, determining optimal payment distribution (e.g., highest utilization first, or considering APRs if available locally), and projecting new utilization figures is implemented in client-side JavaScript. Data for credit cards (limits, current balances - manually updated by user or via logged payments) is read from AsyncStorage.</frontend>
                <backend>NestJS. No backend involvement for this feature in MVP. All calculations and recommendations are client-side.</backend>
                <ai_llm_integration>None for this feature in MVP. Optimization logic is rule-based (e.g., prioritize card with utilization closest to/over 100%, then highest utilization percentage, then highest balance if utilization is similar, or highest APR if that data is available and user chooses that strategy). No LLM calls for generating advice.</ai_llm_integration>
                <database>Client-Side (AsyncStorage): Reads credit card details (limit, current balance, statement day, APR if user entered it) stored by Feature 5.4. May store user's preferred optimization strategy or saved payment plans locally. Server-Side (Supabase/PostgreSQL): No direct interaction for this feature's core logic.</database>
            </technical_summary>
            <ui_ux_summary>
                <screen name="Multi-Card Payment Optimizer Screen">
                    <state name="Initial Input View">
                        <description>`App Background (#FAFBFD)`. Header: "Optimize Card Payments" (H1, `Midnight Ink`), "Back" arrow.
                        **Section 1: Available Funds (Card style):**
                            - Title "How much can you pay now?" (H3, `Midnight Ink`).
                            - Large numeric input field (Style Guide: Input Field) for amount, `Clarity Blue` focus. Placeholder "$0.00".
                            - Optional: Slider component below input for quick adjustment, synced with input field. Slider track `Cloud Gray`, thumb `Clarity Blue`.
                        **Section 2: Current Snapshot (appears once funds > 0, or always visible):**
                            - Title "Your Current Card Status" (H3, `Midnight Ink`).
                            - Horizontally scrollable list or compact vertical list of cards. Each item shows: Card Nickname, Current Balance, Current Utilization % (color-coded), Credit Limit.
                            - Overall current utilization percentage displayed prominently (e.g., 24dp Bold, color-coded).
                        Primary Button "Calculate Optimal Plan" (`Clarity Blue` bg), enabled once funds > $0. Positioned at bottom.</description>
                    </state>
                    <state name="Optimization Results View (after calculation)">
                        <description>Screen updates (can be same screen or navigate to a results sub-screen).
                        **Summary Impact Section (Card style):**
                            - "Projected Impact" (H3, `Midnight Ink`).
                            - "Overall Utilization: [Old]% → [New]%" (Body Large, `Growth Green` for new if lower).
                            - "Estimated Score Impact: Positive" or "Could improve score by [X] points (Estimate)" (Body Large, `Growth Green`). (Note: Score impact is a very rough estimate for MVP).
                            - "Total Payment: $[Amount]" (Body Regular).
                        **Recommended Payment Allocation Section:**
                            - Title "Recommended Payments" (H2, `Midnight Ink`).
                            - List of cards. Each item (Card style, or list item style):
                                - Card Nickname & Bank Logo.
                                - "Pay: $[Amount]" (H3, `Clarity Blue` or `Growth Green`). Input field or slider next to it to allow user adjustment.
                                - "Old Util: [X]% → New Util: [Y]%" (Body Small, `Neutral Gray (Primary)`). Visual bar showing this change.
                                - Brief rationale if complex logic used (e.g., "Prioritized due to high utilization" - Caption, `Neutral Gray (Secondary)`).
                        "Apply this plan by making payments" informational text. Optional "Set Reminders for these Payments" button (Secondary Button style).</description>
                    </state>
                    <state name="Interactive Adjustment View (User modifies suggested payments)">
                        <description>As user adjusts payment amount for one card (via slider or input):
                            - Remaining "Available Funds" updates in real-time.
                            - Suggested payments for *other* cards might auto-adjust based on the chosen strategy (e.g., if user pays less on Card A, the optimizer might suggest putting more on Card B if funds allow and strategy dictates). This needs careful UX to not be confusing.
                            - "Overall Utilization" and "Estimated Score Impact" in the summary section update instantly with smooth number/gauge animations.
                        A "Reset to Suggested Plan" Text Button (`Clarity Blue`) appears if user makes changes.</description>
                    </state>
                    <state name="No Cards Added/Insufficient Data State">
                        <description>If user navigates here with no cards set up (from Feature 5.4): Centered illustration (`Lucide CreditCard` with `Lucide Search` or `Lightbulb`, `Neutral Gray (Secondary)`). Headline (H2, `Midnight Ink`): "Add Your Cards First!" Body Regular (`Neutral Gray (Primary)`): "Set up your credit cards to get personalized payment optimization advice." Primary Button "Add Credit Cards" (`Clarity Blue` bg), navigates to card setup.</description>
                    </state>
                </screen>
                <screen name="Strategy Explanation Modal (Accessed via info icon next to strategy selector - if implemented)">
                    <state name="Default View">
                        <description>Bottom sheet modal. Header: "[Strategy Name] Explained" (H3, `Midnight Ink`).
                        Body Regular text explaining the logic (e.g., "Highest Utilization First: This strategy focuses on paying down the cards with the highest percentage of credit used, which can have the quickest positive impact on your credit score.").
                        Simple visual example or diagram.
                        "Pros & Cons" list.
                        "Best for users who..." (Body Small).
                        "Got it" Text Button (`Clarity Blue`) to dismiss.</description>
                    </state>
                </screen>
            </ui_ux_summary>
            <api_relationships_backend>
                <api_endpoint method="NONE">This feature is entirely client-side for MVP. All data (card details, balances) is read from local AsyncStorage, and all optimization calculations and recommendations are performed on the device.</api_endpoint>
            </api_relationships_backend>
            <nfrs_feature>
                <nfr_item>Calculation Speed: Optimization recommendations and impact previews must update in real-time (target <100ms) as user adjusts available funds or individual payment amounts.</nfr_item>
                <nfr_item>Accuracy: Client-side algorithms for utilization and date calculations must be precise.</nfr_item>
                <nfr_item>Offline Capability: 100% functional offline.</nfr_item>
                <nfr_item>Clarity: Recommendations and their rationale must be easy for users (especially newcomers) to understand.</nfr_item>
                <nfr_item>Responsiveness: UI must be smooth and responsive even when managing 10+ credit cards.</nfr_item>
            </nfrs_feature>
            <cost_optimizations_feature>
                <optimization>All core logic is client-side, resulting in zero backend processing or API call costs for this feature.</optimization>
                <optimization>Pre-computed or simplified models for "credit score impact estimation" are bundled with the app or calculated with simple client-side heuristics, avoiding calls to external credit score APIs or complex backend ML models for MVP.</optimization>
                <optimization>Educational explanations for strategies are bundled content, not dynamically fetched.</optimization>
            </cost_optimizations_feature>
        </feature>
        <feature id="5.7" name="Basic Newcomer Financial Education">
            <feature_goal>Deliver high-quality, multilingual (English/French with Quebec terminology) financial education content specifically tailored for newcomers to Canada, bundled with the app for full offline access and zero recurring content delivery or CMS costs, empowering users with foundational financial literacy.</feature_goal>
            <core_requirements>
                <user_story>
                    <as_a>newcomer to Canada</as_a>
                    <i_want_to>access simple, clear, and trustworthy educational modules about Canadian finance basics (e.g., credit scores, banking, budgeting)</i_want_to>
                    <so_that>I can understand the financial system better and make informed decisions.</so_that>
                    <acceptance_criteria>
                        <criterion>3-4 core educational modules are available within the app.</criterion>
                        <criterion>Content is professionally written (or reviewed) for accuracy and clarity, tailored to a newcomer audience.</criterion>
                        <criterion>Content is available in both English and French (with Quebec-specific terminology where appropriate).</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>be able to read educational content even when I am offline</i_want_to>
                    <so_that>I can learn at my own pace and convenience, regardless of internet connectivity.</so_that>
                    <acceptance_criteria>
                        <criterion>All educational module content (text, images) is bundled with the app for 100% offline availability.</criterion>
                        <criterion>App performance is not negatively impacted by bundled content size.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>experience an engaging and easy-to-navigate interface for educational content, with interactive elements like simple quizzes</i_want_to>
                    <so_that>learning about finance is not boring or overwhelming.</so_that>
                    <acceptance_criteria>
                        <criterion>Educational content is presented in a clean, readable format using a Markdown renderer or custom React Native components.</criterion>
                        <criterion>Simple interactive elements (e.g., non-graded quizzes, expandable sections for definitions) are included to enhance engagement.</criterion>
                        <criterion>Navigation between modules and chapters within modules is intuitive.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>track my progress through the educational modules</i_want_to>
                    <so_that>I know what I've learned and what's next.</so_that>
                    <acceptance_criteria>
                        <criterion>The app locally tracks which modules/chapters the user has completed or started.</criterion>
                        <criterion>Visual indicators (e.g., progress rings, checkmarks) show completion status on the education hub screen.</criterion>
                        <criterion>User progress is stored locally via AsyncStorage.</criterion>
                    </acceptance_criteria>
                </user_story>
            </core_requirements>
            <technical_summary>
                <frontend>React Native/Expo. "Education Hub" screen listing modules. "Module Viewer" screen for displaying content. Content stored as Markdown files bundled within the app's assets (`/assets/education/[lang]/[module_id]/content.md`). A manifest file (e.g., `education_manifest.json`) defines module structure, titles, order, and paths to Markdown files. React Native Markdown renderer component (e.g., `react-native-markdown-display`) for displaying content. Simple client-side logic for interactive quizzes (non-graded for MVP). Progress tracking (completed modules/chapters, quiz attempts) stored in AsyncStorage. UI components for module cards, progress indicators, quiz elements. All functionality is client-side.</frontend>
                <backend>NestJS. No backend involvement for this feature in MVP. Content updates occur via app store releases.</backend>
                <ai_llm_integration>LLMs (e.g., Claude Haiku or GPT-3.5-Turbo) can be used *by the development team* pre-deployment to assist with initial drafting or professional translation of educational content into French (with human review and editing for accuracy, cultural sensitivity, and Quebec terminology). No runtime LLM calls for this feature.</ai_llm_integration>
                <database>Client-Side (AsyncStorage): Stores `education_progress` (e.g., `{'module1_id': {completed: true, quizScore: 80}, 'module2_id': {lastChapterRead: 'chapter3'}}`). Server-Side (Supabase/PostgreSQL): No specific tables for this feature's core data in MVP.</database>
            </technical_summary>
            <ui_ux_summary>
                <screen name="Education Hub Screen">
                    <state name="Default View">
                        <description>`App Background (#FAFBFD)`. Header: "Learn & Grow" (H1, `Midnight Ink`), perhaps with a `LucideGraduationCap` icon in `Wisdom Purple`. Subtitle: "Your guide to Canadian finance." (Body Regular, `Neutral Gray (Primary)`).
                        Vertically scrollable list of educational modules. Each module presented as a Card (Style Guide: Card - `Pure White` bg, 16dp radius, shadow, 16dp internal padding):
                            - Left: Large, friendly icon for the module topic (e.g., `LucideLandmark` for Banking, `LucideTrendingUp` for Credit Score, `LucidePiggyBank` for Budgeting - 40dp, `Wisdom Purple` or a unique color per module from a secondary palette).
                            - Center: Module Title (H3, `Midnight Ink`), Brief Description (Body Small, `Neutral Gray (Primary)`).
                            - Right: Progress indicator (e.g., small circular progress ring in `Growth Green` showing % completion, or a simple "Completed" badge with `LucideCheckCircle` in `Success Green`).
                            - Estimated reading time (Caption, `Neutral Gray (Secondary)` e.g., "Approx. 15 min read").
                        Tapping a module card navigates to the Module Viewer screen with a smooth page transition (platform native, 300ms). Modules might be grouped by difficulty or topic if more than 3-4 are present. A "Recommended for You" section could highlight a module based on user's onboarding status (e.g., newcomer).</description>
                    </state>
                    <state name="Module Card Pressed State">
                        <description>Card shows pressed state (e.g., background darkens slightly to `Cloud Gray` or scales down to 0.98) for 150ms before navigation.</description>
                    </state>
                    <state name="Empty State (If content somehow fails to load - very unlikely with bundled content)">
                        <description>Friendly illustration (`LucideBookOpen` with a question mark, `Neutral Gray (Secondary)`). Text: "Learning content is currently unavailable. Please try again later." (H2, `Midnight Ink`).</description>
                    </state>
                </screen>
                <screen name="Module Viewer Screen">
                    <state name="Content Reading View">
                        <description>`Pure White (#FFFFFF)` background for optimal readability. Header: Module Title (H2, `Midnight Ink`, can truncate with ellipsis), "Back" arrow (`Clarity Blue`). Thin linear progress bar at the very top of the screen (2dp height, `Growth Green` fill on `Cloud Gray` track) indicating scroll progress through the current chapter/module.
                        Content area uses `Body Regular` (`Midnight Ink`) for main text, with `H3` for subheadings within the module. Line height 1.5-1.6x font size for readability. Max content width to ensure comfortable line length (e.g., 90% of screen width with 24dp horizontal padding).
                        Images (if any) are full-width within content area, with `Caption` text below.
                        Key terms or definitions might be highlighted (e.g., `Clarity Blue` text, dotted underline) and tappable to show a small popover/tooltip with the definition (using `Wisdom Purple` accent for the popover).
                        Interactive elements (like simple calculators or "did you know?" callouts) styled as inset cards (`Cloud Gray` background) to differentiate from main content.
                        Navigation: "Previous Chapter" / "Next Chapter" Text Buttons (`Clarity Blue`) at the bottom, or swipe gesture for chapter navigation. A "Mark as Complete" button appears at the end of the last chapter.</description>
                    </state>
                    <state name="Quiz View (if module has a quiz, presented at the end)">
                        <description>Clean interface. Question (Body Large, `Midnight Ink`). Multiple choice options (A, B, C, D) presented as tappable rows (Card style, `Pure White` bg). Selected option shows `Clarity Blue` border and radio button fill. "Submit Answer" Primary Button. Feedback: Correct answers highlight in `Success Green`, incorrect in `Error Red` with brief explanation (Body Small, `Neutral Gray (Primary)`). Progress "Question X of Y" displayed. Final score screen with celebratory animation if passed.</description>
                    </state>
                    <state name="Content Loading (Initial load of a module - should be instant as it's bundled)">
                        <description>Ideally, no perceptible loading state. If any delay due to complex rendering, a very brief (200-300ms) full-screen `App Background` with a centered small circular spinner (`Clarity Blue`) could be shown, then fade to content.</description>
                    </state>
                </screen>
                <screen name="Language Selection Interface (within Settings or per module)">
                    <state name="Language Options View">
                        <description>If per module: A small `LucideLanguages` icon in the Module Viewer header. Tapping it shows a simple action sheet or modal with "English" and "Français (Canada)". Current language highlighted (`Clarity Blue` text or checkmark).
                        If global setting: Within app settings, a "Language" row navigates to a screen with radio button options for "English" and "Français (Canada)".
                        Selection immediately re-renders content in the chosen language (smooth fade transition if possible).</description>
                    </state>
                </screen>
            </ui_ux_summary>
            <api_relationships_backend>
                <api_endpoint method="NONE">All educational content is bundled with the app for MVP. No backend API calls are made to fetch or manage this content. Updates to content require an app store release.</api_endpoint>
                <api_endpoint method="CLIENT_ONLY_ANALYTICS">Optional: PostHog events can be sent from the client to track module views, completion rates, and quiz interactions (e.g., `education_module_started`, `education_chapter_completed`, `quiz_attempted`).</api_endpoint>
            </api_relationships_backend>
            <nfrs_feature>
                <nfr_item>Offline Access: 100% of educational content (text, bundled images, client-side interactives) must be available offline.</nfr_item>
                <nfr_item>Readability: Typography and layout must ensure high readability, adhering to accessibility contrast guidelines.</nfr_item>
                <nfr_item>Performance: Module content should load almost instantly (<500ms) as it's local.</nfr_item>
                <nfr_item>Content Quality: Content must be accurate, professionally written/reviewed, and culturally sensitive for Canadian newcomers. Translations must be high quality.</nfr_item>
                <nfr_item>App Size Impact: Bundled content (Markdown, images) should be optimized to minimize impact on overall app download size.</nfr_item>
            </nfrs_feature>
            <cost_optimizations_feature>
                <optimization>All educational content is bundled with the app, resulting in zero recurring hosting or CMS costs for MVP.</optimization>
                <optimization>Content updates are managed via app store releases, avoiding the need for a backend content management system and its associated infrastructure/maintenance for MVP.</optimization>
                <optimization>Interactive elements like quizzes and simple calculators are implemented using client-side logic, requiring no backend processing.</optimization>
                <optimization>LLMs are used by the development team *pre-deployment* for translation assistance, not for runtime translation, thus incurring no ongoing API costs for this feature.</optimization>
                <optimization>Images used in educational content are optimized and compressed to keep app bundle size manageable.</optimization>
            </cost_optimizations_feature>
        </feature>

         <feature id="5.8" name="AI-Powered Q&A (Cost-Capped)">
            <feature_goal>Provide users with an extremely cost-optimized conversational AI assistant that answers common financial questions related to Canadian finance and ClariFi's features, maintaining costs under $0.10 per active user per month by prioritizing a comprehensive local FAQ, aggressive response caching, and strict usage limits for direct LLM calls.</feature_goal>
            <core_requirements>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>ask simple questions about Canadian finance (e.g., "What is a TFSA?", "How does credit utilization work?") or ClariFi features</i_want_to>
                    <so_that>I can get quick, understandable answers without leaving the app.</so_that>
                    <acceptance_criteria>
                        <criterion>A chat-like interface allows users to type questions.</criterion>
                        <criterion>The system first attempts to match the query against a comprehensive, bundled FAQ database using fuzzy search.</criterion>
                        <criterion>If a direct FAQ match is found (target >95% for common queries), the pre-written answer is displayed instantly.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user with an uncommon question not in the FAQ</as_a>
                    <i_want_to>be able to get an AI-generated answer, within reasonable limits</i_want_to>
                    <so_that>I can still find help for my specific query.</so_that>
                    <acceptance_criteria>
                        <criterion>If no FAQ match, the system checks a Redis cache for previously generated LLM responses to similar queries.</criterion>
                        <criterion>If no cache hit, and the user is within their monthly LLM query limit (e.g., 3-5 queries), the query is sent to a cost-effective LLM (Claude Haiku).</criterion>
                        <criterion>LLM responses are concise (e.g., under 50-75 words) and directly answer the question.</criterion>
                        <criterion>Generated LLM responses are cached in Redis to benefit future similar queries.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>be clearly informed about my AI query limits and when I've reached them</i_want_to>
                    <so_that>I understand the constraints and am not surprised.</so_that>
                    <acceptance_criteria>
                        <criterion>The UI clearly displays the number of remaining AI-powered queries for the month.</criterion>
                        <criterion>When the limit is reached, a polite message informs the user and suggests browsing the FAQ or trying again next month.</criterion>
                        <criterion>There is no option to pay for more queries in the MVP.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>ClariFi system</as_a>
                    <i_want_to>ensure that direct LLM API calls for the Q&A feature are minimized and cost-efficient</i_want_to>
                    <so_that>the operational cost per user remains extremely low (target <$0.10/user/month for this feature).</so_that>
                    <acceptance_criteria>
                        <criterion>Over 95% of all Q&A interactions are resolved by the local FAQ or Redis cache.</criterion>
                        <criterion>Prompts to the LLM are highly optimized for minimal token usage (input and output).</criterion>
                        <criterion>The cheapest viable LLM (e.g., Claude Haiku) is used for all direct AI responses.</criterion>
                        <criterion>Strict monitoring of LLM API costs for this feature is in place.</criterion>
                    </acceptance_criteria>
                </user_story>
            </core_requirements>
            <technical_summary>
                <frontend>React Native/Expo. Chat interface screen. Components for message display (user query, AI/FAQ response), text input bar, suggested questions/FAQ links. Client-side fuzzy search logic for matching user queries against a bundled FAQ JSON database. Logic to display remaining AI query count (stored in AsyncStorage). Logic to call backend API for LLM-powered Q&A if FAQ/cache miss and within limits.</frontend>
                <backend>NestJS. A minimal AI module with an endpoint for Q&A. This endpoint:
                    1. Receives the user's query.
                    2. Checks a Redis cache (Upstash) for an existing answer to a similar query.
                    3. If no cache hit and user is within limits (backend might verify this or trust client initially for lean MVP), it constructs a token-optimized prompt and calls the external LLM API (Claude Haiku).
                    4. Caches the LLM response in Redis.
                    5. Returns the answer to the client.
                No complex conversation history management on the backend for MVP beyond what the LLM might handle in a single turn with a very brief context.
                </backend>
                <ai_llm_integration>Anthropic Claude Haiku API (or similar cheapest viable option like GPT-3.5-Turbo if Haiku is problematic). Prompts are engineered to be concise, request brief answers, and include context that ClariFi is a Canadian finance app for newcomers. No fine-tuning or custom models for MVP.</ai_llm_integration>
                <database>Client-Side (AsyncStorage): Stores user's monthly AI query count and last reset date. Bundled FAQ content (JSON). Server-Side (Redis via Upstash): Caches LLM responses (key: hash of normalized query, value: LLM answer, timestamp, tokens used). No persistent Q&A history in PostgreSQL for MVP to save costs, beyond Redis cache TTL.</database>
            </technical_summary>
            <ui_ux_summary>
                <screen name="AI Q&A Chat Screen">
                    <state name="Default/Initial View">
                        <description>`App Background (#FAFBFD)`. Header: "Ask ClariFi" (H2, `Midnight Ink`), `LucideSparkles` icon (`Wisdom Purple`). Optional "Beta" badge.
                        **Welcome Message Area:**
                            - Friendly avatar/icon for ClariFi AI (e.g., a subtle, modern bot face using `Clarity Blue` accents).
                            - Initial message bubble (left-aligned, `Cloud Gray` bg, `Midnight Ink` text): "Hi [User Name]! I'm ClariFi's AI assistant. How can I help you understand your finances or use the app better today?"
                        **Suggested Questions/FAQ Links:**
                            - Horizontally scrollable list of chips (Style Guide: Secondary Button style but smaller padding/height) or tappable text links (`Clarity Blue`) below the welcome message:
                                - "What is credit utilization?"
                                - "How do I add a statement?"
                                - "Tips for budgeting in Canada?"
                                - "Browse Full FAQ"
                        **Input Bar (Bottom, sticky):**
                            - Text Input field (Style Guide: Input Field, but perhaps slightly shorter height e.g., 48dp): Placeholder "Ask a question..." (`Neutral Gray (Secondary)`).
                            - Send Button (`LucideSend` icon, `Clarity Blue`, becomes active when text is entered).
                        **Usage Indicator:** Small text (Caption Style, `Neutral Gray (Primary)`) above input bar or in header: "[N]/[Max] AI queries remaining this month." (e.g., "3/5 AI queries left").</description>
                    </state>
                    <state name="User Typing Query">
                        <description>Input field is focused (Style Guide: Focused Input state). Send button becomes active (`Clarity Blue` fill or stronger color). Suggested questions might hide or reduce in prominence to give focus to input.</description>
                    </state>
                    <state name="Query Sent - Processing (FAQ/Cache Check First)">
                        <description>User's query appears in a right-aligned chat bubble (e.g., `Clarity Blue` bg, `Pure White` text).
                        AI response bubble (left-aligned, `Cloud Gray` bg) appears with a typing indicator (three animated dots `Neutral Gray (Secondary)`) and text "ClariFi is thinking..." (Body Small, `Neutral Gray (Primary)`). This state should be very brief if an FAQ/cache hit occurs.</description>
                    </state>
                    <state name="FAQ/Cache Hit Response Displayed">
                        <description>Typing indicator replaced by the answer from FAQ/Cache. Answer formatted for readability (Body Regular, `Midnight Ink`). If from FAQ, might include a small note "From our FAQ" with a link to the full article. Response appears with a quick fade-in or subtle upward slide animation.</description>
                    </state>
                    <state name="Query Sent - Processing (LLM API Call)">
                        <description>If FAQ/Cache miss and within limits, the "ClariFi is thinking..." state persists slightly longer. The usage indicator might update to show one less query remaining, or update after response is received.</description>
                    </state>
                    <state name="LLM Response Displayed">
                        <description>Typing indicator replaced by the LLM-generated answer (Body Regular, `Midnight Ink`). Answer is concise. Response appears with a quick fade-in or subtle upward slide animation. Optional: A small "AI Generated" disclaimer (Caption, `Neutral Gray (Secondary)`).</description>
                    </state>
                    <state name="Usage Limit Reached / Warning">
                        <description>If user attempts query when limit is 0: Input field might disable or Send button becomes disabled. A system message bubble appears: "You've used all your AI-powered queries for this month. Your limit will reset on [Date]. In the meantime, please browse our FAQ!" (Body Regular, `Midnight Ink` on a slightly different background like `Secondary Teal/Blue-Green Pale`).
                        If user is at 1 remaining query, a small warning "1 AI query left this month" might appear near the input bar.</description>
                    </state>
                    <state name="Error State (API Error, Network Error)">
                        <description>AI response bubble shows an error message: "Sorry, I couldn't process your question right now. Please try again in a moment or check our FAQ." (`Error Red` text, `LucideAlertTriangle` icon). Input bar remains active for retry.</description>
                    </state>
                </screen>
                <screen name="FAQ Browser Screen (Modal or Full Screen - if "Browse Full FAQ" is tapped)">
                    <state name="Category List View">
                        <description>`App Background (#FAFBFD)`. Header: "Frequently Asked Questions" (H2, `Midnight Ink`), "Back" or "Close" icon.
                        Search bar at the top (Style Guide: Input Field).
                        List of FAQ categories (e.g., "Credit Scores," "Using ClariFi," "Budgeting," "Privacy & Security"). Each category as a tappable row (Card style or simple list item with `LucideChevronRight`) showing category name and icon.
                        Tapping a category navigates to FAQ List for that category.</description>
                    </state>
                    <state name="FAQ List View (for a category)">
                        <description>Header: Category Name (H2), "Back" arrow.
                        Scrollable list of questions (Body Large or H3 style for questions, `Midnight Ink`).
                        Tapping a question expands it inline (accordion style with smooth animation) to show the answer (Body Regular, `Neutral Gray (Primary)`).</description>
                    </state>
                    <state name="FAQ Search Results View">
                        <description>Similar to FAQ List View, but shows questions matching the search term, with search term highlighted in results.</description>
                    </state>
                </screen>
            </ui_ux_summary>
            <api_relationships_backend>
                <api_endpoint method="POST" path="/ai/chat-query">Client sends user question. Backend checks cache, then (if needed and within limits) calls external LLM (Claude Haiku), caches response, and returns answer.</api_endpoint>
                <api_endpoint method="GET" path="/faq-content">Client fetches bundled/static FAQ content if not fully bundled in app (though bundling is preferred for MVP cost).</api_endpoint>
            </api_relationships_backend>
            <nfrs_feature>
                <nfr_item>FAQ/Cache Hit Rate: Target >95% of user queries resolved without an LLM API call.</nfr_item>
                <nfr_item>LLM API Cost: Target <$0.10 per active user per month for this specific Q&A feature.</nfr_item>
                <nfr_item>LLM Response Time (after FAQ/cache miss): P95 <3 seconds from query submission to response display.</nfr_item>
                <nfr_item>Token Usage (per LLM call): Average <50-100 tokens total (prompt + completion) for concise answers.</nfr_item>
                <nfr_item>Clarity of Limits: User must always be clearly aware of their AI query usage and limits.</nfr_item>
            </nfrs_feature>
            <cost_optimizations_feature>
                <optimization>Comprehensive bundled FAQ with client-side fuzzy search to handle the vast majority of queries locally and instantly.</optimization>
                <optimization>Aggressive Redis caching of all LLM-generated responses, keyed by a hash of the normalized user query.</optimization>
                <optimization>Strict monthly limits (e.g., 3-5 queries) on direct LLM API calls per free user.</optimization>
                <optimization>Use of the most cost-effective LLM available (e.g., Claude Haiku) for any queries that do require AI.</optimization>
                <optimization>Meticulous prompt engineering to ensure LLM prompts are concise and instruct the model to provide brief, targeted answers, minimizing token consumption.</optimization>
                <optimization>No storage of chat history on the backend for MVP to reduce database costs; history is client-side only.</optimization>
            </cost_optimizations_feature>
        </feature>

         <feature id="5.9" name="Monthly Cycle & Progress View">
            <feature_goal>Create an engaging and motivational progress tracking system, implemented entirely client-side, that encourages consistent app usage and positive financial habits through streaks, achievements, and visually appealing insights, with zero backend tracking costs for MVP.</feature_goal>
            <core_requirements>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>see my streak for consistently using the app (e.g., importing statements, reviewing budget) displayed prominently</i_want_to>
                    <so_that>I feel motivated to maintain my financial habits.</so_that>
                    <acceptance_criteria>
                        <criterion>A streak counter (e.g., "X day streak!") is clearly visible, perhaps on the main dashboard or a dedicated progress screen.</criterion>
                        <criterion>The streak is updated based on key user actions defined as "active use" (e.g., statement import, logging a payment, completing an education module).</criterion>
                        <criterion>Visual feedback (e.g., flame icon, animation) reinforces longer streaks.</criterion>
                        <criterion>Streak data is stored and calculated locally on the device.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>unlock achievements or badges for reaching financial milestones or consistently using app features</i_want_to>
                    <so_that>I feel a sense of accomplishment and am encouraged to explore more of the app.</so_that>
                    <acceptance_criteria>
                        <criterion>A predefined set of achievements is available (e.g., "First Statement Imported," "Budget Master - 3 months adherence," "Credit Optimizer - Utilized advice 5 times").</criterion>
                        <criterion>Achievements are unlocked automatically based on local client-side tracking of user actions and data.</criterion>
                        <criterion>Unlocked achievements are displayed with engaging visuals (icons/badges) and celebratory micro-animations.</criterion>
                        <criterion>Users can view their collection of earned achievements.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>see a simple visual summary of my financial progress at the end of each monthly cycle (e.g., after my main statement is processed)</i_want_to>
                    <so_that>I can reflect on my habits and identify areas for improvement.</so_that>
                    <acceptance_criteria>
                        <criterion>The app generates a simple monthly summary (e.g., total spent, top categories, savings rate, utilization changes) based on locally stored data.</criterion>
                        <criterion>This summary is presented in a visually appealing and easy-to-digest format.</criterion>
                        <criterion>Users can easily navigate to view summaries for previous months (for which data exists locally).</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>receive occasional motivational notifications or insights based on my progress and app usage</i_want_to>
                    <so_that>I stay engaged and encouraged on my financial journey.</so_that>
                    <acceptance_criteria>
                        <criterion>Simple, positive local notifications are scheduled for milestones (e.g., new streak record, achievement unlocked).</criterion>
                        <criterion>The progress view might show contextual motivational messages or tips based on recent activity.</criterion>
                        <criterion>Notifications are not excessive and can be managed by the user.</criterion>
                    </acceptance_criteria>
                </user_story>
            </core_requirements>
            <technical_summary>
                <frontend>React Native/Expo. Dedicated "Progress" or "Activity" tab/screen. Components for:
                    - Streak display (counter, calendar heatmap).
                    - Achievement gallery (earned badges, progress towards next).
                    - Monthly summary cards/views with simple charts (client-side rendered).
                All logic for tracking streaks, unlocking achievements (based on predefined client-side rules), generating monthly summaries from local data, and scheduling motivational local notifications is implemented in client-side JavaScript. All progress data is stored in AsyncStorage. Optional integration with PostHog (free tier) to send anonymized events for achievement unlocks or key milestone completions for product analytics purposes only (no PII). Client-side logic for generating simple shareable images of achievements/milestones.</frontend>
                <backend>NestJS. No backend involvement for this feature in MVP. All data and logic are client-side to ensure zero recurring server costs.</backend>
                <ai_llm_integration>None for this feature in MVP.</ai_llm_integration>
                <database>Client-Side (AsyncStorage): Stores `progress_tracking` data including `streaks` (current, longest, history), `achievements` (earned, progress towards others), `monthly_stats` (key metrics per month derived from local transaction data), and `milestones`. Also stores `achievement_definitions` (ID, name, description, criteria for unlocking) bundled with the app. Server-Side (Supabase/PostgreSQL): No specific tables for this feature's core data in MVP.</database>
            </technical_summary>
            <ui_ux_summary>
                <screen name="Progress & Achievements Screen (Main View)">
                    <state name="Default View">
                        <description>`App Background (#FAFBFD)`. Header: "Your Progress" (H1, `Midnight Ink`), perhaps with a `LucideTrendingUp` or `LucideAward` icon in `Wisdom Purple`.
                        **Streak Section (Prominent Card at the top):**
                            - Title "Current Streak" (H3, `Midnight Ink`).
                            - Large number for current streak days (e.g., 48dp Bold, `Growth Green` or `Clarity Blue`). Text "Day Streak!" (Body Large) next to it.
                            - Small flame icon (`LucideFlame`, `Accent Orange`) if streak > 7 days, animates subtly.
                            - Subtext: "Longest Streak: [X] days" (Caption, `Neutral Gray (Primary)`).
                            - Optional: Mini calendar heatmap (last 30 days) showing active days (squares colored with `Growth Green` intensity).
                        **Achievements Section (Card style):**
                            - Title "Recent Achievements" (H3, `Midnight Ink`). "View All" Text Button (`Clarity Blue`) on the right.
                            - Horizontally scrollable row of 3-4 recently earned achievement badges. Each badge: Circular or shield shape (64dp), gradient background (e.g., `Wisdom Purple` to `Sky Trust`), central icon (`Lucide [Icon]`, `Pure White`), achievement name (Caption, `Midnight Ink`) below. Badges have a slight shimmer or glow animation upon appearing.
                            - If no recent achievements: "Keep using ClariFi to unlock new achievements!" (Body Regular, `Neutral Gray (Primary)`).
                        **Monthly Snapshot Section (Card style):**
                            - Title "Last Month's Snapshot ([Month Name])" (H3, `Midnight Ink`).
                            - Key metrics displayed clearly: "Total Spent: $[Amount]", "Savings Rate: [X]%", "Top Category: [Name]" (Body Regular).
                            - Small sparkline chart showing spending trend for that month.
                            - "View Full Report" Text Button (`Clarity Blue`) navigating to a detailed monthly summary screen.
                        **Motivational Tip Card (Card style, changes periodically):**
                            - `LucideLightbulb` icon (`Wisdom Purple`).
                            - Tip text: e.g., "Great job on tracking your expenses for [X] days!" or "Did you know? Keeping credit utilization below 30% can boost your score." (Body Regular, `Midnight Ink`).</description>
                    </state>
                    <state name="Loading State (Initial load of progress data - should be very fast)">
                        <description>Brief skeleton placeholders for streak card and achievement section with shimmer animation if data loading from AsyncStorage takes >200ms.</description>
                    </state>
                </screen>
                <screen name="All Achievements Screen (Modal or Full Screen)">
                    <state name="Grid View">
                        <description>`App Background (#FAFBFD)`. Header: "All Achievements" (H2, `Midnight Ink`), "Back" arrow.
                        Filter tabs (optional): "Earned", "In Progress", "All". Active tab `Clarity Blue`.
                        Responsive grid (e.g., 3 columns) of achievement badges.
                            - Earned badges: Full color (as defined in `Achievement Showcase`), with earned date (Caption, `Neutral Gray (Secondary)`) below.
                            - Unearned/Locked badges: Grayscale or 50% opacity, with a lock icon (`LucideLock`, `Neutral Gray (Secondary)`) overlay. Progress towards unlocking shown as a small progress bar below the badge (e.g., "Import 2 more statements").
                        Tapping an achievement opens Achievement Detail Modal.</description>
                    </state>
                </screen>
                <screen name="Achievement Detail Modal">
                    <state name="Unlocked Achievement View">
                        <description>Bottom sheet modal. Large achievement badge/icon (96dp) at the top with celebratory animation (e.g., subtle particle burst of `Growth Green` and `Wisdom Purple`).
                        Achievement Name (H2, `Midnight Ink`).
                        Description of achievement (Body Regular, `Neutral Gray (Primary)`).
                        "Earned on: [Date]" (Body Small, `Neutral Gray (Secondary)`).
                        Optional: "Only [X]% of ClariFi users have unlocked this!" (Caption, `Wisdom Purple`).
                        Primary Button "Share Achievement" (`Clarity Blue` bg, generates a simple shareable image with the badge and app branding).
                        "Done" Text Button to dismiss.</description>
                    </state>
                    <state name="Locked Achievement View">
                        <description>Similar modal layout. Badge shown in grayscale/locked state.
                        Achievement Name (H2, `Midnight Ink`).
                        "How to Unlock:" section (H3) with criteria listed (Body Regular).
                        Progress bar showing current progress towards unlocking.
                        "Keep Going!" motivational message.</description>
                    </state>
                </screen>
                <screen name="Detailed Monthly Report Screen (Accessed from Progress Dashboard)">
                    <state name="Report View">
                        <description>`App Background (#FAFBFD)`. Header: "[Month, Year] Report" (H1, `Midnight Ink`), "Back" arrow, Share/Export icon (`LucideShare2`, `Clarity Blue`).
                        **Summary Section:** Key metrics (Income, Expenses, Savings, Savings Rate) displayed in prominent cards (Style Guide: Card).
                        **Spending Breakdown:** Detailed pie chart and list of spending by category for the month (similar to main dashboard but potentially more detail or different visualizations).
                        **Trends:** Comparison to previous month for key categories (e.g., "Dining: +15% vs. October").
                        **Credit Utilization Snapshot:** Average utilization for the month, highest utilization card.
                        **Achievements Unlocked This Month:** List of any achievements earned.
                        Option to export this detailed report (PDF client-side, CSV).</description>
                    </state>
                </screen>
            </ui_ux_summary>
            <api_relationships_backend>
                <api_endpoint method="NONE">All progress tracking, achievement logic, and monthly summary generation are handled entirely client-side using data stored in AsyncStorage. No backend API calls are required for the core functionality of this feature.</api_endpoint>
                <api_endpoint method="CLIENT_ONLY_ANALYTICS">Optional, anonymized events sent to PostHog (free tier) from the client to track high-level engagement with this feature, such as `achievement_unlocked`, `monthly_report_viewed`, `streak_milestone_reached`. No PII is sent.</api_endpoint>
            </api_relationships_backend>
            <nfrs_feature>
                <nfr_item>Performance: All calculations and UI updates for streaks, achievements, and monthly views must be instant (<200ms) as they rely on local data.</nfr_item>
                <nfr_item>Data Integrity: Local progress data must be stored reliably and persist across app sessions and updates.</nfr_item>
                <nfr_item>Offline Capability: 100% functional offline.</nfr_item>
                <nfr_item>Engagement: The design should be genuinely motivating and encouraging, not feel like a chore or overly gamified to the point of being distracting.</nfr_item>
                <nfr_item>Privacy: All progress data is stored locally on the device; only anonymized, aggregated analytics are optionally sent.</nfr_item>
            </nfrs_feature>
            <cost_optimizations_feature>
                <optimization>Entire feature is client-side, resulting in zero backend processing, storage, or API call costs.</optimization>
                <optimization>Analytics leverage PostHog's generous free tier for event tracking.</optimization>
                <optimization>Motivational notifications are scheduled locally using Expo Local Notifications (free).</optimization>
                <optimization>Shareable achievement images are generated client-side, avoiding server-side image processing.</optimization>
                <optimization>Achievement definitions are bundled with the app, requiring no dynamic fetching.</optimization>
            </cost_optimizations_feature>
        </feature>

         <feature id="5.10" name="Lean Support System">
            <feature_goal>Provide effective user support primarily through comprehensive in-app self-service resources (FAQ, guides, contextual help) and a community channel (Discord), with a simple email-based escalation path for complex issues, targeting an 80%+ self-service resolution rate to minimize direct support overhead and costs for the MVP.</feature_goal>
            <core_requirements>
                <user_story>
                    <as_a>user experiencing an issue or having a question</as_a>
                    <i_want_to>easily find answers within the app through a searchable FAQ and help articles</i_want_to>
                    <so_that>I can resolve my problem quickly without needing to contact support.</so_that>
                    <acceptance_criteria>
                        <criterion>A comprehensive, searchable in-app Help Center contains answers to common questions and guides for all features.</criterion>
                        <criterion>Content is organized by categories and easily browsable.</criterion>
                        <criterion>FAQ search uses client-side fuzzy matching for quick results.</criterion>
                        <criterion>Help content is bundled with the app for offline access.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>see contextual help or tooltips for complex UI elements or features</i_want_to>
                    <so_that>I can understand how to use them without navigating to a separate help section.</so_that>
                    <acceptance_criteria>
                        <criterion>Small, tappable info icons (`LucideInfo`) are placed near potentially confusing UI elements or settings.</criterion>
                        <criterion>Tapping an info icon reveals a concise, contextual tooltip or a short explanation.</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user with an issue not covered by the FAQ</as_a>
                    <i_want_to>have a clear way to contact support via email and receive a timely acknowledgment</i_want_to>
                    <so_that>I know my issue is being looked into.</so_that>
                    <acceptance_criteria>
                        <criterion>A "Contact Support" option is available within the Help Center.</criterion>
                        <criterion>This option opens a simple in-app form or the user's native email client, pre-filled with diagnostic info (app version, device type - with user consent).</criterion>
                        <criterion>An automated email response acknowledges receipt of the support request and provides an estimated response time (e.g., 24-48 business hours).</criterion>
                    </acceptance_criteria>
                </user_story>
                <user_story>
                    <as_a>user</as_a>
                    <i_want_to>have the option to join a community (e.g., Discord) to ask questions and share experiences with other ClariFi users</i_want_to>
                    <so_that>I can get peer support and feel part of a community.</so_that>
                    <acceptance_criteria>
                        <criterion>A clear link to an official ClariFi Discord server (or similar free community platform) is provided within the app.</criterion>
                        <criterion>The community is presented as a place for peer support and discussion, not official guaranteed support.</criterion>
                    </acceptance_criteria>
                </user_story>
            </core_requirements>
            <technical_summary>
                <frontend>React Native/Expo. "Help Center" screen with sections for FAQ categories, search, and contact options. "Article Viewer" screen for displaying bundled Markdown help content. Client-side fuzzy search implementation for FAQs. Contextual tooltip components. Email composition triggered via `Linking` API or a simple in-app form that constructs an email. Link to Discord server. All help content (FAQs, articles, video tutorial links if any) is bundled with the app for offline access and zero hosting costs.</frontend>
                <backend>NestJS. A very minimal backend endpoint (e.g., `/support/ticket` - optional for MVP) could receive structured support requests from an in-app form and forward them to a designated support email address (e.g., using Nodemailer or AWS SES free tier). This avoids exposing the support email directly in the client if desired and allows for basic server-side logging of requests. Alternatively, client directly opens user's email app. Auto-responders for email managed by the email service provider (e.g., Gmail filters/canned responses, or basic SendGrid/SES auto-reply).</backend>
                <ai_llm_integration>None for direct support resolution in MVP. The AI Q&A (Feature 5.8) serves as an initial AI-powered self-help layer. Future: LLM could assist in categorizing incoming support emails or suggesting draft replies for the founder.</ai_llm_integration>
                <database>Client-Side (AsyncStorage): Stores user's recently viewed help articles or search history for convenience. Bundled JSON/Markdown files for FAQ and help articles. Server-Side (Supabase/PostgreSQL): No specific tables for this feature's core data in MVP, unless a very simple table is used to log submitted support tickets if an in-app form routes through the backend.</database>
            </technical_summary>
            <ui_ux_summary>
                <screen name="Help Center Screen">
                    <state name="Default View">
                        <description>`App Background (#FAFBFD)`. Header: "Help & Support" (H1, `Midnight Ink`), `LucideLifeBuoy` icon (`Clarity Blue`).
                        **Search Bar (Prominent at top):** Input Field (Style Guide spec) with `LucideSearch` icon, placeholder "Search help articles & FAQ" (`Neutral Gray (Secondary)`).
                        **Quick Help Categories (Grid or List below search):**
                            - Presented as tappable Cards or clean list items. Each item: Icon (`Clarity Blue` or `Wisdom Purple`), Category Title (H3 or Body Large, `Midnight Ink`), e.g., "Getting Started," "Statement Imports," "Credit Features," "Troubleshooting," "Account & Privacy."
                        **"Popular FAQs" Section:**
                            - Title (H3, `Midnight Ink`).
                            - List of 3-5 most frequently accessed or important FAQs (Body Regular, `Clarity Blue` for tappable question text).
                        **"Video Tutorials" Section (Optional for MVP, if simple videos are bundled/linked):**
                            - Title (H3, `Midnight Ink`).
                            - Thumbnails or list items for 1-2 key tutorial videos.
                        **Contact Options (Card at bottom):**
                            - Title "Still Need Help?" (H3, `Midnight Ink`).
                            - "Join our Community on Discord" (Primary Button style or prominent Text Button with `LucideUsers` icon, `Clarity Blue`).
                            - "Email Support" (Secondary Button style or Text Button with `LucideMail` icon, `Clarity Blue`).</description>
                    </state>
                    <state name="Search Active/Results View">
                        <description>As user types in search bar, results update in real-time below.
                        Results grouped: "Top FAQ Matches," "Relevant Articles."
                        Search term highlighted in results.
                        If no results: "No matches found for '[query]'. Try different keywords or browse categories." Link to "Email Support."</description>
                    </state>
                </screen>
                <screen name="FAQ/Article Viewer Screen">
                    <state name="Reading View">
                        <description>`Pure White (#FFFFFF)` background for content area. Header: Article/FAQ Title (H2, `Midnight Ink`), "Back" arrow.
                        Content displayed using `Body Regular` for text, `H3` for subheadings. Markdown rendering supports lists, bolding, italics, simple tables, and embedded (bundled) images.
                        "Was this article helpful?" (Yes/No buttons - simple thumbs up/down `LucideThumbsUp`/`ThumbsDown` in `Neutral Gray (Secondary)`, turning `Growth Green`/`Error Red` on tap) at the bottom. This feedback is for local analytics/PostHog, not complex backend rating.
                        "Related Articles/FAQs" list at the bottom (Body Regular links, `Clarity Blue`).</description>
                    </state>
                    <state name="Video Tutorial View (if playing a bundled video)">
                        <description>Native video player interface (or simple `expo-av` player) plays bundled MP4. Standard controls (play/pause, scrub, volume, fullscreen). Modal presentation or dedicated screen.</description>
                    </state>
                </screen>
                <screen name="Contact Support Screen (Modal or Full Screen - if in-app form used)">
                    <state name="Email Form View">
                        <description>`App Background (#FAFBFD)`. Header: "Contact Support" (H2, `Midnight Ink`), "Cancel" or "Back" button.
                        Instructional text: "Please describe your issue clearly. We aim to respond within 24-48 business hours." (Body Regular, `Neutral Gray (Primary)`).
                        Dropdown (Input Field style): "Issue Category" (e.g., "Onboarding," "Statement Processing," "Bug Report," "Feedback," "Other").
                        Text Input Field: "Subject" (optional, can be pre-filled based on category).
                        Multi-line Text Area (Input Field style, larger height): "Describe your issue..." (min. 3-4 lines visible).
                        Optional: "Attach Screenshot" button (`LucidePaperclip`, Secondary Button style) - opens image picker. (Note: handling email attachments via backend adds complexity; for MVP, might just guide user to attach if they use their native client).
                        Primary Button "Send Message" (`Clarity Blue` bg).
                        Small text below: "We may collect app version and device information to help diagnose your issue." (Caption, `Neutral Gray (Secondary)`).</description>
                    </state>
                    <state name="Sending Message State">
                        <description>"Send Message" button shows centered circular spinner (`Pure White` on `Clarity Blue` bg). Form non-interactive.</description>
                    </state>
                    <state name="Message Sent Confirmation View">
                        <description>Centered `LucideCheckCircle` icon (64dp, `Success Green`) with animation.
                        Headline (H2, `Midnight Ink`): "Message Sent!"
                        Body Regular (`Neutral Gray (Primary)`): "Thanks for reaching out! We've received your message and will get back to you at [user's email] soon. You'll also receive an email confirmation."
                        Primary Button "Back to Help Center" or "Done".</description>
                    </state>
                    <state name="Send Error State">
                        <description>Toast/banner: "Could not send message. Please check your internet connection or try emailing us directly at support@clarifi.app." (`Error Red` bg, `Pure White` text). "Send Message" button reverts to enabled.</description>
                    </state>
                </screen>
                <screen name="Contextual Help Tooltip (Popover/Small Modal)">
                    <state name="Tooltip Displayed">
                        <description>Small popover anchored to the `LucideInfo` icon that was tapped. `Midnight Ink` background (or a dark `Clarity Blue`) with `Pure White` text for high contrast. `Body Small` or `Caption` text style. Contains a brief, focused explanation (1-3 sentences). Arrow pointing to the UI element it's explaining. Tapping outside the tooltip dismisses it with a fade-out animation.</description>
                    </state>
                </screen>
            </ui_ux_summary>
            <api_relationships_backend>
                <api_endpoint method="NONE_PRIMARY">Core help content (FAQ, articles) is bundled with the app. No API calls to fetch this content.</api_endpoint>
                <api_endpoint method="POST" path="/support/contact-email">(Optional for MVP) If an in-app form is used, this endpoint receives the form data and forwards it to the support email address (e.g., using Nodemailer). If client opens native email, no backend call needed here.</api_endpoint>
                <api_endpoint method="CLIENT_ONLY_ANALYTICS">PostHog events for: `help_article_viewed`, `faq_searched`, `support_contact_initiated`, `community_link_tapped`.</api_endpoint>
            </api_relationships_backend>
            <nfrs_feature>
                <nfr_item>Self-Service Resolution Rate: Target >80% of user queries resolved through in-app FAQ, articles, or contextual help without needing to email support.</nfr_item>
                <nfr_item>Content Accessibility: All help content must be available offline.</nfr_item>
                <nfr_item>Search Performance (Client-Side FAQ): Search results should appear almost instantly (<200ms) as user types.</nfr_item>
                <nfr_item>Email Acknowledgment: Automated acknowledgment for emailed support requests sent within 5 minutes.</nfr_item>
            </nfrs_feature>
            <cost_optimizations_feature>
                <optimization>All primary help content (FAQs, articles, links to bundled videos) is bundled with the app, incurring zero hosting or CMS costs for MVP.</optimization>
                <optimization>Client-side fuzzy search for FAQs avoids server-side search infrastructure costs.</optimization>
                <optimization>Leveraging free Discord platform for community support instead of paid forum software.</optimization>
                <optimization>Email support uses a standard email address with auto-responders (e.g., via Gmail filters or basic SendGrid/SES free tier for forwarding/auto-reply), avoiding paid helpdesk software subscriptions for MVP.</optimization>
                <optimization>Contextual tooltips reduce the need for users to navigate to a separate help section, improving task efficiency and reducing support load.</optimization>
            </cost_optimizations_feature>
        </feature>

    </section>

    <section id="6" title="Data Management & Privacy (Summary)">
        <list type="bullet">
            <item>**PIPEDA Compliance:** Adherence to Canadian privacy laws is paramount. This includes clear user consent for data collection and processing, a transparent privacy policy, and providing users with access to and control over their data (export and deletion).</item>
            <item>**Data Minimization:** Only necessary data is collected and stored. Original statement files are deleted immediately after processing.</item>
            <item>**Secure Storage:** Processed financial data is stored securely in PostgreSQL (Supabase). Sensitive data like authentication tokens are handled securely.</item>
            <item>**PII Handling with AI Services:** Efforts are made to minimize PII sent to external LLMs for categorization. Merchant names and transaction amounts are the primary data points, not direct personal identifiers from statements where possible.</item>
            <item>**User Data Export:** Users will have the ability to export their processed financial data (transactions, categories, insights) in common formats like CSV or JSON. This will be an automated feature.</item>
            <item>**Account Deletion:** Users can request account deletion, which will result in the removal of their personal data from active systems according to defined retention policies (e.g., after a short grace period for accidental deletion recovery, then permanent removal).</item>
        </list>
    </section>

    <section id="7" title="Success Metrics for MVP">
        <list type="bullet">
            <item>**User Acquisition & Onboarding:**
                <list type="bullet">
                    <item>Number of waitlist sign-ups: Target 1000+ before beta.</item>
                    <item>Number of successfully onboarded beta users: Target 500-1000 in first 3 months post-beta launch.</item>
                    <item>Onboarding completion rate (from registration to first statement fully processed and visible): > 75%.</item>
                </list>
            </item>
            <item>**Engagement & Core Feature Adoption:**
                <list type="bullet">
                    <item>DAU/MAU ratio: Target > 25% for engaged cohort.</item>
                    <item>Percentage of active users importing statements at least monthly: > 70%.</item>
                    <item>Percentage of active users setting up at least one credit card for tracking: > 80%.</item>
                    <item>Adoption rate of "Proactive Credit Utilization Alerts" (enabled by users with cards): > 60%.</item>
                    <item>Adoption rate of "Multi-Card Optimization Advice" (used at least once by users with multiple cards): > 40%.</item>
                    <item>Engagement with Educational Content (e.g., average modules completed per user): Target > 1 module per active user in first month.</item>
                    <item>AI Q&A Usage: Track number of queries per user, percentage resolved by FAQ/cache vs. LLM.</item>
                    <item>Engagement with Progress/Achievement features: Track streaks, achievements unlocked.</item>
                    <item>Average number of sessions per week for active users: Target > 3.</item>
                </list>
            </item>
            <item>**AI & Processing Performance:**
                <list type="bullet">
                    <item>Statement processing success rate (for supported banks & good quality uploads): > 98%.</item>
                    <item>AI categorization accuracy (pre-user correction, for transactions requiring LLM): > 85%.</item>
                    <item>Merchant cache hit rate (after 3 months of user activity): > 90%.</item>
                    <item>Average OCR/LLM API cost per active user per month: < $0.20.</item>
                    <item>P95 end-to-end statement processing time (3-5 page statement): < 2 minutes.</item>
                </list>
            </item>
            <item>**User Satisfaction & Retention:**
                <list type="bullet">
                    <item>Qualitative feedback from beta users: Predominantly positive, highlighting ease of use, clarity, and value of credit insights.</item>
                    <item>Net Promoter Score (NPS) or CSAT survey results (if implemented): Target NPS > 30; CSAT > 4.0/5.0.</item>
                    <item>Month 1 user retention (M1): > 40%.</item>
                    <item>Month 3 user retention (M3): > 25%.</item>
                </list>
            </item>
            <item>**Operational Efficiency:**
                <list type="bullet">
                    <item>Total monthly operational spend: Kept within $100-$300 target for the first 1000-5000 users.</item>
                    <item>Percentage of support queries resolved by self-serve (FAQ/AI Q&A/Community): > 80%.</item>
                </list>
            </item>
        </list>
    </section>

    <section id="8" title="Release Criteria for MVP">
        <list type="bullet">
            <item>All 10 defined MVP features are implemented and meet their core user stories' acceptance criteria for primary happy paths and critical error handling.</item>
            <item>Successful completion of end-to-end testing for all critical user flows on representative iOS and Android devices.</item>
            <item>No P0 (showstopper) or P1 (critical) bugs outstanding in any MVP feature.</item>
            <item>Performance targets met: Onboarding <3 mins, Dashboard load <1s, Statement processing P95 <2 mins, Optimization advice calculation <100ms.</item>
            <item>Key NFRs related to security (secure data handling, Supabase RLS, auth best practices) and privacy (PIPEDA compliance, data deletion, file management) are implemented and verified.</item>
            <item>OCR and AI categorization accuracy meets defined MVP targets.</item>
            <item>Cost control mechanisms (API limits, caching, billing alerts) are functional and tested; projected operational costs align with targets.</item>
            <item>Core educational content (3-4 modules) is complete, professionally translated (French with Quebec terminology), and accessible offline.</item>
            <item>Lean support system (in-app FAQ, email escalation path, Discord community link) is operational.</item>
            <item>Successful completion of an internal User Acceptance Testing (UAT) phase and a small closed beta program (e.g., 50-100 users) with positive qualitative feedback on core usability, value, and stability.</item>
            <item>Legal requirements (Terms of Service, Privacy Policy, clear disclaimers about not providing financial advice) are finalized, reviewed, and integrated into the app.</item>
            <item>Waitlist system is functional for managing controlled rollout post-beta.</item>
            <item>Basic analytics (PostHog) tracking key events is implemented and verified.</item>
        </list>
    </section>

    <section id="9" title="Out-of-Scope for MVP / Future Roadmap Pointers">
        <paragraph>The following features are considered out of scope for the initial MVP release but represent key areas for future development, enhancing ClariFi's value proposition and monetization potential. Detailed technical specifications for these can be found in `ClariFi_Post_MVP_Feature_Roadmap_v1.0.md`.</paragraph>
        <list type="bullet">
            <item>**Premium Subscription Tier:** Offering advanced features like unlimited AI usage, deeper analytics, family accounts, and real-time sync for a recurring fee.</item>
            <item>**Direct Bank Connection (Open Banking):** Integrating with services like Plaid or Flinks for automatic, real-time transaction syncing.</item>
            <item>**Business Features:** Tailored tools for freelancers and small business owners.</item>
            <item>**Advanced AI Insights:** Leveraging more powerful LLMs (e.g., GPT-4) for predictive analytics, personalized financial planning advice, and voice interactions.</item>
            <item>Full, persistent WebSocket implementation for all real-time data synchronization across the app (beyond minimal use for status updates in MVP).</item>
            <item>Comprehensive in-app gamification beyond basic streaks and achievements for progress tracking.</item>
            <item>Support for a wider range of Canadian financial institutions, including most credit unions.</item>
            <item>Additional languages beyond English and French based on user demographics and demand.</item>
            <item>Investment tracking or advice features (requires significant regulatory consideration and is firmly Post-MVP).</item>
        </list>
    </section>
</prd_document>