import { NODE_BY_ID } from "@/curriculum";
import type { Exercise } from "@/curriculum/types";
import { load } from "@/lib/chess";
import { puzzles } from "./data";
import { positionAt, uciParts } from "./play";
import { teachingThemes, THEME_NODE } from "./themes";

/** The puzzle at this point of its line, as an exercise Kibitzer can hint at and the guard can protect. */
export function puzzleExercise(puzzleId: string, ply: number): { nodeId: string; exercise: Exercise } {
  const p = puzzles().byId.get(puzzleId);
  if (!p) throw new Error("Unknown puzzle");
  const at = Math.min(Math.max(1, ply | 1), p.moves.length - 1);
  const fen = positionAt(p, at);
  const game = load(fen);
  const move = game.move(uciParts(p.moves[at]));
  const final = at === p.moves.length - 1;
  const themes = teachingThemes(p.tags) ?? [];
  const nodeId = themes.map((t) => THEME_NODE[t]).find((id) => NODE_BY_ID.has(id)) ?? "chess.checkmate";
  const mates = final && game.isCheckmate();
  return {
    nodeId,
    exercise: {
      kind: "move",
      fen,
      prompt: mates ? "Find the checkmate." : "Find the best move.",
      goal: mates ? { type: "mate" } : { type: "san", moves: [move.san] },
    },
  };
}
