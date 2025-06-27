# Analytics and Error Tracking Setup Guide

## Overview
This document outlines the setup and configuration of analytics (PostHog) and error tracking (Sentry) for the ClariFi mobile application.

## PostHog Analytics Setup

### 1. Account Creation
- **Platform**: PostHog Cloud (https://cloud.posthog.com)
- **Project Name**: ClariFi-Canadian-Finance-App
- **Plan**: Free tier (1M events/month)

### 2. Configuration Settings
- **IP Anonymization**: Enabled for privacy compliance
- **Data Residency**: US/EU (check compliance requirements)
- **Session Recording**: Disabled (privacy-first approach)
- **Autocapture**: Enabled for basic interactions

### 3. Project Configuration
```json
{
  "project_name": "ClariFi-Canadian-Finance-App",
  "privacy_settings": {
    "anonymize_ips": true,
    "respect_dnt": true,
    "session_recording": false
  },
  "data_retention": "1 year",
  "compliance": "PIPEDA"
}
```

### 4. Environment Variables
```bash
# Required for PostHog integration
EXPO_PUBLIC_POSTHOG_API_KEY=ph_your_api_key_here
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Sentry Error Tracking Setup

### 1. Account Creation
- **Platform**: Sentry.io
- **Organization**: ClariFi
- **Projects**: 
  - clarifi-mobile (React Native)
  - clarifi-api (Node.js/NestJS)

### 2. Configuration Settings
- **Release Tracking**: Enabled
- **Performance Monitoring**: Basic (free tier)
- **Error Sampling**: 100% (adjust based on volume)

### 3. Environment Variables
```bash
# Required for Sentry integration
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

## Privacy and Compliance

### PIPEDA Compliance Requirements
1. **User Consent**: Required before analytics collection
2. **Minimal Data Collection**: Only necessary event data
3. **Opt-out Mechanism**: Users can disable analytics
4. **Data Transparency**: Clear privacy policy

### Implementation Notes
- No PII (Personally Identifiable Information) in events
- Anonymized user IDs only
- Opt-out respected across all tracking
- Clear consent flow in app onboarding

## Key Events to Track

### Financial Education
- `education_module_started`
- `education_lesson_completed`
- `education_quiz_attempted`
- `education_progress_milestone`

### Transaction Management
- `transaction_categorized`
- `transaction_manually_categorized`
- `ocr_scan_completed`
- `receipt_uploaded`

### User Engagement
- `app_opened`
- `feature_accessed`
- `onboarding_completed`
- `settings_changed`

## Next Steps
1. Create PostHog account and project
2. Install and configure SDKs
3. Implement event tracking
4. Set up privacy controls
5. Test analytics flow
6. Monitor and optimize

## Resources
- [PostHog React Native Documentation](https://posthog.com/docs/libraries/react-native)
- [Sentry React Native Documentation](https://docs.sentry.io/platforms/react-native/)
- [PIPEDA Compliance Guide](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/) 