import { registerAs } from '@nestjs/config';

export default registerAs(
  'redis',
  (): { url: string; token: string } => ({
    url: process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || 'redis://localhost:6379',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  }),
); 