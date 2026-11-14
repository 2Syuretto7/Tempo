import "server-only";
import { sql } from "@/lib/db";
import { START, update, type Glicko } from "@/lib/glicko";
import { puzzles, type Puzzle } from "./data";
import { isEligible, teachingThemes, THEME_NAMES, unlockedThemes } from "./themes";

/** Missed puzzles come back after this many days. */
const RETURN_AFTER_DAYS = 3;
/** Puzzle ratings are taken as well-measured opponents. */
const PUZZLE_RD = 80;

async function masteredNodes(userId: number): Promise<Set<string>> {
  const rows = await sql<{ node_id: string }>("SELECT node_id FROM node_progress WHERE user_id = $1 AND mastered_at IS NOT NULL", [userId]);
  return new Set(rows.map((r) => r.node_id));
}

export async function getRating(userId: number): Promise<Glicko> {
  const [row] = await sql<{ rating: number; rd: number; vol: number }>("SELECT rating, rd, vol FROM puzzle_rating WHERE user_id = $1", [userId]);
  return row ? { rating: Number(row.rating), rd: Number(row.rd), vol: Number(row.vol) } : START;
}

/** What the Puzzles room can offer right now. */
export async function puzzleAccess(userId: number) {
  const unlocked = new Set(unlockedThemes(await masteredNodes(userId)));
  const pool = puzzles().all.filter((p) => isEligible(p.tags, unlocked));
  const counts = new Map<string, number>();
  for (const p of pool) for (const t of teachingThemes(p.tags)!) counts.set(t, (counts.get(t) ?? 0) + 1);
  const themes = [...counts.entries()].map(([id, count]) => ({ id, name: THEME_NAMES[id] ?? id, count })).sort((a, b) => b.count - a.count);
  return { unlocked, pool, themes, open: pool.length > 0 };
}

export async function puzzlesToday(userId: number): Promise<number> {
  const [row] = await sql<{ n: number }>(
    "SELECT count(*)::int AS n FROM puzzle_attempts WHERE user_id = $1 AND (at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date",
    [userId],
  );
  return Number(row?.n ?? 0);
}

function pick<T>(xs: T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}

/**
 * The next puzzle: a missed one that is due back, otherwise a fresh one near your
 * rating from a randomly chosen theme (interleaving), or from one theme if asked.
 */
export async function nextPuzzle(userId: number, theme?: string): Promise<{ puzzle: Puzzle; returning: boolean } | null> {
  const { pool } = await puzzleAccess(userId);
  if (!pool.length) return null;
  const byTheme = theme ? pool.filter((p) => p.tags.includes(theme)) : pool;
  if (!byTheme.length) return null;

  const history = await sql<{ puzzle_id: string; correct: boolean; at: string }>(
    "SELECT puzzle_id, correct, at FROM puzzle_attempts WHERE user_id = $1 ORDER BY at",
    [userId],
  );
  const last = new Map<string, { correct: boolean; at: Date }>();
  for (const h of history) last.set(h.puzzle_id, { correct: h.correct, at: new Date(h.at) });
  const allowed = new Set(byTheme.map((p) => p.id));

  const now = Date.now();
  const due = [...last.entries()]
    .filter(([id, h]) => allowed.has(id) && !h.correct && now - h.at.getTime() > RETURN_AFTER_DAYS * 864e5)
    .sort((a, b) => a[1].at.getTime() - b[1].at.getTime());
  if (due.length) return { puzzle: puzzles().byId.get(due[0][0])!, returning: true };

  const { rating } = await getRating(userId);
  const fresh = byTheme.filter((p) => !last.has(p.id));
  if (!fresh.length) return null;
  const themes = theme ? [theme] : [...new Set(fresh.flatMap((p) => teachingThemes(p.tags)!))];
  const chosenTheme = pick(themes);
  const inTheme = fresh.filter((p) => p.tags.includes(chosenTheme));
  for (const width of [75, 150, 300, 600]) {
    const near = inTheme.filter((p) => Math.abs(p.rating - rating) <= width);
    if (near.length) return { puzzle: pick(near), returning: false };
  }
  const closest = [...inTheme].sort((a, b) => Math.abs(a.rating - rating) - Math.abs(b.rating - rating));
  return { puzzle: closest[0], returning: false };
}

/**
 * Records a finished puzzle. Only a first, hint-free try is rated; a hint or a
 * retry still counts for review but leaves the rating alone.
 */
export async function recordPuzzle(userId: number, puzzleId: string, correct: boolean, hints: number) {
  const p = puzzles().byId.get(puzzleId);
  if (!p) throw new Error("Unknown puzzle");
  const [seen] = await sql<{ n: number }>("SELECT count(*)::int AS n FROM puzzle_attempts WHERE user_id = $1 AND puzzle_id = $2", [userId, puzzleId]);
  const rated = Number(seen?.n ?? 0) === 0 && hints === 0;
  const before = await getRating(userId);
  let after = before;
  if (rated) {
    after = update(before, { rating: p.rating, rd: PUZZLE_RD }, correct ? 1 : 0);
    await sql(
      `INSERT INTO puzzle_rating (user_id, rating, rd, vol) VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET rating = $2, rd = $3, vol = $4, updated_at = now()`,
      [userId, after.rating, after.rd, after.vol],
    );
  }
  await sql("INSERT INTO puzzle_attempts (user_id, puzzle_id, correct, hints, rated, rating_after) VALUES ($1, $2, $3, $4, $5, $6)", [
    userId,
    puzzleId,
    correct,
    hints,
    rated,
    after.rating,
  ]);
  return { rated, rating: Math.round(after.rating), delta: Math.round(after.rating - before.rating), provisional: after.rd > 110 };
}

export async function recentPuzzles(userId: number, limit = 10) {
  return sql<{ puzzle_id: string; correct: boolean; rated: boolean; at: string }>(
    "SELECT puzzle_id, correct, rated, at FROM puzzle_attempts WHERE user_id = $1 ORDER BY at DESC LIMIT $2",
    [userId, limit],
  );
}
