import { pgTable, serial, text, timestamp, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';

/**
 * Match status enumeration to track the state of a fixture.
 */
export const matchStatusEnum = pgEnum('match_status', ['scheduled', 'live', 'finished']);

/**
 * Matches table storing core fixture data.
 * Adheres to camelCase for JS and snake_case for PostgreSQL columns.
 */
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  sport: text('sport').notNull(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  status: matchStatusEnum('status').default('scheduled').notNull(),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  homeScore: integer('home_score').default(0).notNull(),
  awayScore: integer('away_score').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Commentary table for real-time play-by-play updates.
 * Each entry references a specific match.
 */
export const commentary = pgTable('commentary', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id')
    .references(() => matches.id, { onDelete: 'cascade' })
    .notNull(),
  minute: integer('minute'),
  sequence: integer('sequence'),
  period: text('period'),
  eventType: text('event_type'),
  actor: text('actor'),
  team: text('team'),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
