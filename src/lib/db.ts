import "server-only";

/**
 * A tiny SQL layer. In production it talks to Neon Postgres over HTTP
 * (DATABASE_URL, set automatically by the Vercel Neon integration).
 * Without DATABASE_URL (local development) it uses an embedded Postgres
 * (PGlite) stored in ./.data, so the app runs with zero setup.
 */

type Row = Record<string, unknown>;
type QueryFn = (text: string, params?: unknown[]) => Promise<Row[]>;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  passphrase_hash TEXT NOT NULL,
  recovery_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS sign_in_failures (
  id SERIAL PRIMARY KEY,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS node_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  theory_done_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, node_id)
);
CREATE TABLE IF NOT EXISTS attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  hints INTEGER NOT NULL DEFAULT 0,
  phase TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attempts_user_node ON attempts (user_id, node_id, at DESC);
CREATE TABLE IF NOT EXISTS cards (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  card JSONB NOT NULL,
  due TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, item_id)
);
CREATE TABLE IF NOT EXISTS puzzle_rating (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  rating REAL NOT NULL,
  rd REAL NOT NULL,
  vol REAL NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS puzzle_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puzzle_id TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  hints INTEGER NOT NULL DEFAULT 0,
  rated BOOLEAN NOT NULL,
  rating_after REAL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS puzzle_attempts_user ON puzzle_attempts (user_id, at DESC);
CREATE TABLE IF NOT EXISTS drill_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  drill TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

// One connection per process. Next bundles route handlers and pages separately, so a
// module-level variable would give each its own embedded database; globalThis is shared.
const g = globalThis as unknown as { __tempoQuery?: Promise<QueryFn> | null };

async function connect(): Promise<QueryFn> {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  let query: QueryFn;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    query = async (text, params = []) => (await sql.query(text, params)) as Row[];
    for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) {
      await query(stmt);
    }
  } else {
    if (process.env.NODE_ENV === "production" && !process.env.TEMPO_ALLOW_LOCAL_DB) {
      throw new Error("DATABASE_URL is not set. Add a Neon database in Vercel, Storage.");
    }
    const { PGlite } = await import("@electric-sql/pglite");
    const dir = process.env.TEMPO_LOCAL_DB ?? "./.data/pglite";
    (await import("node:fs")).mkdirSync(dir, { recursive: true });
    const db = new PGlite(dir);
    await db.exec(SCHEMA);
    query = async (text, params = []) => (await db.query<Row>(text, params)).rows;
  }
  return query;
}

export async function sql<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  if (!g.__tempoQuery) {
    g.__tempoQuery = connect().catch((err) => {
      g.__tempoQuery = null;
      throw err;
    });
  }
  const query = await g.__tempoQuery;
  return (await query(text, params)) as T[];
}
