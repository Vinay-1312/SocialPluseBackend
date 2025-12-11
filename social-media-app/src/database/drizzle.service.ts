import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  public db: NodePgDatabase<typeof schema>;

  constructor() {
    // Load environment variables
    dotenv.config();

    // Parse DATABASE_URL from environment
    const connectionString = process.env.DATABASE_URL;

    // Configure connection pool
    const poolConfig: PoolConfig = {
      connectionString,
      max: 20, // Maximum number of connections in pool
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 2000, // Timeout after 2s if connection cannot be established
    };

    this.pool = new Pool(poolConfig);

    // Initialize Drizzle with node-postgres pool and schema
    this.db = drizzle(this.pool, { schema });
  }

  async onModuleInit() {
    try {
      // Test database connection
      await this.pool.query('SELECT NOW()');
      console.log('✅ Connected to database');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.pool.end();
      console.log('✅ Disconnected from database');
    } catch (error) {
      console.error('❌ Error during disconnect:', error);
    }
  }
}
