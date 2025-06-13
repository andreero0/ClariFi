# Sentry Alerts Configuration for ClariFi

## Overview
Critical error alert configuration for both backend (NestJS) and frontend (React Native) applications.

## Alert Categories

### Critical Alerts (Immediate Response)
- Security Breaches & Authentication failures
- Financial Operations (payment/transaction failures)  
- System Availability (database/service failures)
- Privacy Compliance violations

### High Priority Alerts (Prompt Response)
- High crash rates & navigation failures
- Performance issues & memory problems
- External API integration failures

## Backend Alert Rules

Located in: `clarifi-api/src/config/sentry-alerts.config.ts`

### Critical Security Errors
- **Trigger**: `error_category:security` tag
- **Response**: Immediate (0 min)
- **Notify**: Security team, Operations PagerDuty

### Financial Operations Errors  
- **Trigger**: `financial_operation` + `severity:critical` tags
- **Response**: 5 minutes max
- **Notify**: Operations team, Executive team

### Database Connection Failures
- **Trigger**: Database exceptions >10 occurrences
- **Response**: 10 minutes max  
- **Notify**: Operations team, PagerDuty, Incident webhook

## Frontend Alert Rules

Located in: `clarifi-mobile/config/alerts.ts`

### App Startup Crashes
- **Trigger**: Startup crashes >5 occurrences
- **Response**: 5 minutes max
- **Notify**: Mobile team, Executive team

### Financial Mobile Errors
- **Trigger**: `financial_mobile` + `severity:critical` 
- **Response**: Immediate (0 min)
- **Notify**: Mobile team, Mobile incident webhook

### Authentication Failures
- **Trigger**: `auth_critical` >10 occurrences
- **Response**: 5 minutes max
- **Notify**: Mobile team, Customer support

### Privacy System Failures
- **Trigger**: `privacy_critical` (any occurrence)
- **Response**: Immediate (0 min)
- **Notify**: Mobile team, Privacy officer

## Notification Channels

### Teams & Contacts
- **Security**: security@clarifi.ca, #security-alerts
- **Operations**: ops@clarifi.ca, #ops-alerts  
- **Mobile**: mobile-team@clarifi.ca, #mobile-alerts
- **Development**: dev-team@clarifi.ca, #dev-alerts
- **Executive**: executives@clarifi.ca

### Integration Setup
1. **Slack**: Connect workspace, configure team channels
2. **Email**: Set up SMTP, configure team aliases
3. **PagerDuty**: Connect account, set escalation policies
4. **Webhooks**: Configure incident management endpoints

## Environment Configuration

### Production
- All critical alerts enabled
- Full integration stack (email, Slack, PagerDuty)
- Executive escalation for business impact

### Staging  
- Critical alerts only
- Slack notifications primarily
- No executive escalation

### Development
- Critical alerts disabled
- Local logging for debugging

## Setup Instructions

### 1. Configure Sentry Projects
- Backend: `clarifi-api`
- Frontend: `clarifi-mobile`

### 2. Environment Variables
```bash
# Backend
SENTRY_DSN=https://backend-dsn@sentry.io/project-id

# Frontend  
EXPO_PUBLIC_SENTRY_DSN=https://frontend-dsn@sentry.io/project-id
```

### 3. Create Alert Rules in Sentry Dashboard
1. Navigate to Alerts → Rules
2. Create rules based on configurations above
3. Set up notification integrations
4. Test alert delivery

## Privacy & Security

### Data Protection
- All error data sanitized before reporting
- PII automatically removed from contexts
- Financial data filtered from reports
- User identification hashed for privacy

### PIPEDA Compliance
- Error reporting respects user consent
- Data retention policies applied
- Privacy-by-design in alert content
- Regular compliance audits

## Testing & Maintenance

### Testing
```typescript
// Test backend alert
throw new Error('Test critical error [error_category:security]');

// Test frontend alert  
Sentry.captureException(new Error('Test crash [startup_crash]'));
```

### Regular Reviews
- Weekly: Alert volume analysis
- Monthly: Response time evaluation  
- Quarterly: Rule effectiveness review
- Annually: Complete configuration audit

---
**Version**: 1.0  
**Last Updated**: 2025-06-05 