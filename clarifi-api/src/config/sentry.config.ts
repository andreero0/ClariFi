import { registerAs } from '@nestjs/config';

export interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  tracesSampleRate: number;
  profilesSampleRate: number;
  debug: boolean;
}

export default registerAs('sentry', (): SentryConfig => ({
  dsn: process.env.SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
}));
