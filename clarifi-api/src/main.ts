import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

async function bootstrap() {
  // Initialize Sentry before creating the NestJS app
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Privacy and compliance settings
    beforeSend(event) {
      // Remove sensitive data from error reports
      if (event.exception) {
        event.exception.values?.forEach(exception => {
          if (exception.stacktrace?.frames) {
            exception.stacktrace.frames.forEach(frame => {
              // Remove sensitive variable values
              delete frame.vars;
            });
          }
        });
      }
      
      // Remove PII from request data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.authorization;
        delete event.request.headers?.['x-api-key'];
        delete event.request.headers?.['supabase-api-key'];
        
        // Sanitize query parameters and POST data
        if (event.request.query_string && typeof event.request.query_string === 'string') {
          event.request.query_string = event.request.query_string
            .replace(/([?&])(email|phone|name|address|token|key|secret)=[^&]*/gi, '$1$2=***');
        }
        
        // Sanitize POST data
        if (event.request?.data && typeof event.request.data === 'object') {
          const sensitiveFields = [
            'email', 'phone', 'name', 'firstName', 'lastName',
            'address', 'postalCode', 'sin', 'bankAccount',
            'creditCard', 'income', 'password', 'token'
          ];
          
          const requestData = event.request.data as any;
          sensitiveFields.forEach(field => {
            if (requestData?.[field]) {
              requestData[field] = '***';
            }
          });
        }
      }
      
      // Remove sensitive user data
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      
      return event;
    },
  });

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip away properties not defined in DTO
      // forbidNonWhitelisted: true, // Optionally, throw an error if non-whitelisted properties are present
      // transform: true, // Optionally, transform payloads to DTO instances
    }),
  );

  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
