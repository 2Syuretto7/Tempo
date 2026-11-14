import { NODE_BY_ID } from "@/curriculum";

/**
 * Lichess puzzle themes, tied to the graph node that teaches them. A puzzle is
 * offered only when every theme it carries belongs to a node you have mastered,
 * so a puzzle never asks for an idea you have not met. Nodes that are not yet
 * written simply keep their puzzles locked.
 */
export const THEME_NODE: Record<string, string> = {
  mateIn1: "chess.checkmate",
  promotion: "chess.promotion",
  underPromotion: "chess.promotion",
  enPassant: "chess.en-passant",
  castling: "chess.castling",
  mateIn2: "chess.mate-in-two",
  mateIn3: "chess.mate-in-three",
  backRankMate: "chess.back-rank-mate",
  smotheredMate: "chess.smothered-mate",
  anastasiaMate: "chess.anastasia-mate",
  arabianMate: "chess.arabian-mate",
  hookMate: "chess.hook-mate",
  doubleBishopMate: "chess.mating-patterns",
  dovetailMate: "chess.mating-patterns",
  bodenMate: "chess.mating-patterns",
  mateIn4: "chess.longer-mates",
  mateIn5: "chess.longer-mates",
  pillsburysMate: "chess.mating-patterns",
  operaMate: "chess.mating-patterns",
  epauletteMate: "chess.mating-patterns",
  cornerMate: "chess.mating-patterns",
  morphysMate: "chess.mating-patterns",
  swallowstailMate: "chess.mating-patterns",
  blindSwineMate: "chess.mating-patterns",
  triangleMate: "chess.mating-patterns",
  killBoxMate: "chess.mating-patterns",
  vukovicMate: "chess.mating-patterns",
  balestraMate: "chess.mating-patterns",
  hangingPiece: "chess.hanging-pieces",
  discoveredCheck: "chess.discovered-attack",
  collinearMove: "chess.quiet-move",
  fork: "chess.fork",
  pin: "chess.pin",
  skewer: "chess.skewer",
  discoveredAttack: "chess.discovered-attack",
  doubleCheck: "chess.double-check",
  deflection: "chess.deflection",
  attraction: "chess.decoy",
  capturingDefender: "chess.removing-defender",
  trappedPiece: "chess.trapped-piece",
  intermezzo: "chess.intermezzo",
  xRayAttack: "chess.x-ray",
  clearance: "chess.clearance",
  interference: "chess.interference",
  quietMove: "chess.quiet-move",
  defensiveMove: "chess.defence",
  sacrifice: "chess.sacrifice",
  zugzwang: "chess.zugzwang",
  advancedPawn: "chess.passed-pawns",
  exposedKing: "chess.king-safety",
  kingsideAttack: "chess.attacking-the-king",
  queensideAttack: "chess.attacking-the-king",
  attackingF2F7: "chess.attacking-the-king",
  pawnEndgame: "chess.pawn-endings",
  rookEndgame: "chess.rook-endings",
  queenEndgame: "chess.queen-endings",
  queenRookEndgame: "chess.queen-endings",
  bishopEndgame: "chess.minor-piece-endings",
  knightEndgame: "chess.minor-piece-endings",
};

/** Tags that describe a puzzle's shape rather than an idea, so they never lock it. */
export const NEUTRAL = new Set([
  "opening", "middlegame", "endgame", "short", "long", "veryLong", "oneMove", "mate",
  "crushing", "advantage", "equality", "master", "masterVsMaster", "superGM",
]);

export const THEME_NAMES: Record<string, string> = {
  mateIn1: "Mate in one",
  promotion: "Promotion",
  underPromotion: "Underpromotion",
  enPassant: "En passant",
  castling: "Castling",
  mateIn2: "Mate in two",
  mateIn3: "Mate in three",
  backRankMate: "Back-rank mate",
  smotheredMate: "Smothered mate",
  anastasiaMate: "Anastasia's mate",
  arabianMate: "Arabian mate",
  hookMate: "Hook mate",
  doubleBishopMate: "Two-bishop mate",
  dovetailMate: "Dovetail mate",
  bodenMate: "Boden's mate",
  mateIn4: "Mate in four",
  mateIn5: "Mate in five or more",
  pillsburysMate: "Pillsbury's mate",
  operaMate: "Opera mate",
  epauletteMate: "Epaulette mate",
  cornerMate: "Corner mate",
  morphysMate: "Morphy's mate",
  swallowstailMate: "Swallow's tail mate",
  blindSwineMate: "Blind swine mate",
  triangleMate: "Triangle mate",
  killBoxMate: "Kill box mate",
  vukovicMate: "Vukovic mate",
  balestraMate: "Balestra mate",
  hangingPiece: "Hanging piece",
  discoveredCheck: "Discovered check",
  collinearMove: "Collinear move",
  fork: "Fork",
  pin: "Pin",
  skewer: "Skewer",
  discoveredAttack: "Discovered attack",
  doubleCheck: "Double check",
  deflection: "Deflection",
  attraction: "Decoy",
  capturingDefender: "Removing the defender",
  trappedPiece: "Trapped piece",
  intermezzo: "In-between move",
  xRayAttack: "X-ray",
  clearance: "Clearance",
  interference: "Interference",
  quietMove: "Quiet move",
  defensiveMove: "Defence",
  sacrifice: "Sacrifice",
  zugzwang: "Zugzwang",
  advancedPawn: "Advanced pawn",
  exposedKing: "Exposed king",
  kingsideAttack: "Kingside attack",
  queensideAttack: "Queenside attack",
  attackingF2F7: "Attacking f2 and f7",
  pawnEndgame: "Pawn ending",
  rookEndgame: "Rook ending",
  queenEndgame: "Queen ending",
  queenRookEndgame: "Queen and rook ending",
  bishopEndgame: "Bishop ending",
  knightEndgame: "Knight ending",
};

/** The teaching themes of a puzzle, or null if it carries a tag Tempo does not know. */
export function teachingThemes(tags: string[]): string[] | null {
  const out: string[] = [];
  for (const t of tags) {
    if (NEUTRAL.has(t)) continue;
    if (!THEME_NODE[t]) return null;
    out.push(t);
  }
  return out.length ? out : null;
}

/** Themes whose node exists in the curriculum and is mastered. */
export function unlockedThemes(mastered: Set<string>): string[] {
  return Object.keys(THEME_NODE).filter((t) => NODE_BY_ID.has(THEME_NODE[t]) && mastered.has(THEME_NODE[t]));
}

/** Every theme whose node is written, mastered or not: for when the learner chooses to run ahead. */
export function writtenThemes(): string[] {
  return Object.keys(THEME_NODE).filter((t) => NODE_BY_ID.has(THEME_NODE[t]));
}

export function isEligible(tags: string[], unlocked: Set<string>): boolean {
  const themes = teachingThemes(tags);
  return !!themes && themes.every((t) => unlocked.has(t));
}
