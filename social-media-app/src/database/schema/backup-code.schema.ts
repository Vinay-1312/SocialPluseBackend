import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const backupCodes = pgTable('BackupCode', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  used: boolean('used').notNull().default(false),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type BackupCode = typeof backupCodes.$inferSelect;
export type NewBackupCode = typeof backupCodes.$inferInsert;
