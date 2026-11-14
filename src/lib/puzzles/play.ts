import { load } from "@/lib/chess";
import type { Puzzle } from "./data";

export function uciParts(uci: string) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined };
}

/** The position after the first `ply` moves of the puzzle line. */
export function positionAt(p: Puzzle, ply: number): string {
  const game = load(p.fen);
  for (const uci of p.moves.slice(0, ply)) game.move(uciParts(uci));
  return game.fen();
}

/** The learner plays the side that moves after the opponent's setting move. */
export function learnerColour(p: Puzzle): "white" | "black" {
  return p.fen.split(" ")[1] === "w" ? "black" : "white";
}

/**
 * Judges the learner's move at `ply` (an odd index). Any move that mates is right,
 * as on Lichess, even if the stored line mates differently.
 */
export function judgeMove(p: Puzzle, ply: number, uci: string): "right" | "mate" | "wrong" {
  const fen = positionAt(p, ply);
  const expected = p.moves[ply];
  const game = load(fen);
  try {
    game.move(uciParts(uci));
  } catch {
    return "wrong";
  }
  if (game.isCheckmate()) return "mate";
  const norm = (u: string) => (u.length === 4 ? u : u.slice(0, 5));
  return norm(uci) === norm(expected) ? "right" : "wrong";
}
