import { ALL_SQUARES, fenFrom, fileIndex, load, rankOf } from "@/lib/chess";
import { rng, randomSquare } from "@/curriculum/gen";

export type DrillId = "find-square" | "name-square" | "knight-route" | "find-checks";

export type DrillInfo = {
  id: DrillId;
  title: string;
  summary: string;
  /** The graph node the drill belongs to; it opens once you have started that node. */
  nodeId: string;
  /** How results are shown: a timed count, or found out of total. */
  unit: "timed" | "ratio";
};

export const DRILLS: DrillInfo[] = [
  { id: "find-square", title: "Find the square", summary: "A square is named; click it. Thirty seconds, no coordinates on the board.", nodeId: "chess.board", unit: "timed" },
  { id: "name-square", title: "Name the square", summary: "A square lights up; name it. Thirty seconds.", nodeId: "chess.board", unit: "timed" },
  { id: "knight-route", title: "Knight routes", summary: "Take the knight to the target in the fewest moves, one hop at a time.", nodeId: "chess.knight", unit: "ratio" },
  { id: "find-checks", title: "Find every check", summary: "Play every move that gives check, one at a time, before you press Done.", nodeId: "chess.check", unit: "ratio" },
];

export const DRILL_SECONDS = 30;

export function isKnightHop(a: string, b: string): boolean {
  const df = Math.abs(fileIndex(a) - fileIndex(b));
  const dr = Math.abs(rankOf(a) - rankOf(b));
  return (df === 1 && dr === 2) || (df === 2 && dr === 1);
}

/** The fewest knight moves from one square to another (breadth-first search). */
export function knightDistance(from: string, to: string): number {
  if (from === to) return 0;
  const seen = new Map<string, number>([[from, 0]]);
  const queue = [from];
  while (queue.length) {
    const sq = queue.shift()!;
    for (const n of ALL_SQUARES) {
      if (seen.has(n) || !isKnightHop(sq, n)) continue;
      const d = seen.get(sq)! + 1;
      if (n === to) return d;
      seen.set(n, d);
      queue.push(n);
    }
  }
  return Infinity;
}

/** A knight route task worth doing: two to four moves long. */
export function knightTask(seed: number): { from: string; to: string; moves: number } {
  const r = rng(seed);
  for (;;) {
    const from = randomSquare(r);
    const to = randomSquare(r, [from]);
    const moves = knightDistance(from, to);
    if (moves >= 2 && moves <= 4) return { from, to, moves };
  }
}

const OFFICERS = ["Q", "R", "R", "B", "B", "N", "N", "P", "P"];

/**
 * A small, legal position where White has between two and five checking moves,
 * none of which is mate, so the drill is about seeing checks, not finding mates.
 */
export function checksTask(seed: number): { fen: string; checks: string[] } {
  const r = rng(seed);
  for (let tries = 0; tries < 500; tries++) {
    const pieces: Record<string, string> = {};
    const used: string[] = [];
    const put = (p: string, ranks?: number[]) => {
      const sq = randomSquare(r, used, ranks);
      used.push(sq);
      pieces[sq] = p;
    };
    put("K");
    put("k");
    const n = 3 + r.int(2);
    for (let i = 0; i < n; i++) {
      const p = r.pick(OFFICERS);
      put(p, p === "P" ? [2, 3, 4, 5, 6] : undefined);
    }
    for (let i = 0; i < 2; i++) {
      const p = r.pick(["p", "p", "n", "b", "r"]);
      put(p, p === "p" ? [3, 4, 5, 6, 7] : undefined);
    }
    const fen = fenFrom(pieces, "w");
    let game;
    try {
      game = load(fen);
      // Black must not already be in check, and the kings must not touch.
      const flip = load(fen.replace(" w ", " b "));
      if (flip.inCheck()) continue;
      const [wk, bk] = [Object.keys(pieces).find((s) => pieces[s] === "K")!, Object.keys(pieces).find((s) => pieces[s] === "k")!];
      if (Math.abs(fileIndex(wk) - fileIndex(bk)) <= 1 && Math.abs(rankOf(wk) - rankOf(bk)) <= 1) continue;
    } catch {
      continue;
    }
    if (game.inCheck()) continue;
    const moves = game.moves();
    const checks = moves.filter((m) => m.endsWith("+"));
    if (moves.some((m) => m.endsWith("#"))) continue;
    if (checks.length >= 2 && checks.length <= 5) return { fen, checks };
  }
  throw new Error("Could not build a checks position");
}

/** Four names for a square: the right one and three that are easy to confuse with it. */
export function squareOptions(seed: number, square: string): string[] {
  const r = rng(seed);
  const f = fileIndex(square);
  const k = rankOf(square);
  const near = ALL_SQUARES.filter((s) => s !== square && (Math.abs(fileIndex(s) - f) <= 1 || s[0] === square[0] || Math.abs(rankOf(s) - k) <= 1 || rankOf(s) === 9 - k));
  const wrong = r.shuffle(near).slice(0, 3);
  return r.shuffle([square, ...wrong]);
}
