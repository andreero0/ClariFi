import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '../prisma/prisma.module';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import emailConfig from '../config/email.config';

@Module({
  imports: [
    ConfigModule.forFeature(emailConfig),
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        name: 'support-short',
        ttl: 60000, // 1 minute
        limit: 3, // 3 requests per minute for support tickets
      },
      {
        name: 'support-long', 
        ttl: 3600000, // 1 hour
        limit: 10, // 10 requests per hour for support tickets
      },
    ]),
  ],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {} 