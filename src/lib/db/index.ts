// Drizzle client. Lazy — won't crash unless someone actually calls getDb(),
// so Phase 0 (no DB connection) and CI builds without DATABASE_URL still pass.

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

let cached: DrizzleClient | null = null;

export function getDb(): DrizzleClient {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set — check .env.local');
  }
  // prepare: false because we use Supabase's pgbouncer in transaction mode in prod,
  // which doesn't support prepared statements.
  const client = postgres(url, { prepare: false });
  cached = drizzle(client, { schema, casing: 'snake_case' });
  return cached;
}

export { schema };
