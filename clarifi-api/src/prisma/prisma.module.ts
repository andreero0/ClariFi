import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Makes PrismaService available application-wide without importing PrismaModule everywhere
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export PrismaService so it can be injected into other modules
})
export class PrismaModule {} 