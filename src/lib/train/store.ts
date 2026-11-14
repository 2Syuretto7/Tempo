import "server-only";
import { sql } from "@/lib/db";
import { DRILLS, type DrillId } from "./drills";

export async function recordDrill(userId: number, drill: DrillId, score: number, total: number) {
  if (!DRILLS.some((d) => d.id === drill)) throw new Error("Unknown drill");
  await sql("INSERT INTO drill_results (user_id, drill, score, total) VALUES ($1, $2, $3, $4)", [userId, drill, Math.max(0, score | 0), Math.max(0, total | 0)]);
  return bests(userId);
}

export async function bests(userId: number): Promise<Record<string, { best: number; total: number; runs: number }>> {
  const rows = await sql<{ drill: string; score: number; total: number }>("SELECT drill, score, total FROM drill_results WHERE user_id = $1", [userId]);
  const out: Record<string, { best: number; total: number; runs: number }> = {};
  for (const r of rows) {
    const cur = out[r.drill] ?? { best: -1, total: 0, runs: 0 };
    cur.runs++;
    // Timed drills compare counts; ratio drills compare the share found.
    const better = r.total ? r.score / r.total > (cur.total ? cur.best / cur.total : -1) : r.score > cur.best;
    if (better || cur.best < 0) {
      cur.best = Number(r.score);
      cur.total = Number(r.total);
    }
    out[r.drill] = cur;
  }
  return out;
}

export async function startedNodes(userId: number): Promise<Set<string>> {
  const rows = await sql<{ node_id: string }>("SELECT node_id FROM node_progress WHERE user_id = $1", [userId]);
  return new Set(rows.map((r) => r.node_id));
}
