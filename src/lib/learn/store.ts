import "server-only";
import { createEmptyCard, fsrs, generatorParameters, Rating, TypeConvert, type Card } from "ts-fsrs";
import { getNode, NODE_BY_ID } from "@/curriculum";
import { sql } from "@/lib/db";
import { isMastered, type Attempt, type DueCard, type NodeState, type Phase } from "./planner";

const scheduler = fsrs(generatorParameters({ enable_short_term: false, request_retention: 0.9 }));

export async function loadState(userId: number) {
  const [nodes, attempts, cards] = await Promise.all([
    sql<{ node_id: string; started_at: string; theory_done_at: string | null; mastered_at: string | null }>(
      "SELECT node_id, started_at, theory_done_at, mastered_at FROM node_progress WHERE user_id = $1",
      [userId],
    ),
    sql<{ node_id: string; item_id: string; correct: boolean; hints: number; phase: string; at: string }>(
      "SELECT node_id, item_id, correct, hints, phase, at FROM attempts WHERE user_id = $1 AND at > now() - interval '120 days' ORDER BY at",
      [userId],
    ),
    sql<{ item_id: string; node_id: string; due: string }>("SELECT item_id, node_id, due FROM cards WHERE user_id = $1", [userId]),
  ]);
  return {
    nodes: nodes
      .filter((n) => NODE_BY_ID.has(n.node_id))
      .map<NodeState>((n) => ({
        nodeId: n.node_id,
        startedAt: new Date(n.started_at),
        theoryDone: !!n.theory_done_at,
        masteredAt: n.mastered_at ? new Date(n.mastered_at) : null,
      })),
    attempts: attempts
      .filter((a) => NODE_BY_ID.has(a.node_id))
      .map<Attempt>((a) => ({ nodeId: a.node_id, itemId: a.item_id, correct: a.correct, hints: a.hints, phase: a.phase as Phase, at: new Date(a.at) })),
    dueCards: cards.filter((c) => NODE_BY_ID.has(c.node_id)).map<DueCard>((c) => ({ itemId: c.item_id, nodeId: c.node_id, due: new Date(c.due) })),
  };
}

export async function startNode(userId: number, nodeId: string) {
  getNode(nodeId);
  await sql("INSERT INTO node_progress (user_id, node_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [userId, nodeId]);
}

export async function markTheoryDone(userId: number, nodeId: string) {
  await startNode(userId, nodeId);
  await sql("UPDATE node_progress SET theory_done_at = COALESCE(theory_done_at, now()) WHERE user_id = $1 AND node_id = $2", [userId, nodeId]);
  await checkMastery(userId, nodeId);
}

export async function saveReflection(userId: number, text: string) {
  if (text.trim()) await sql("INSERT INTO reflections (user_id, text) VALUES ($1, $2)", [userId, text.trim().slice(0, 2000)]);
}

function reviveCard(raw: Record<string, unknown>): Card {
  return TypeConvert.card(raw as never);
}

export async function recordAttempt(userId: number, a: { nodeId: string; itemId: string; correct: boolean; hints: number; phase: Phase }) {
  const node = getNode(a.nodeId);
  if (!node.items.some((i) => i.id === a.itemId)) throw new Error("Item does not belong to node");
  await sql("INSERT INTO attempts (user_id, node_id, item_id, correct, hints, phase) VALUES ($1, $2, $3, $4, $5, $6)", [
    userId,
    a.nodeId,
    a.itemId,
    a.correct,
    Math.max(0, Math.min(10, a.hints | 0)),
    a.phase,
  ]);
  if (a.phase === "review") {
    const rows = await sql<{ card: Record<string, unknown> }>("SELECT card FROM cards WHERE user_id = $1 AND item_id = $2", [userId, a.itemId]);
    const now = new Date();
    const rating = !a.correct ? Rating.Again : a.hints > 0 ? Rating.Hard : Rating.Good;
    const card = rows[0] ? reviveCard(rows[0].card) : createEmptyCard(now);
    const next = scheduler.next(card, now, rating).card;
    await sql(
      `INSERT INTO cards (user_id, item_id, node_id, card, due) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, item_id) DO UPDATE SET card = EXCLUDED.card, due = EXCLUDED.due`,
      [userId, a.itemId, a.nodeId, JSON.stringify(next), next.due.toISOString()],
    );
  } else {
    await checkMastery(userId, a.nodeId);
  }
}

/** When a node is first mastered, every one of its items joins the spaced-review schedule. */
async function checkMastery(userId: number, nodeId: string): Promise<boolean> {
  const state = await loadState(userId);
  const ns = state.nodes.find((n) => n.nodeId === nodeId);
  if (!ns || ns.masteredAt || !isMastered(ns, state.attempts)) return false;
  await sql("UPDATE node_progress SET mastered_at = now() WHERE user_id = $1 AND node_id = $2 AND mastered_at IS NULL", [userId, nodeId]);
  const now = new Date();
  for (const item of getNode(nodeId).items) {
    const recent = state.attempts.filter((x) => x.itemId === item.id).slice(-3);
    const rating = recent.length && recent.every((x) => x.correct && !x.hints) ? Rating.Good : Rating.Hard;
    const card = scheduler.next(createEmptyCard(now), now, rating).card;
    await sql("INSERT INTO cards (user_id, item_id, node_id, card, due) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING", [
      userId,
      item.id,
      nodeId,
      JSON.stringify(card),
      card.due.toISOString(),
    ]);
  }
  return true;
}
