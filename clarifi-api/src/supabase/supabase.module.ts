import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

@Global() // Make SupabaseService available application-wide
@Module({
  imports: [ConfigModule], // SupabaseService depends on ConfigService
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {} 