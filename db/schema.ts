import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const contributions = sqliteTable('contributions', {
  id: text('id').primaryKey(),
  placeId: text('place_id'),
  placeName: text('place_name').notNull(),
  topic: text('topic').notNull(),
  note: text('note').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
  reviewedAt: text('reviewed_at'),
  sessionId: text('session_id').notNull(),
});

export const moderationAudit = sqliteTable('moderation_audit', {
  id: text('id').primaryKey(),
  contributionId: text('contribution_id').notNull(),
  action: text('action').notNull(),
  createdAt: text('created_at').notNull(),
});

export const explorerUsers = sqliteTable('explorer_users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  station: text('station').notNull(),
  vibe: text('vibe').notNull(),
  passwordHash: text('password_hash').notNull(),
  salt: text('salt').notNull(),
  createdAt: text('created_at').notNull(),
});

export const explorerSessions = sqliteTable('explorer_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => explorerUsers.id),
  expiresAt: text('expires_at').notNull(),
});

export const explorerLibrary = sqliteTable('explorer_library', {
  userId: text('user_id').primaryKey().references(() => explorerUsers.id),
  saved: text('saved').notNull().default('[]'),
  plans: text('plans').notNull().default('[]'),
});
