# Sentry Alerts Configuration for ClariFi

This document outlines the setup and configuration of Sentry alert rules for critical error monitoring in both the ClariFi backend (NestJS) and frontend (React Native) applications.

## Overview

The alert system is designed to provide immediate notification for critical errors that affect user experience, financial operations, security, and system availability. Alerts are categorized by severity and routed to appropriate teams based on the type and impact of the error.

## Alert Categories

### Critical Alerts (Immediate Response Required)
- **Security Breaches**: Authentication failures, data breach attempts
- **Financial Operations**: Payment processing failures, transaction corruption
- **System Availability**: Database failures, total service unavailable
- **Privacy Compliance**: PIPEDA violation risks, consent system failures

### High Priority Alerts (Prompt Response Required)
- **User Experience**: High crash rates, navigation failures
- **Performance**: Slow response times, memory issues
- **External Integrations**: Banking API failures, third-party service issues

### Medium Priority Alerts (Business Hours Response)
- **Feature Degradation**: OCR failures, minor UI issues
- **Monitoring**: Performance degradation, usage anomalies

## Backend Alert Configuration

### File: `src/config/sentry-alerts.config.ts`

#### Critical Security Errors
- **Trigger**: Security-related errors with `error_category:security` tag
- **Response Time**: Immediate (0 minutes)
- **Notifications**: 
  - Security team email & Slack
  - Operations PagerDuty
- **Environments**: Production, Staging

#### Financial Operations Critical Errors
- **Trigger**: Financial operations with `severity:critical` tag
- **Response Time**: 5 minutes max
- **Notifications**:
  - Operations team email & Slack
  - Executive team email
- **Environments**: Production only

#### Database Connection Failures
- **Trigger**: Database-related exceptions with >10 occurrences
- **Response Time**: 10 minutes max
- **Notifications**:
  - Operations team email
  - PagerDuty escalation
  - Incident webhook
- **Environments**: Production, Staging

### Implementation Steps (Backend)

1. **Install Sentry Configuration**:
   ```bash
   # Already completed in previous tasks
   npm install @sentry/nestjs @sentry/node
   ```

2. **Environment Variables**:
   ```bash
   SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
   SENTRY_ENABLED=true
   NODE_ENV=production
   ```

3. **Import Alert Configuration**:
   ```typescript
   import { BACKEND_CRITICAL_ALERTS } from './config/sentry-alerts.config';
   ```

## Frontend Alert Configuration

### File: `config/alerts.ts`

#### App Startup Crashes
- **Trigger**: Startup crashes with >5 occurrences
- **Response Time**: 5 minutes max
- **Notifications**:
  - Mobile team email & Slack
  - Executive team email
- **Environments**: Production only

#### Financial Operations Mobile Errors
- **Trigger**: Mobile financial operations with `severity:critical`
- **Response Time**: Immediate (0 minutes)
- **Notifications**:
  - Mobile team email & Slack
  - Mobile incident webhook
- **Environments**: Production only

#### Authentication Critical Failures
- **Trigger**: Auth critical errors with >10 occurrences
- **Response Time**: 5 minutes max
- **Notifications**:
  - Mobile team email
  - Customer support Slack
- **Environments**: Production only

#### Privacy System Failures
- **Trigger**: Privacy critical errors (any occurrence)
- **Response Time**: Immediate (0 minutes)
- **Notifications**:
  - Mobile team email
  - Privacy officer email
- **Environments**: Production, Staging

## Sentry Dashboard Setup

### 1. Create Sentry Projects
- **Backend Project**: `clarifi-api`
- **Frontend Project**: `clarifi-mobile`

### 2. Configure Alert Rules

#### In Sentry Dashboard:
1. Navigate to **Alerts** → **Rules**
2. Click **Create Alert Rule**
3. Select appropriate project (backend/frontend)
4. Configure conditions based on alert configurations
5. Set up notification integrations

#### Example Alert Rule Setup:

**Critical Security Errors (Backend)**:
```
IF an event is seen
AND the event's level equals error
AND the event's tags contain error_category:security
THEN send a notification to #security-alerts and security@clarifi.ca
```

**App Startup Crashes (Mobile)**:
```
IF an event is seen more than 5 times in 1 minute
AND the event's level equals error  
AND the event's tags contain startup_crash
THEN send a notification to #mobile-alerts and mobile-team@clarifi.ca
```

### 3. Integration Setup

#### Slack Integration:
1. Go to **Settings** → **Integrations** → **Slack**
2. Connect Slack workspace
3. Configure channels:
   - `#dev-alerts` - Development team
   - `#security-alerts` - Security team
   - `#ops-alerts` - Operations team
   - `#mobile-alerts` - Mobile team

#### Email Integration:
1. Configure SMTP settings in Sentry
2. Set up team email aliases:
   - `dev-team@clarifi.ca`
   - `security@clarifi.ca`
   - `ops@clarifi.ca`
   - `mobile-team@clarifi.ca`

#### PagerDuty Integration:
1. Go to **Settings** → **Integrations** → **PagerDuty**
2. Connect PagerDuty account
3. Configure escalation policies for critical alerts

### 4. Webhook Configuration

#### Incident Management Webhook:
```typescript
{
  url: 'https://api.clarifi.ca/webhooks/incidents',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer webhook-token',
    'Content-Type': 'application/json'
  }
}
```

## Testing Alert Configuration

### 1. Test Error Generation
```typescript
// Backend test
throw new Error('Test critical security error [error_category:security]');

// Frontend test  
Sentry.captureException(new Error('Test startup crash [startup_crash]'));
```

### 2. Verify Alert Delivery
- Check configured Slack channels
- Verify email notifications
- Confirm PagerDuty escalations
- Test webhook endpoints

### 3. Alert Response Testing
- Document response procedures
- Test escalation paths
- Verify notification timing
- Validate alert content quality

## Environment-Specific Configuration

### Production
- All critical alerts enabled
- Immediate notifications for security/financial errors
- Executive escalation for critical business impact
- Full integration stack (email, Slack, PagerDuty)

### Staging  
- Critical alerts only
- Slack notifications primarily
- Reduced frequency (higher thresholds)
- No executive escalation

### Development
- Critical alerts disabled by default
- Local logging for debugging
- Slack notifications only for critical issues

## Maintenance and Monitoring

### Regular Reviews
- **Weekly**: Alert volume and noise analysis
- **Monthly**: Response time evaluation
- **Quarterly**: Alert rule effectiveness review
- **Annually**: Complete configuration audit

### Alert Tuning
- Adjust frequency thresholds based on false positive rates
- Update notification channels as team structure changes
- Refine error categorization based on impact analysis
- Update escalation procedures based on incident learnings

### Documentation Updates
- Keep notification contact lists current
- Update webhook endpoints as infrastructure changes
- Maintain alert rule documentation
- Document response procedures and runbooks

## Security and Privacy Considerations

### Data Protection
- All error data is sanitized before reporting
- PII is automatically removed from error contexts
- Financial data is filtered out of error reports
- User identification is hashed for privacy compliance

### Access Control
- Alert configuration requires admin privileges
- Notification channels are role-based
- Sensitive alerts (security, privacy) have restricted access
- Audit trail for all configuration changes

### Compliance (PIPEDA)
- Error reporting respects user consent
- Data retention policies applied to error data
- Privacy-by-design in alert content
- Regular compliance audits of alert data

## Contact Information

### Alert Response Teams
- **Security Team**: security@clarifi.ca, #security-alerts
- **Operations Team**: ops@clarifi.ca, #ops-alerts  
- **Mobile Team**: mobile-team@clarifi.ca, #mobile-alerts
- **Development Team**: dev-team@clarifi.ca, #dev-alerts

### Escalation Contacts
- **Technical Lead**: tech-lead@clarifi.ca
- **Security Officer**: security-officer@clarifi.ca
- **Privacy Officer**: privacy@clarifi.ca
- **Executive Team**: executives@clarifi.ca

---

**Last Updated**: 2025-06-05  
**Version**: 1.0  
**Maintained By**: Development & Operations Teams