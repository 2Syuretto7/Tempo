import { Chess, type Move } from "chess.js";

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const ALL_SQUARES: string[] = FILES.flatMap((f) => [1, 2, 3, 4, 5, 6, 7, 8].map((r) => `${f}${r}`));

export function fileIndex(sq: string) {
  return sq.charCodeAt(0) - 97;
}
export function rankOf(sq: string) {
  return Number(sq[1]);
}
/** a1 is dark, h1 is light. */
export function isDark(sq: string) {
  return (fileIndex(sq) + rankOf(sq)) % 2 === 1;
}

/** Load a position. Teaching positions may lack kings, so validation is relaxed. */
export function load(fen: string): Chess {
  return new Chess(fen, { skipValidation: true });
}

/** Build a FEN from a map like { d4: "R", e8: "k" }. */
export function fenFrom(pieces: Record<string, string>, turn: "w" | "b" = "w", castling = "-", ep = "-"): string {
  const rows: string[] = [];
  for (let r = 8; r >= 1; r--) {
    let row = "";
    let empty = 0;
    for (const f of FILES) {
      const p = pieces[`${f}${r}`];
      if (p) {
        if (empty) row += empty;
        empty = 0;
        row += p;
      } else empty++;
    }
    if (empty) row += empty;
    rows.push(row);
  }
  return `${rows.join("/")} ${turn} ${castling} ${ep} 0 1`;
}

export function piecesOf(fen: string): Record<string, string> {
  const out: Record<string, string> = {};
  const rows = fen.split(" ")[0].split("/");
  rows.forEach((row, i) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) f += Number(ch);
      else {
        out[`${FILES[f]}${8 - i}`] = ch;
        f++;
      }
    }
  });
  return out;
}

export function legalMoves(fen: string, from?: string): Move[] {
  const game = load(fen);
  return from ? game.moves({ square: from as never, verbose: true }) : game.moves({ verbose: true });
}

export function targetsFrom(fen: string, from: string): string[] {
  return [...new Set(legalMoves(fen, from).map((m) => m.to))].sort();
}

/** Plays a move given as from/to(/promotion). Returns the move or null if illegal. */
export function tryMove(fen: string, from: string, to: string, promotion?: string) {
  const game = load(fen);
  try {
    const move = game.move({ from, to, promotion: promotion ?? "q" });
    return { move, game };
  } catch {
    return null;
  }
}

export function mateMoves(fen: string): string[] {
  return legalMoves(fen)
    .filter((m) => {
      const g = load(fen);
      g.move(m.san);
      return g.isCheckmate();
    })
    .map((m) => m.san);
}

export function checkMoves(fen: string): string[] {
  return legalMoves(fen)
    .filter((m) => m.san.includes("+") || m.san.includes("#"))
    .map((m) => m.san);
}

export const PIECE_NAMES: Record<string, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

export const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
