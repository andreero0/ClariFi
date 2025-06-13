import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global() // Making it global to be available in other modules without importing RedisModule explicitly
@Module({
  imports: [ConfigModule], // Ensure ConfigService is available
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {} 