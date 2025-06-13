# Sentry Error Tracking Integration

This document outlines the Sentry error tracking implementation for the ClariFi API backend.

## Overview

Sentry has been integrated to provide comprehensive error tracking, performance monitoring, and alerting for the NestJS backend application.

## Features

### Error Tracking
- **Automatic Error Capture**: All unhandled exceptions are automatically captured and reported
- **HTTP Exception Handling**: HTTP errors are categorized and filtered (server errors vs client errors)
- **Authentication Failures**: 401/403 errors are tracked as warnings for security monitoring
- **Custom Error Context**: Rich context information including request details, user information, and application state

### Performance Monitoring
- **Request Tracing**: Distributed tracing for request performance analysis
- **Slow Request Detection**: Automatic detection and reporting of requests taking >5 seconds
- **Database Query Monitoring**: Integration with Prisma for database performance insights
- **Custom Performance Metrics**: Application-specific performance indicators

### Privacy Compliance
- **PII Sanitization**: Automatic removal of personally identifiable information from error reports
- **Sensitive Data Filtering**: Headers, cookies, and request data are sanitized before transmission
- **PIPEDA Compliance**: Canadian privacy law compliance through data minimization

## Configuration

### Environment Variables
```bash
# Required for Sentry integration
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENABLED=true  # Set to false to disable Sentry in development
NODE_ENV=production  # Affects sampling rates and debug settings
```

### Sampling Rates
- **Production**: 10% trace sampling, 10% profile sampling (cost optimization)
- **Development**: 100% sampling for complete visibility during development
- **Debug Mode**: Enabled in development for detailed logging

## Implementation Details

### Global Interceptor
The `SentryInterceptor` is registered globally and provides:
- Request context setting for all incoming requests
- User identification (without PII)
- Performance monitoring and slow request detection
- Comprehensive error categorization and reporting

### Error Categories
1. **HTTP Exceptions** (status codes 400-599)
   - Server errors (5xx): Reported as errors
   - Authentication failures (401/403): Reported as warnings
   - Client errors (4xx): Generally not reported (except auth failures)

2. **Unhandled Exceptions**: Reported as fatal errors
   - Application crashes
   - Unexpected runtime errors
   - Third-party service failures

### Privacy Features
Automatic sanitization removes:
- Email addresses, phone numbers, names
- Physical addresses and postal codes
- Financial information (SIN, bank accounts, credit cards)
- Authentication tokens and API keys
- Password fields and sensitive headers

### Custom Context
Each error report includes:
- Request method, URL, and headers (sanitized)
- User ID (without personal information)
- Handler and controller information
- Application timestamp and environment
- Custom tags for filtering and alerting

## Usage

### Manual Error Reporting
```typescript
import * as Sentry from '@sentry/nestjs';

// Capture custom errors
Sentry.captureException(new Error('Custom error'));

// Add context
Sentry.setContext('custom_context', {
  feature: 'document_upload',
  action: 'pdf_processing'
});

// Add breadcrumbs
Sentry.addBreadcrumb({
  message: 'User started document upload',
  category: 'user_action',
  level: 'info'
});
```

### Custom Tags
Errors are automatically tagged with:
- `endpoint`: Request method and path
- `environment`: Current environment (development/production)
- `error_type`: Category of error (http_exception, unhandled_exception)
- `status_code`: HTTP status code (for HTTP exceptions)
- `severity`: Error severity level (warning, error, fatal)

## Monitoring and Alerts

### Recommended Alerts
1. **High Error Rate**: >5% error rate over 5 minutes
2. **Authentication Failures**: >10 auth failures in 1 minute
3. **Slow Requests**: >50% of requests taking >2 seconds
4. **Unhandled Exceptions**: Any fatal errors (immediate notification)
5. **Database Errors**: Connection failures or query timeouts

### Performance Metrics
- Request duration percentiles (p50, p95, p99)
- Error rate by endpoint
- Database query performance
- Memory usage and CPU utilization (with profiling enabled)

## Security Considerations

### Data Minimization
- Only essential error information is transmitted
- PII is automatically stripped from all reports
- Sensitive configuration values are never included
- Stack traces exclude variable values

### Access Control
- Sentry project access should be restricted to development and operations teams
- Production error data requires appropriate access permissions
- Error reports may contain business logic insights requiring confidentiality

## Troubleshooting

### Common Issues
1. **Missing Errors**: Check `SENTRY_ENABLED` and `SENTRY_DSN` environment variables
2. **High Volume**: Adjust sampling rates in production to control costs
3. **Sensitive Data**: Review `beforeSend` filter if PII appears in reports
4. **Performance Impact**: Monitor application performance with Sentry enabled

### Debug Mode
Enable debug logging in development:
```bash
NODE_ENV=development
SENTRY_ENABLED=true
```

This will log Sentry operations to the console for troubleshooting.

## Integration Testing

### Test Error Reporting
Create a test endpoint to verify Sentry integration:
```typescript
@Get('test-error')
testError() {
  throw new Error('Test error for Sentry integration');
}
```

### Verify Performance Monitoring
Check Sentry dashboard for:
- Request traces appearing
- Performance data being collected
- Custom tags and context being applied
- PII properly sanitized

## Maintenance

### Regular Tasks
- Review error patterns monthly
- Update alert thresholds based on application growth
- Monitor Sentry quota usage and adjust sampling if needed
- Update sensitive field filters as application evolves

### Version Updates
When updating Sentry packages:
1. Test error reporting functionality
2. Verify privacy filters still work correctly
3. Check performance impact
4. Update documentation for any configuration changes 