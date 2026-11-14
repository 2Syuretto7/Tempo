import { fenFrom, legalMoves, PIECE_NAMES, targetsFrom, isDark, fileIndex, rankOf } from "@/lib/chess";
import { choice, randomSquare, rng, until } from "../gen";
import type { Item, LearningNode } from "../types";

const C = "chess";

/** "Click every square this piece can reach", with a few other pieces as obstacles. */
function reachItem(id: string, piece: string, opts: { others?: number; ranks?: number[]; enemyOnly?: boolean } = {}): Item {
  return {
    id,
    generate: (seed) =>
      until(rng(seed), (r) => {
        const from = randomSquare(r, [], opts.ranks);
        const pieces: Record<string, string> = { [from]: piece };
        const n = r.int((opts.others ?? 3) + 1);
        for (let i = 0; i < n; i++) {
          const sq = randomSquare(r, Object.keys(pieces), [2, 3, 4, 5, 6, 7]);
          const kind = r.pick(["p", "n", "b", "r"]);
          pieces[sq] = opts.enemyOnly || r.next() < 0.6 ? kind : kind.toUpperCase();
        }
        const fen = fenFrom(pieces);
        const targets = targetsFrom(fen, from);
        if (targets.length < 2) return null;
        const name = PIECE_NAMES[piece.toLowerCase()];
        return {
          kind: "squares" as const,
          fen,
          prompt: `Select every square the ${name} on ${from} can move to, then press Check.`,
          targets,
          explain: `The ${name} on ${from} has ${targets.length} moves here. Friendly pieces block it; enemy pieces can be captured.`,
        };
      }),
  };
}

/** One capture is possible among several black pieces; find it. */
function captureItem(id: string, piece: string): Item {
  return {
    id,
    generate: (seed) =>
      until(rng(seed), (r) => {
        const from = randomSquare(r, [], [2, 3, 4, 5, 6]);
        const pieces: Record<string, string> = { [from]: piece };
        for (let i = 0; i < 3; i++) pieces[randomSquare(r, Object.keys(pieces), [2, 3, 4, 5, 6, 7])] = r.pick(["p", "n", "b", "r", "q"]);
        const fen = fenFrom(pieces);
        const caps = legalMoves(fen, from).filter((m) => m.captured);
        if (caps.length !== 1) return null;
        const name = PIECE_NAMES[piece.toLowerCase()];
        return {
          kind: "move" as const,
          fen,
          prompt: `Your ${name} on ${from} can capture exactly one black piece. Capture it.`,
          goal: { type: "san" as const, moves: [caps[0].san] },
          explain: `Only the ${PIECE_NAMES[caps[0].captured!]} on ${caps[0].to} lies on a path the ${name} can travel.`,
        };
      }),
  };
}

function knightDistance(a: string, b: string): number {
  const jumps = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  const key = (f: number, r: number) => `${f},${r}`;
  const seen = new Set([key(fileIndex(a), rankOf(a))]);
  let frontier = [[fileIndex(a), rankOf(a)]];
  for (let d = 0; d < 8; d++) {
    if (frontier.some(([f, r]) => f === fileIndex(b) && r === rankOf(b))) return d;
    const next: number[][] = [];
    for (const [f, r] of frontier)
      for (const [df, dr] of jumps) {
        const nf = f + df, nr = r + dr;
        if (nf < 0 || nf > 7 || nr < 1 || nr > 8 || seen.has(key(nf, nr))) continue;
        seen.add(key(nf, nr));
        next.push([nf, nr]);
      }
    frontier = next;
  }
  return -1;
}

export const rook: LearningNode = {
  id: "chess.rook",
  course: C,
  title: "The rook",
  stage: 0,
  track: "rules",
  prereqs: ["chess.board"],
  related: ["chess.bishop"],
  summary: "The rook moves any number of squares along a file or a rank, cannot jump, and captures by landing on an enemy piece.",
  keyPoints: [
    "moves in straight lines along files and ranks",
    "as many squares as it likes",
    "cannot jump over pieces",
    "captures by moving onto an enemy piece's square",
  ],
  theory: [
    {
      text: "The rook moves in straight lines: up and down its **file**, or left and right along its **rank**, as many squares as it likes. Here are all its moves from d4.",
      fen: "8/8/8/8/3R4/8/8/8 w - - 0 1",
      showMoves: "d4",
    },
    {
      text: "On an empty board a rook always reaches exactly **14 squares**, wherever it stands: 7 along its file plus 7 along its rank. Corner or centre makes no difference, which is unusual among the pieces.",
      fen: "8/8/8/8/8/8/8/R7 w - - 0 1",
      showMoves: "a1",
    },
    {
      text: "A rook cannot jump. Your own pawn on b4 stops it, so b4 and a4 are out of reach. The black pawn on d6 can be **captured**: the rook lands on its square and the pawn leaves the board. Squares beyond it are blocked.",
      fen: "8/8/3p4/8/1P1R4/8/8/8 w - - 0 1",
      showMoves: "d4",
    },
    {
      text: "Your turn. Before you move, predict: which black piece can this rook capture, and why not the other?",
      fen: "3n4/8/3P4/8/3R2p1/8/8/8 w - - 0 1",
      tryIt: {
        kind: "move",
        fen: "3n4/8/3P4/8/3R2p1/8/8/8 w - - 0 1",
        prompt: "Capture the piece the rook can reach.",
        goal: { type: "san", moves: ["Rxg4"] },
        explain: "Your own pawn on d6 blocks the way to d8, but nothing stands between d4 and g4.",
      },
    },
  ],
  items: [reachItem("chess.rook.reach", "R"), captureItem("chess.rook.capture", "R")],
};

export const bishop: LearningNode = {
  id: "chess.bishop",
  course: C,
  title: "The bishop",
  stage: 0,
  track: "rules",
  prereqs: ["chess.board"],
  related: ["chess.rook"],
  summary: "The bishop moves any number of squares diagonally, cannot jump, and stays on squares of one colour for the whole game.",
  keyPoints: [
    "moves diagonally",
    "as many squares as it likes",
    "cannot jump over pieces",
    "always stays on the same colour of square",
  ],
  theory: [
    {
      text: "The bishop moves along **diagonals**, as many squares as it likes. Here are its moves from d4.",
      fen: "8/8/8/8/3B4/8/8/8 w - - 0 1",
      showMoves: "d4",
    },
    {
      text: "Look at the colours of the squares it can reach: all dark, like d4 itself. A diagonal step never changes colour, so this bishop will **never** stand on a light square. That is why each side has one light-squared and one dark-squared bishop.",
      fen: "8/8/8/8/3B4/8/8/8 w - - 0 1",
      showMoves: "d4",
    },
    {
      text: "Unlike the rook, the bishop's reach depends on where it stands: 13 squares in the centre, only 7 in a corner. Centralised bishops are stronger.",
      fen: "8/8/8/8/8/8/8/B7 w - - 0 1",
      showMoves: "a1",
    },
    {
      text: "Like the rook, it cannot jump, and it captures by landing on an enemy piece.",
      fen: "8/6p1/8/8/3B4/2P5/8/8 w - - 0 1",
      showMoves: "d4",
      tryIt: {
        kind: "choice",
        fen: "8/8/8/8/8/8/8/2B5 w - - 0 1",
        prompt: "Can the bishop on c1 ever reach h5?",
        options: ["Yes, in two moves", "No, h5 is a light square and c1 is dark"],
        answer: 1,
        explain: "c1 is dark and h5 is light. A bishop never changes colour.",
      },
    },
  ],
  items: [
    reachItem("chess.bishop.reach", "B"),
    captureItem("chess.bishop.capture", "B"),
    {
      id: "chess.bishop.colour",
      generate: (seed) => {
        const r = rng(seed);
        const from = randomSquare(r);
        const to = randomSquare(r, [from]);
        const same = isDark(from) === isDark(to);
        const c = choice(r, same ? "Yes" : "No", ["Yes", "No"]);
        return {
          kind: "choice",
          fen: fenFrom({ [from]: "B" }),
          prompt: `Could the bishop on ${from} ever reach ${to}, on an otherwise empty board?`,
          ...c,
          highlight: [to],
          explain: same
            ? `${from} and ${to} are both ${isDark(from) ? "dark" : "light"}, so yes.`
            : `${from} is ${isDark(from) ? "dark" : "light"} and ${to} is ${isDark(to) ? "dark" : "light"}. A bishop never changes colour.`,
        };
      },
    },
  ],
};

export const queen: LearningNode = {
  id: "chess.queen",
  course: C,
  title: "The queen",
  stage: 0,
  track: "rules",
  prereqs: ["chess.rook", "chess.bishop"],
  related: ["chess.values"],
  summary: "The queen moves like a rook and a bishop combined: any distance along files, ranks or diagonals, without jumping.",
  keyPoints: ["moves like a rook and a bishop combined", "files, ranks and diagonals", "any distance", "cannot jump"],
  theory: [
    {
      text: "You already know the queen. She moves like a **rook** (files and ranks) **and** like a **bishop** (diagonals), any distance. From d4 she reaches 27 squares on an empty board.",
      fen: "8/8/8/8/3Q4/8/8/8 w - - 0 1",
      showMoves: "d4",
    },
    {
      text: "She still cannot jump. Blockers cut her lines short, exactly as they would a rook or bishop.",
      fen: "8/1p6/8/3P4/3Q1n2/8/8/8 w - - 0 1",
      showMoves: "d4",
      tryIt: {
        kind: "squares",
        fen: "8/8/8/1p6/8/3Q4/8/8 w - - 0 1",
        prompt: "Select every square the queen can move to along the diagonal towards the black pawn.",
        targets: ["c4", "b5"],
        explain: "c4, then b5 where she captures. a6 lies beyond the pawn, so it is blocked.",
      },
    },
  ],
  items: [reachItem("chess.queen.reach", "Q"), captureItem("chess.queen.capture", "Q")],
};

export const knight: LearningNode = {
  id: "chess.knight",
  course: C,
  title: "The knight",
  stage: 0,
  track: "rules",
  prereqs: ["chess.board"],
  related: ["chess.bishop"],
  summary: "The knight moves in an L: two squares in one direction and one at right angles. It jumps over pieces and always lands on the opposite colour.",
  keyPoints: ["moves in an L shape: two then one at right angles", "jumps over pieces", "always changes square colour", "captures only on its landing square"],
  theory: [
    {
      text: "The knight moves in an **L**: two squares straight in one direction, then one square to the side. From d4 that gives eight landing squares.",
      fen: "8/8/8/8/3N4/8/8/8 w - - 0 1",
      showMoves: "d4",
    },
    {
      text: "It is the only piece that **jumps**. Pieces in between do not matter, only the landing square. Even surrounded, this knight can still move.",
      fen: "8/8/8/2ppp3/2pNp3/2ppp3/8/8 w - - 0 1",
      showMoves: "d4",
    },
    {
      text: "Every knight move changes the colour of its square: from dark d4 it lands only on light squares. Near the edge it loses moves, so a knight in a corner has just two. 'A knight on the rim is dim.'",
      fen: "8/8/8/8/8/8/8/N7 w - - 0 1",
      showMoves: "a1",
      tryIt: {
        kind: "squares",
        fen: "8/8/8/8/8/8/8/6N1 w - - 0 1",
        prompt: "Predict, then select: every square the knight on g1 can reach.",
        targets: ["e2", "f3", "h3"],
        explain: "Two up and one sideways gives f3 and h3; two sideways and one up gives e2.",
      },
    },
  ],
  items: [
    reachItem("chess.knight.reach", "N", { others: 4 }),
    captureItem("chess.knight.capture", "N"),
    {
      id: "chess.knight.distance",
      generate: (seed) =>
        until(rng(seed), (r) => {
          const a = randomSquare(r);
          const b = randomSquare(r, [a]);
          const d = knightDistance(a, b);
          if (d < 2 || d > 4) return null;
          const c = choice(r, String(d), ["1", "2", "3", "4", "5"].filter((x) => x !== String(d)).slice(0, 3));
          return {
            kind: "choice" as const,
            fen: fenFrom({ [a]: "N" }),
            highlight: [b],
            prompt: `What is the fewest number of moves the knight needs to go from ${a} to ${b}?`,
            ...c,
            explain: `${d} moves. Trace it on the board: each jump is two plus one.`,
          };
        }),
    },
  ],
};

export const king: LearningNode = {
  id: "chess.king",
  course: C,
  title: "The king",
  stage: 0,
  track: "rules",
  prereqs: ["chess.board"],
  related: ["chess.check"],
  summary: "The king moves one square in any direction and may never step onto a square an enemy piece attacks.",
  keyPoints: ["one square in any direction", "can capture an enemy piece next to it", "may never move onto an attacked square", "the game is about trapping the king"],
  theory: [
    {
      text: "The king is the most important piece and one of the slowest: **one square in any direction**.",
      fen: "8/8/8/8/3K4/8/8/8 w - - 0 1",
      showMoves: "d4",
    },
    {
      text: "One rule belongs to the king alone: it may **never** move onto a square an enemy piece attacks. The black rook on e8 attacks the whole e-file, so the king cannot step to e3, e4 or e5.",
      fen: "4r3/8/8/8/3K4/8/8/8 w - - 0 1",
      showMoves: "d4",
      arrows: [["e8", "e3"]],
    },
    {
      text: "Why so strict? Because the whole game is about the king: trap it and you win. We will meet this as checkmate soon.",
      fen: "4r3/8/8/8/3K4/8/8/8 w - - 0 1",
      tryIt: {
        kind: "squares",
        fen: "8/8/8/8/8/1b6/8/4K3 w - - 0 1",
        prompt: "The black bishop on b3 guards some squares. Select every square this king can safely move to.",
        targets: ["d2", "e2", "f1", "f2"],
        explain: "The bishop on b3 covers d1 (b3, c2, d1). d2, e2, f1 and f2 are safe.",
      },
    },
  ],
  items: [
    {
      id: "chess.king.reach",
      generate: (seed) =>
        until(rng(seed), (r) => {
          const from = randomSquare(r);
          const pieces: Record<string, string> = { [from]: "K" };
          pieces[randomSquare(r, [from])] = r.pick(["r", "b", "n", "q"]);
          if (r.next() < 0.5) pieces[randomSquare(r, Object.keys(pieces), [2, 3, 4, 5, 6, 7])] = "P";
          const fen = fenFrom(pieces);
          const targets = targetsFrom(fen, from);
          if (targets.length < 2) return null;
          // Must matter: at least one adjacent empty square is forbidden.
          const adjacent = legalMoves(fenFrom({ [from]: "K" }), from).length;
          if (adjacent === targets.length) return null;
          return {
            kind: "squares" as const,
            fen,
            prompt: `Select every square the king on ${from} can safely move to.`,
            targets,
            explain: "The king can never step onto a square an enemy piece attacks, and cannot land on its own piece.",
          };
        }),
    },
  ],
};

export const pawn: LearningNode = {
  id: "chess.pawn",
  course: C,
  title: "The pawn",
  stage: 0,
  track: "rules",
  prereqs: ["chess.board"],
  related: ["chess.promotion", "chess.en-passant"],
  summary: "A pawn moves one square straight forward (two from its starting square), captures one square diagonally forward, and never moves backwards.",
  keyPoints: [
    "moves straight forward one square",
    "may move two squares on its first move",
    "captures diagonally forward, one square",
    "cannot capture straight ahead and is blocked by any piece in front",
    "never moves backwards",
  ],
  theory: [
    {
      text: "Pawns only move **forward**, one square at a time. White pawns move up the board, black pawns down.",
      fen: "8/8/8/8/3P4/8/8/8 w - - 0 1",
      showMoves: "d4",
    },
    {
      text: "From its **starting square** (the 2nd rank for White) a pawn may move one **or two** squares.",
      fen: "8/8/8/8/8/8/4P3/8 w - - 0 1",
      showMoves: "e2",
    },
    {
      text: "Pawns **capture diagonally**, one square forward. This pawn can take on c5 or e5, but cannot move to d5: a pawn never captures straight ahead, and anything in front of it, friend or enemy, blocks it.",
      fen: "8/8/8/2nnb3/3P4/8/8/8 w - - 0 1",
      showMoves: "d4",
    },
    {
      text: "Predict before you play: this pawn is blocked. Can it still move?",
      fen: "8/8/8/4p3/4P3/8/8/8 w - - 0 1",
      tryIt: {
        kind: "move",
        fen: "8/8/8/3np3/4P3/8/8/8 w - - 0 1",
        prompt: "The pawn on e4 is blocked from moving forward. Find its one legal move.",
        goal: { type: "san", moves: ["exd5"] },
        explain: "It cannot go straight to e5, but it can capture the knight diagonally on d5.",
      },
    },
  ],
  items: [
    reachItem("chess.pawn.reach", "P", { others: 3, ranks: [2, 3, 4, 5, 6], enemyOnly: false }),
    captureItem("chess.pawn.capture", "P"),
  ],
};
