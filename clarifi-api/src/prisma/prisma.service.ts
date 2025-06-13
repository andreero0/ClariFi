import { Injectable, OnModuleInit, OnModuleDestroy, Scope, Inject, InternalServerErrorException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express'; // Standard express request type

@Injectable({ scope: Scope.REQUEST })
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(REQUEST) private readonly request: Request, // Use standard Express Request type
    private readonly configService: ConfigService,
  ) {
    const baseDatabaseUrl = configService.get<string>('DATABASE_URL');

    if (!baseDatabaseUrl) {
      throw new InternalServerErrorException('DATABASE_URL is not configured');
    }

    let finalDatabaseUrl = baseDatabaseUrl;
    const authHeader = request.headers?.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (token) {
      const urlParts = baseDatabaseUrl.split('?');
      if (urlParts.length > 1 && urlParts[1]) { // Existing query params
        finalDatabaseUrl = `${baseDatabaseUrl}&options=reference_jwt%3D${token}`;
      } else {
        finalDatabaseUrl = `${baseDatabaseUrl}?options=reference_jwt%3D${token}`;
      }
    } else {
      // console.warn('PrismaService: No JWT token found in request, RLS might not apply user-specific policies.');
    }

    super({
      datasources: {
        db: {
          url: finalDatabaseUrl,
        },
      },
      // log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    // Prisma's $connect method is called automatically when the first query is executed.
    // However, it's good practice to explicitly connect on module initialization
    // if you want to catch connection errors early.
    await this.$connect();
  }

  async onModuleDestroy() {
    // Gracefully disconnect when the application shuts down.
    await this.$disconnect();
  }

  // You can add custom methods here if needed, for example, to handle transactions
  // or implement custom query logic that might be reused across your application.
} 