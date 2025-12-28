import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('User', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),

  // TOTP-related fields
  totpSecret: text('totp_secret'),
  totpEnabled: boolean('totp_enabled').notNull().default(false),
  totpVerifiedAt: timestamp('totp_verified_at'),

  // Account status
  isActive: boolean('is_active').notNull().default(true),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// TypeScript type inference from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
