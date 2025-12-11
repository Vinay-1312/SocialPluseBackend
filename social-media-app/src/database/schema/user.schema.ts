import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const users = pgTable('User', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
});

// TypeScript type inference from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
