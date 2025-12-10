import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      datasources: {
        db: {
          url: getDatabaseUrl(),
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('✅ Disconnected from database');
  }
}
