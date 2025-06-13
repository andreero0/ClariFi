Okay, fantastic! This is the exciting part where we bring together the feature definitions and the design system to envision the actual screens of ClariFi.

Here is the **full, adapted prompt** for the LLM. I have:

1.  Changed all references from "Lagos Telehealth Platform" to "ClariFi."
2.  **Crucially, I've inserted a placeholder `[YOUR_CLARIFI_STYLE_GUIDE_OUTPUT_HERE]` within the `<context>` section.** You will need to **replace this placeholder with the complete Style Guide output that the LLM generated for ClariFi in our previous step** (the one with "Clarity Blue," "Midnight Ink," "Growth Green," etc., and all the typography, component styles, etc.). This is vital for the LLM to apply ClariFi's specific design system.
3.  Replaced the `<feature-list>` with the **ClariFi MVP features** (using the "ultra cost-efficient premium MVP" version, providing the "Strong" summary for each as context for the LLM).
4.  Adjusted the `<practicalities>` to refer to the provided ClariFi style guide instead of the violet color scheme.
5.  Added a small clarification in the `<task>` to guide the LLM on identifying screens per feature.

**Remember to replace `[YOUR_CLARIFI_STYLE_GUIDE_OUTPUT_HERE]` with the actual ClariFi style guide text before using this prompt.**

```xml
<goal>
You are an industry-veteran SaaS product designer. You’ve built high-touch UIs for FANG-style companies and have a deep understanding of mobile design patterns (such as those promoting clarity, intuitive navigation, strong affordance, clear feedback, and content prioritization) and user psychology, particularly for financial applications. Your designs prioritize clarity, usability, and efficiency.

Your goal is to take the context below, including the ClariFi Style Guide and MVP Feature List, and turn it into a **functional UI design description, detailing screens and their states for each ClariFi MVP feature.**
</goal>

<inspirations>
The primary inspiration is the **ClariFi Style Guide provided in the context below**. Your design choices should be grounded in established mobile design patterns that enhance usability, build trust, and ensure a frictionless user experience, consistent with this style guide. Consider patterns that simplify complex information (like financial data), guide users effectively (especially first-time users or newcomers), and provide clear, immediate feedback. Avoid common mobile anti-patterns.
</inspirations>

<guidelines>
<aesthetics>
Bold simplicity with intuitive, standard mobile navigation patterns (e.g., bottom tab bar for primary navigation) creating frictionless experiences.
Clear information hierarchy using typography, color, and spacing (as defined in the ClariFi Style Guide) to guide the user's attention effectively.
Breathable whitespace complemented by strategic color accents for visual hierarchy and strong affordance of interactive elements.
Strategic negative space calibrated for cognitive breathing room and content prioritization, employing progressive disclosure for complex information.
Systematic color theory applied through purposeful accent placement, adhering to the ClariFi Style Guide.
Typography hierarchy utilizing weight variance and proportional scaling for clear information architecture, as defined in the ClariFi Style Guide.
Visual density optimization balancing information availability with cognitive load management; avoid "oceans of buttons" or "chart junk."
Motion choreography implementing subtle, physics-based transitions for spatial continuity, providing clear feedback, and enhancing the perception of responsiveness without being distracting.
Accessibility-driven contrast ratios (WCAG AA minimum) paired with intuitive navigation patterns ensuring universal usability, as per the ClariFi Style Guide.
Immediate, clear, and contextual feedback via state transitions, microinteractions, and appropriate messaging (confirmations, errors, system status).
Content-first layouts prioritizing user objectives over decorative elements for task efficiency.
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
ClariFi is an AI-powered personal finance coach designed to help users, especially newcomers to Canada, simplify budgeting from bank/credit card statements and optimize credit card usage to build strong credit and achieve financial clarity. It aims for a lean, high-quality, competitive, and cost-efficient premium MVP experience. The UI must be polished and intuitive, following the ClariFi Style Guide.
</app-overview>

<task>
Your goal here is to go feature-by-feature for the ClariFi MVP and think like a designer. For each ClariFi MVP feature, first identify the key screens a user would interact with to achieve the feature's goal. Then, for each screen, detail its various states.

Here is a list of things you'd absolutely need to think about for each screen state description:

User goals and tasks for that screen/state.
Information architecture and visual hierarchy on the screen.
Application of progressive disclosure if complex information is presented.
Affordances and signifiers for all interactive elements.
Consistency with the overall ClariFi Style Guide and other features.
Accessibility (color contrast, touch targets, screen reader considerations).
Error prevention and how errors/empty states are displayed.
Feedback mechanisms for user actions and system status.
Performance considerations (loading states, perceived speed).
Mobile-first design principles.
Microcopy and content strategy hints (e.g., button labels, helper text).
Aesthetic appeal, ensuring it aligns with the ClariFi brand (as per the Style Guide).
Animations and transitions that enhance the experience.

I need you to take EACH CLARIFI MVP FEATURE from the `<feature-list>` below, and give me a cohesive Design Brief for its UI/UX. Here's how I want it formatted. You repeat this for each feature:

<format>
## [Feature Name - ClariFi MVP]
### [Screen Name 1 for this Feature]
##### [Screen 1 - State A (e.g., Default/Initial View)]
*   Detailed description of UI elements present (e.g., header, buttons, lists, text fields, charts).
*   Layout and composition of these elements.
*   Specific colors, typography, icons, and spacing used, referencing the ClariFi Style Guide.
*   User interactions possible in this state.
*   Any animations or transitions initiated from or leading to this state.
*   Microcopy examples for key text elements.
*   Accessibility notes specific to this state.
##### [Screen 1 - State B (e.g., Loading State)]
*   Description of UI during loading (e.g., skeleton screen, spinner).
*   Colors, animations used.
##### [Screen 1 - State C (e.g., Error State)]
*   How errors are displayed (e.g., inline messages, toast, modal).
*   Specific error message text examples.
*   Colors and icons used for error indication.
##### [Screen 1 - State D (e.g., Empty State)]
*   Visual representation when there is no data.
*   Call to action or guidance provided to the user.
*   Illustrations or icons used.

#### [Screen Name 2 for this Feature]
##### [Screen 2 - State A]
*   ... (repeat detailed description as above) ...

(Repeat for as many screens and states as needed to fully describe the UI/UX for the feature, ensuring all design considerations from the task list are addressed for each screen state.)
</format>
</task>

<style-guide>
**ClariFi Style Guide**

[YOUR_CLARIFI_STYLE_GUIDE_OUTPUT_HERE]

*(Instructions for User: Please PASTE the ENTIRE Style Guide output that the LLM generated for ClariFi in the previous step here. This includes the Color Palette, Typography, Component Styling, Icons, Spacing System, Motion & Animation, Dark Mode Variants, and Accessibility Considerations specific to ClariFi, starting from "**Color Palette**" and ending with all details under "**Accessibility Considerations**" from that output.)*
</style-guide>

<feature-list>
*(The LLM should generate detailed screen/state UI/UX descriptions for each of the following ClariFi MVP features, applying the ClariFi Style Guide provided above.)*

### User Onboarding & Statement Import
**Strong** Premium onboarding experience with intelligent document capture supporting 6-month historical backlog, leveraging client-side processing and free-tier services to minimize costs while maintaining a polished feel.

### AI-Powered Data Extraction & Categorization (Ultra Cost-Efficient)
**Strong** Hyper-optimized OCR-to-LLM pipeline targeting <$0.15 per user/month through aggressive caching, minimal token usage, and smart fallbacks to achieve 85%+ accuracy without expensive API calls.

### Instant Budget Dashboard & Insights
**Strong** Beautiful, fully client-side dashboard with offline capabilities, pre-computed insights during processing, and zero backend calls for viewing to eliminate recurring costs.

### Credit Card Setup & Utilization Tracking
**Strong** Entirely client-side card management and utilization tracking with local calculations and notifications, eliminating all backend processing costs while maintaining accuracy.

### Proactive Credit Utilization Alerts
**Strong** Local-first notification system using device scheduling with minimal server backup, achieving 95%+ delivery rate while keeping server costs near zero.

### Multi-Card Optimization Advice
**Strong** Sophisticated client-side optimization engine providing instant recommendations without any backend processing, using pre-computed models for credit score impact visualization.

### Basic Newcomer Financial Education
**Strong** High-quality educational content bundled with the app or served via free CDN, with professional translations and offline access requiring zero recurring costs.

### AI-Powered Q&A (Cost-Capped)
**Strong** Extremely cost-optimized conversational AI using cheapest LLM options with 95%+ FAQ coverage, strict limits, and aggressive caching to keep costs under $0.10/user/month.

### Monthly Cycle & Progress View
**Strong** Engaging progress system implemented entirely client-side with local analytics, providing rich insights without any backend tracking costs.

### Lean Support System
**Strong** Self-service support infrastructure with comprehensive in-app help and email-based escalation, avoiding expensive helpdesk subscriptions while maintaining quality.

</feature-list>
<output>
Your output should be the cohesive Design Brief text itself, detailing the UI/UX for each screen and state of each ClariFi MVP feature, formatted precisely according to the <format> example provided in the task. Do not output HTML or CSS.
</output>
</context>
```

**Key things to remember when you use this prompt:**

1.  **Replace `[YOUR_CLARIFI_STYLE_GUIDE_OUTPUT_HERE]`:** This is the most critical step. Paste the full style guide the LLM generated for ClariFi (the one with "Clarity Blue," "Growth Green," etc.) into that section.
2.  **Lengthy Output Expected:** The LLM will be generating a lot of text, as it's detailing multiple screens and states for 10 MVP features. You might need to manage this if there are output length limitations in the platform you're using (e.g., ask it to do features 1-3 first, then 4-6, etc., in separate prompts if necessary, always providing the full style guide context).
3.  **Iterative Refinement:** Even with this detailed prompt, the LLM's output will be a *strong first draft* of your screen designs. You and your co-founder (and eventually a UI/UX designer) will then refine these text-based descriptions into actual visual designs.

This prompt sets the stage for the LLM to act as your initial UI/UX designer, translating the features and style guide into concrete screen descriptions. Good luck!