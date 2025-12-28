import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const refreshTokens = pgTable('RefreshToken', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),

  // Device tracking for security
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),

  // Revocation
  revokedAt: timestamp('revoked_at'),
});

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
