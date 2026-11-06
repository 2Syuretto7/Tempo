// A small, dependency-free model of a chess position.
// It covers everything the early courses need: piece movement, captures,
// attacks and king safety. Castling and en passant arrive with Course 1.2.

export type Color = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Square = string;

export interface Piece {
  type: PieceType;
  color: Color;
}

export interface Position {
  board: Map<Square, Piece>;
  turn: Color;
}

export const FILES = 'abcdefgh';

export const PIECE_VALUES: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export const PIECE_NAMES: Record<PieceType, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

export const ALL_SQUARES: Square[] = (() => {
  const out: Square[] = [];
  for (let r = 8; r >= 1; r--) for (const f of FILES) out.push(f + r);
  return out;
})();

export function fileIndex(sq: Square): number {
  return FILES.indexOf(sq[0]);
}

export function rankOf(sq: Square): number {
  return Number(sq[1]);
}

export function makeSquare(fileIdx: number, rank: number): Square | undefined {
  if (fileIdx < 0 || fileIdx > 7 || rank < 1 || rank > 8) return undefined;
  return FILES[fileIdx] + rank;
}

export function isSquare(s: string): boolean {
  return /^[a-h][1-8]$/.test(s);
}

/** a1 is dark. A square is dark when (file number + rank number) is even. */
export function squareShade(sq: Square): 'light' | 'dark' {
  return (fileIndex(sq) + 1 + rankOf(sq)) % 2 === 0 ? 'dark' : 'light';
}

export function parseFen(fen: string): Position {
  const [placement, turn = 'w'] = fen.trim().split(/\s+/);
  const rows = placement.split('/');
  if (rows.length !== 8) throw new Error(`FEN needs 8 ranks: ${fen}`);
  const board = new Map<Square, Piece>();
  rows.forEach((row, i) => {
    const rank = 8 - i;
    let f = 0;
    for (const ch of row) {
      if (/[1-8]/.test(ch)) {
        f += Number(ch);
        continue;
      }
      const lower = ch.toLowerCase() as PieceType;
      if (!'pnbrqk'.includes(lower)) throw new Error(`Unknown piece "${ch}" in FEN: ${fen}`);
      const sq = makeSquare(f, rank);
      if (!sq) throw new Error(`Rank ${rank} is too long in FEN: ${fen}`);
      board.set(sq, { type: lower, color: ch === lower ? 'b' : 'w' });
      f++;
    }
    if (f !== 8) throw new Error(`Rank ${rank} does not have 8 squares in FEN: ${fen}`);
  });
  return { board, turn: turn === 'b' ? 'b' : 'w' };
}

export function toFen(pos: Position): string {
  const rows: string[] = [];
  for (let r = 8; r >= 1; r--) {
    let row = '';
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = pos.board.get(FILES[f] + r);
      if (!p) {
        empty++;
        continue;
      }
      if (empty) row += empty;
      empty = 0;
      row += p.color === 'w' ? p.type.toUpperCase() : p.type;
    }
    if (empty) row += empty;
    rows.push(row);
  }
  return `${rows.join('/')} ${pos.turn} - - 0 1`;
}

const ROOK_DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const BISHOP_DIRS = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];
const KNIGHT_JUMPS = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];
const KING_STEPS = [...ROOK_DIRS, ...BISHOP_DIRS];

function slide(pos: Position, from: Square, dirs: number[][]): Square[] {
  const out: Square[] = [];
  const f0 = fileIndex(from);
  const r0 = rankOf(from);
  for (const [df, dr] of dirs) {
    let f = f0 + df;
    let r = r0 + dr;
    let sq = makeSquare(f, r);
    while (sq) {
      out.push(sq);
      if (pos.board.has(sq)) break;
      f += df;
      r += dr;
      sq = makeSquare(f, r);
    }
  }
  return out;
}

function steps(from: Square, deltas: number[][]): Square[] {
  const f0 = fileIndex(from);
  const r0 = rankOf(from);
  return deltas.map(([df, dr]) => makeSquare(f0 + df, r0 + dr)).filter((s): s is Square => !!s);
}

/** Squares a piece attacks (could capture on), regardless of what stands there. */
export function attacks(pos: Position, from: Square): Square[] {
  const piece = pos.board.get(from);
  if (!piece) return [];
  switch (piece.type) {
    case 'r':
      return slide(pos, from, ROOK_DIRS);
    case 'b':
      return slide(pos, from, BISHOP_DIRS);
    case 'q':
      return slide(pos, from, KING_STEPS);
    case 'n':
      return steps(from, KNIGHT_JUMPS);
    case 'k':
      return steps(from, KING_STEPS);
    case 'p': {
      const dir = piece.color === 'w' ? 1 : -1;
      return steps(from, [
        [-1, dir],
        [1, dir],
      ]);
    }
  }
}

/** Moves that follow the piece's movement rules, ignoring the safety of its own king. */
export function pseudoMoves(pos: Position, from: Square): Square[] {
  const piece = pos.board.get(from);
  if (!piece) return [];
  const isEnemy = (sq: Square) => {
    const p = pos.board.get(sq);
    return !!p && p.color !== piece.color;
  };
  if (piece.type !== 'p') {
    return attacks(pos, from).filter((sq) => {
      const p = pos.board.get(sq);
      return !p || (p.color !== piece.color && p.type !== 'k');
    });
  }
  const dir = piece.color === 'w' ? 1 : -1;
  const startRank = piece.color === 'w' ? 2 : 7;
  const out: Square[] = [];
  const one = makeSquare(fileIndex(from), rankOf(from) + dir);
  if (one && !pos.board.has(one)) {
    out.push(one);
    const two = makeSquare(fileIndex(from), rankOf(from) + 2 * dir);
    if (rankOf(from) === startRank && two && !pos.board.has(two)) out.push(two);
  }
  for (const sq of attacks(pos, from)) {
    if (isEnemy(sq) && pos.board.get(sq)!.type !== 'k') out.push(sq);
  }
  return out;
}

export function isAttacked(pos: Position, target: Square, by: Color): boolean {
  for (const [sq, p] of pos.board) {
    if (p.color === by && attacks(pos, sq).includes(target)) return true;
  }
  return false;
}

export function findKing(pos: Position, color: Color): Square | undefined {
  for (const [sq, p] of pos.board) if (p.type === 'k' && p.color === color) return sq;
  return undefined;
}

export function inCheck(pos: Position, color: Color): boolean {
  const k = findKing(pos, color);
  return !!k && isAttacked(pos, k, color === 'w' ? 'b' : 'w');
}

/** Plays a move without checking it. Pawns reaching the last rank become queens. */
export function applyMove(pos: Position, from: Square, to: Square): Position {
  const board = new Map(pos.board);
  const piece = board.get(from);
  if (!piece) return pos;
  board.delete(from);
  const lastRank = piece.color === 'w' ? 8 : 1;
  board.set(to, piece.type === 'p' && rankOf(to) === lastRank ? { type: 'q', color: piece.color } : piece);
  return { board, turn: piece.color === 'w' ? 'b' : 'w' };
}

/** Moves that obey the piece's rules and do not leave its own king attacked. */
export function legalMoves(pos: Position, from: Square): Square[] {
  const piece = pos.board.get(from);
  if (!piece) return [];
  const enemy: Color = piece.color === 'w' ? 'b' : 'w';
  return pseudoMoves(pos, from).filter((to) => {
    const next = applyMove(pos, from, to);
    const king = findKing(next, piece.color);
    return !king || !isAttacked(next, king, enemy);
  });
}

export function allLegalMoves(pos: Position, color: Color): string[] {
  const out: string[] = [];
  for (const [sq, p] of pos.board) {
    if (p.color !== color) continue;
    for (const to of legalMoves(pos, sq)) out.push(sq + to);
  }
  return out;
}

/** Squares of enemy pieces (not the king) that `color` can capture with a legal move. */
export function captureTargets(pos: Position, color: Color): Square[] {
  const out = new Set<Square>();
  for (const mv of allLegalMoves(pos, color)) {
    const to = mv.slice(2, 4);
    const p = pos.board.get(to);
    if (p && p.color !== color) out.add(to);
  }
  return [...out].sort();
}

/** Is `sq` defended by a piece of `color` (could that side recapture there)? */
export function isDefended(pos: Position, sq: Square, color: Color): boolean {
  for (const [from, p] of pos.board) {
    if (p.color !== color || from === sq) continue;
    if (attacks(pos, from).includes(sq)) return true;
  }
  return false;
}
