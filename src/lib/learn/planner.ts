/**
 * The Learn planner. Pure functions: given what the learner has done, decide the next
 * stretch of work. Order: due reviews, repair, consolidation, then at most one new idea
 * per day, taught through the Feynman loop. See the Tempo plan, "Home page and the one
 * Learn button" and "The learning engine".
 */
import { NODES, getNode, unlocks } from "@/curriculum";
import type { LearningNode } from "@/curriculum/types";

export type Phase = "review" | "recall" | "guided" | "independent" | "consolidate" | "repair" | "try";

export type Attempt = { nodeId: string; itemId: string; correct: boolean; hints: number; phase: Phase; at: Date };
export type NodeState = { nodeId: string; startedAt: Date; theoryDone: boolean; explanationOk: boolean; masteredAt: Date | null };
export type DueCard = { itemId: string; nodeId: string; due: Date };

export type Activity =
  | { type: "theory"; nodeId: string }
  | { type: "explain"; nodeId: string }
  | { type: "reflect"; nodeId: string }
  | { type: "exercise"; nodeId: string; itemId: string; seed: number; phase: Phase };

export type Block = { title: string; kind: "review" | "repair" | "consolidate" | "new" | "continue"; nodeId?: string; activities: Activity[] };

export type Plan = { blocks: Block[]; headline: string; done: boolean };

export type LearnerState = { now: Date; nodes: NodeState[]; attempts: Attempt[]; dueCards: DueCard[]; seed?: () => number };

export const RULES = {
  maxReviews: 8,
  guidedPerNode: 5,
  independentPerNode: 4,
  consolidatePerNode: 5,
  masteryWindow: 8,
  masteryCorrect: 7, // 7 of the last 8 hint-free attempts: 87.5%
  masteryDays: 2,
  newNodesPerDay: 1,
  timeZone: "Asia/Kolkata",
};

const MASTERY_PHASES: Phase[] = ["guided", "independent", "consolidate", "repair"];
const PRACTICE_PHASES: Phase[] = ["guided", "independent", "consolidate", "repair"];

export function localDay(d: Date, timeZone = RULES.timeZone): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Has this node been earned? Accurate without hints, on two separate days, explained correctly. */
export function isMastered(node: NodeState | undefined, attempts: Attempt[]): boolean {
  if (!node || !node.theoryDone || !node.explanationOk) return false;
  const recent = attempts
    .filter((a) => a.nodeId === node.nodeId && MASTERY_PHASES.includes(a.phase) && a.hints === 0)
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, RULES.masteryWindow);
  if (recent.length < RULES.masteryWindow) return false;
  if (recent.filter((a) => a.correct).length < RULES.masteryCorrect) return false;
  return new Set(recent.filter((a) => a.correct).map((a) => localDay(a.at))).size >= RULES.masteryDays;
}

export type Status = "locked" | "available" | "learning" | "mastered";

export function statuses(nodes: NodeState[]): Map<string, Status> {
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const out = new Map<string, Status>();
  for (const n of NODES) {
    const s = byId.get(n.id);
    if (s?.masteredAt) out.set(n.id, "mastered");
    else if (s) out.set(n.id, "learning");
    else out.set(n.id, n.prereqs.every((p) => byId.get(p)?.masteredAt) ? "available" : "locked");
  }
  return out;
}

function reach(id: string): number {
  const seen = new Set<string>();
  const walk = (x: string) => unlocks(x).forEach((n) => !seen.has(n.id) && (seen.add(n.id), walk(n.id)));
  walk(id);
  return seen.size;
}

/** Choose the next new idea: earliest stage, then what unlocks the most, then the track least recently advanced. */
export function chooseNext(nodes: NodeState[]): LearningNode | null {
  const st = statuses(nodes);
  const lastByTrack = new Map<string, number>();
  for (const n of nodes) {
    const t = getNode(n.nodeId).track;
    lastByTrack.set(t, Math.max(lastByTrack.get(t) ?? 0, n.startedAt.getTime()));
  }
  const candidates = NODES.filter((n) => st.get(n.id) === "available");
  candidates.sort(
    (a, b) =>
      a.stage - b.stage ||
      reach(b.id) - reach(a.id) ||
      (lastByTrack.get(a.track) ?? 0) - (lastByTrack.get(b.track) ?? 0) ||
      NODES.indexOf(a) - NODES.indexOf(b),
  );
  return candidates[0] ?? null;
}

function makeSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

function exercise(node: LearningNode, index: number, phase: Phase, seed: () => number): Activity {
  const item = node.items[index % node.items.length];
  return { type: "exercise", nodeId: node.id, itemId: item.id, seed: seed(), phase };
}

/** Older, related ideas to mix in: horizontal links first, then prerequisites. */
function interleavePool(node: LearningNode, mastered: Set<string>): LearningNode[] {
  const ids = [...node.related, ...node.prereqs].filter((id, i, a) => mastered.has(id) && a.indexOf(id) === i);
  return ids.map(getNode);
}

export function plan(state: LearnerState): Plan {
  const { now, nodes, attempts } = state;
  const seed = state.seed ?? makeSeed;
  const today = localDay(now);
  const mastered = new Set(nodes.filter((n) => n.masteredAt).map((n) => n.nodeId));
  const todays = attempts.filter((a) => localDay(a.at) === today);
  const blocks: Block[] = [];

  // 1. Reviews that are due.
  const due = state.dueCards.filter((c) => c.due <= now).sort((a, b) => a.due.getTime() - b.due.getTime());
  const reviewedToday = new Set(todays.filter((a) => a.phase === "review").map((a) => a.itemId));
  const reviews = due.filter((c) => !reviewedToday.has(c.itemId)).slice(0, RULES.maxReviews);
  if (reviews.length) {
    blocks.push({
      title: "Review",
      kind: "review",
      activities: reviews.map((c) => ({ type: "exercise", nodeId: c.nodeId, itemId: c.itemId, seed: seed(), phase: "review" })),
    });
  }

  // 2. Repair before progress: a failed review sends you back to that idea and its weakest prerequisite.
  const failed = new Set(
    attempts
      .filter((a) => a.phase === "review" && !a.correct && now.getTime() - a.at.getTime() < 3 * 864e5)
      .map((a) => a.nodeId),
  );
  const repairedToday = new Set(todays.filter((a) => a.phase === "repair").map((a) => a.nodeId));
  for (const id of [...failed].filter((x) => !repairedToday.has(x)).slice(0, 2)) {
    const node = getNode(id);
    const acts: Activity[] = [exercise(node, 0, "repair", seed), exercise(node, 1, "repair", seed)];
    const weakest = node.prereqs
      .map((p) => {
        const xs = attempts.filter((a) => a.nodeId === p).slice(-10);
        return { p, acc: xs.length ? xs.filter((a) => a.correct).length / xs.length : 1 };
      })
      .sort((a, b) => a.acc - b.acc)[0];
    if (weakest && weakest.acc < 0.9) acts.push(exercise(getNode(weakest.p), 0, "repair", seed));
    blocks.push({ title: `Repair: ${node.title}`, kind: "repair", nodeId: id, activities: acts });
  }

  // 3. Unfinished work from today, then consolidation of ideas begun on earlier days.
  for (const n of nodes.filter((x) => !x.masteredAt)) {
    const node = getNode(n.nodeId);
    const practisedToday = todays.filter((a) => a.nodeId === n.nodeId && PRACTICE_PHASES.includes(a.phase)).length;
    const startedToday = localDay(n.startedAt) === today;
    if (startedToday) {
      const acts: Activity[] = [];
      if (!n.theoryDone) acts.push({ type: "theory", nodeId: node.id });
      if (!n.explanationOk) acts.push({ type: "explain", nodeId: node.id });
      const target = RULES.guidedPerNode + RULES.independentPerNode;
      for (let i = practisedToday; i < target; i++) acts.push(exercise(node, i, i < RULES.guidedPerNode ? "guided" : "independent", seed));
      if (acts.length) blocks.push({ title: node.title, kind: "continue", nodeId: node.id, activities: acts });
    } else if (practisedToday === 0 || !n.theoryDone || !n.explanationOk) {
      const acts: Activity[] = [];
      if (!n.theoryDone) acts.push({ type: "theory", nodeId: node.id });
      if (!n.explanationOk) acts.push({ type: "explain", nodeId: node.id });
      if (practisedToday === 0) {
        const pool = interleavePool(node, mastered);
        for (let i = 0; i < RULES.consolidatePerNode; i++) {
          acts.push(exercise(node, i + 1, "consolidate", seed));
          if (i % 2 === 1 && pool.length) acts.push(exercise(pool[i % pool.length], i, "independent", seed));
        }
      }
      if (acts.length) blocks.push({ title: `Make it stick: ${node.title}`, kind: "consolidate", nodeId: node.id, activities: acts });
    }
  }

  // 4. At most one new idea per day.
  const startedTodayCount = nodes.filter((n) => localDay(n.startedAt) === today).length;
  const pendingWork = blocks.some((b) => b.kind !== "review");
  if (startedTodayCount < RULES.newNodesPerDay && !pendingWork) {
    const next = chooseNext(nodes);
    if (next) blocks.push(newNodeBlock(next, mastered, seed));
  }

  const headline = describe(blocks, nodes, now);
  return { blocks, headline, done: blocks.length === 0 };
}

export function newNodeBlock(node: LearningNode, mastered: Set<string>, seed: () => number = makeSeed): Block {
  const acts: Activity[] = [];
  // Recall: retrieve the prerequisites from memory before building on them.
  for (const p of node.prereqs.filter((x) => mastered.has(x)).slice(0, 2)) acts.push(exercise(getNode(p), 0, "recall", seed));
  acts.push({ type: "theory", nodeId: node.id });
  acts.push({ type: "explain", nodeId: node.id });
  for (let i = 0; i < RULES.guidedPerNode; i++) acts.push(exercise(node, i, "guided", seed));
  const pool = interleavePool(node, mastered);
  for (let i = 0; i < RULES.independentPerNode; i++) {
    acts.push(exercise(node, i + RULES.guidedPerNode, "independent", seed));
    if (i % 2 === 1 && pool.length) acts.push(exercise(pool[i % pool.length], i, "independent", seed));
  }
  acts.push({ type: "reflect", nodeId: node.id });
  return { title: `New: ${node.title}`, kind: "new", nodeId: node.id, activities: acts };
}

function describe(blocks: Block[], nodes: NodeState[], now: Date): string {
  if (!blocks.length) {
    const startedToday = nodes.some((n) => localDay(n.startedAt) === localDay(now));
    const next = chooseNext(nodes);
    if (startedToday) return "Done for today. Sleep is part of learning; the next idea will be waiting tomorrow.";
    return next ? `Next: ${next.title}.` : "Everything available is mastered. New lessons are on the way.";
  }
  const parts: string[] = [];
  const reviews = blocks.filter((b) => b.kind === "review").reduce((n, b) => n + b.activities.length, 0);
  if (reviews) parts.push(`${reviews} review${reviews === 1 ? "" : "s"}`);
  const repair = blocks.filter((b) => b.kind === "repair");
  if (repair.length) parts.push(`a repair of ${repair.map((b) => getNode(b.nodeId!).title.toLowerCase()).join(" and ")}`);
  const cont = blocks.filter((b) => b.kind === "continue" || b.kind === "consolidate");
  if (cont.length) parts.push(`more practice on ${cont.map((b) => getNode(b.nodeId!).title.toLowerCase()).join(" and ")}`);
  const fresh = blocks.find((b) => b.kind === "new");
  if (fresh) parts.push(`a new idea, ${getNode(fresh.nodeId!).title.toLowerCase()}`);
  const text = parts.length > 1 ? `${parts.slice(0, -1).join(", ")}, then ${parts.at(-1)}` : parts[0];
  return `Today: ${text}.`;
}
