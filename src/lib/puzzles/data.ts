import { readFileSync } from "node:fs";
import path from "node:path";

/** One Lichess puzzle. `moves` are UCI; the first is the opponent's move that sets the puzzle. */
export type Puzzle = { id: string; fen: string; moves: string[]; rating: number; tags: string[] };

export function parsePuzzles(csv: string): Puzzle[] {
  const out: Puzzle[] = [];
  const lines = csv.split("\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const [id, fen, moves, rating, themes] = line.split(",");
    out.push({ id, fen, moves: moves.split(" "), rating: Number(rating), tags: (themes ?? "").split(" ").filter(Boolean) });
  }
  return out;
}

const g = globalThis as unknown as { __tempoPuzzles?: { all: Puzzle[]; byId: Map<string, Puzzle> } };

export function puzzles() {
  if (!g.__tempoPuzzles) {
    let all: Puzzle[] = [];
    try {
      all = parsePuzzles(readFileSync(path.join(process.cwd(), "data", "puzzles.csv"), "utf8"));
    } catch {
      all = [];
    }
    g.__tempoPuzzles = { all, byId: new Map(all.map((p) => [p.id, p])) };
  }
  return g.__tempoPuzzles;
}
