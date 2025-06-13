import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
// ConfigModule, PrismaModule, and SupabaseModule are global, so no need to import them here.

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService], // Export AuthService if other modules need to inject it directly
})
export class AuthModule {}
