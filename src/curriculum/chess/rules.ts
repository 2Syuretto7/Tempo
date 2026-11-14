import { fenFrom, legalMoves, load, PIECE_NAMES, PIECE_VALUES, piecesOf } from "@/lib/chess";
import { bank, choice, randomSquare, rng, until } from "../gen";
import type { Exercise, LearningNode } from "../types";

const C = "chess";
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/* ----------------------------------------------------------------- values */

export const values: LearningNode = {
  id: "chess.values",
  course: C,
  title: "What the pieces are worth",
  stage: 0,
  track: "thinking",
  prereqs: ["chess.queen", "chess.knight", "chess.king", "chess.pawn"],
  related: ["chess.notation"],
  summary: "Pieces have rough values (pawn 1, knight 3, bishop 3, rook 5, queen 9) that tell you whether a capture or trade gains or loses material.",
  keyPoints: [
    "pawn 1, knight 3, bishop 3, rook 5, queen 9",
    "the king has no value because it can never be captured or traded",
    "values come from how much each piece can do",
    "use them to judge trades: what you win minus what you lose",
  ],
  theory: [
    {
      text: "Pieces are not equal. Players use a simple scale: **pawn 1, knight 3, bishop 3, rook 5, queen 9**. The king has no number: it can never be captured, and losing it is losing the game.",
      fen: START,
    },
    {
      text: "Why these numbers? They roughly measure **how much a piece can do**. You saw that a rook always reaches 14 squares, a central knight only 8 and a queen up to 27. More reach, more value.",
      fen: "8/8/8/8/3Q4/8/8/8 w - - 0 1",
      showMoves: "d4",
    },
    {
      text: "Use the scale to judge a **trade**. If your rook (5) takes a knight (3) and is then captured, you gave 5 to win 3: you are down 2. Always ask: what do I win, and what can I lose?",
      fen: "8/8/2p5/1n6/8/8/1R6/8 w - - 0 1",
      arrows: [["b2", "b5"]],
      tryIt: {
        kind: "choice",
        fen: "8/8/2p5/1n6/8/8/1R6/8 w - - 0 1",
        prompt: "If the rook takes the knight on b5, the pawn on c6 takes the rook. What is the result for White?",
        options: ["White gains 2", "Even", "White loses 2"],
        answer: 2,
        explain: "White wins a knight (3) but loses a rook (5): a loss of 2.",
      },
    },
  ],
  items: [
    {
      id: "chess.values.best-capture",
      generate: (seed) =>
        until(rng(seed), (r) => {
          const pieces: Record<string, string> = {};
          for (const p of [r.pick(["N", "B", "R", "Q"]), r.pick(["N", "B", "R"])]) pieces[randomSquare(r, Object.keys(pieces), [2, 3, 4, 5])] = p;
          for (const p of r.shuffle(["p", "n", "b", "r", "q"]).slice(0, 3)) pieces[randomSquare(r, Object.keys(pieces), [4, 5, 6, 7])] = p;
          const fen = fenFrom(pieces);
          const caps = legalMoves(fen).filter((m) => m.captured);
          if (caps.length < 2) return null;
          const best = Math.max(...caps.map((m) => PIECE_VALUES[m.captured!]));
          const winners = caps.filter((m) => PIECE_VALUES[m.captured!] === best);
          if (new Set(caps.map((m) => m.captured)).size < 2) return null;
          if (new Set(winners.map((m) => m.to)).size !== 1) return null;
          return {
            kind: "move" as const,
            fen,
            prompt: "Several captures are possible. Make the one that wins the most material.",
            goal: { type: "san" as const, moves: winners.map((m) => m.san) },
            explain: `The ${PIECE_NAMES[winners[0].captured!]} on ${winners[0].to} is worth ${best}, more than anything else you can take.`,
          };
        }),
    },
    {
      id: "chess.values.trade",
      generate: (seed) => {
        const r = rng(seed);
        const kinds = ["p", "n", "b", "r", "q"];
        const mine = r.pick(kinds.slice(1));
        const theirs = r.pick(kinds);
        const diff = PIECE_VALUES[theirs] - PIECE_VALUES[mine];
        const label = (d: number) => (d > 0 ? `You gain ${d}` : d < 0 ? `You lose ${-d}` : "Even");
        const wrong = [label(-diff), label(diff + 2), label(diff - 2), "Even"].filter((x) => x !== label(diff));
        return {
          kind: "choice",
          prompt: `Your ${PIECE_NAMES[mine]} captures a ${PIECE_NAMES[theirs]}, and then your ${PIECE_NAMES[mine]} is captured. What is the material result?`,
          ...choice(r, label(diff), [...new Set(wrong)].slice(0, 3)),
          explain: `You win ${PIECE_VALUES[theirs]} and lose ${PIECE_VALUES[mine]}.`,
        };
      },
    },
    {
      id: "chess.values.count",
      generate: (seed) =>
        until(rng(seed), (r) => {
          const pieces: Record<string, string> = { e1: "K", e8: "k" };
          const add = (p: string) => (pieces[randomSquare(r, Object.keys(pieces), [2, 3, 4, 5, 6, 7])] = p);
          for (let i = 0; i < 2 + r.int(3); i++) add(r.pick(["P", "N", "B", "R", "Q", "P"]));
          for (let i = 0; i < 2 + r.int(3); i++) add(r.pick(["p", "n", "b", "r", "q", "p"]));
          let w = 0, b = 0;
          for (const p of Object.values(pieces)) {
            const v = PIECE_VALUES[p.toLowerCase()];
            if (p === p.toUpperCase()) w += v;
            else b += v;
          }
          const d = w - b;
          if (d === 0 || Math.abs(d) > 9) return null;
          const label = (x: number) => (x > 0 ? `White is ahead by ${x}` : x < 0 ? `Black is ahead by ${-x}` : "Material is equal");
          return {
            kind: "choice" as const,
            fen: fenFrom(pieces),
            prompt: "Count the material. Who is ahead, and by how much?",
            ...choice(r, label(d), [label(-d), label(d + (d > 0 ? 1 : -1)), "Material is equal"]),
            explain: `White has ${w} points, Black has ${b}.`,
          };
        }),
    },
  ],
};

/* ------------------------------------------------------------------ check */

export const check: LearningNode = {
  id: "chess.check",
  course: C,
  title: "Check",
  stage: 0,
  track: "rules",
  prereqs: ["chess.king", "chess.queen", "chess.knight", "chess.pawn"],
  related: ["chess.checkmate"],
  summary: "A king that is attacked is in check, and its side must escape at once by moving the king, blocking the attack, or capturing the attacker.",
  keyPoints: [
    "check means the king is attacked",
    "you must get out of check immediately",
    "three ways out: move the king, block the line, capture the attacker",
    "you may never make a move that leaves your own king in check",
  ],
  theory: [
    {
      text: "When a piece attacks the king, the king is **in check**. Here the rook on e8 attacks the white king along the e-file.",
      fen: "4r3/8/8/8/8/8/8/4K3 w - - 0 1",
      arrows: [["e8", "e1"]],
      highlight: ["e1"],
    },
    {
      text: "Check must be answered **at once**. There are exactly three ways out. First, **move the king** to a safe square.",
      fen: "4r3/8/8/8/8/8/8/4K3 w - - 0 1",
      showMoves: "e1",
    },
    {
      text: "Second, **block**: put a piece between the attacker and the king. The bishop on d1 can step to e2 and shut the e-file.",
      fen: "4r3/8/8/8/8/8/8/3BK3 w - - 0 1",
      arrows: [["d1", "e2"]],
    },
    {
      text: "Third, **capture the attacker**. Here the queen on a8 can simply take the rook. Notice a knight's check can never be blocked: it jumps.",
      fen: "Q3r3/8/8/8/8/8/8/4K3 w - - 0 1",
      arrows: [["a8", "e8"]],
      tryIt: {
        kind: "move",
        fen: "4k3/8/8/8/8/8/3n4/R3K3 w - - 0 1",
        prompt: "The knight on d2 gives check. A knight check cannot be blocked. Get out of check by capturing the knight.",
        goal: { type: "san", moves: ["Kxd2"] },
        explain: "The king can take the knight on d2 because no black piece protects it.",
      },
    },
    {
      text: "One more rule: you may **never** make a move that leaves your own king in check. Here the bishop on e2 shields the king from the rook, so it may not move at all.",
      fen: "4r3/8/8/8/8/8/4B3/4K3 w - - 0 1",
    },
  ],
  items: [
    {
      id: "chess.check.is",
      generate: (seed) =>
        until(rng(seed), (r) => {
          const k = randomSquare(r, [], [1, 2, 3, 4, 5, 6]);
          const pieces: Record<string, string> = { [k]: "K" };
          pieces[randomSquare(r, [k], [2, 3, 4, 5, 6, 7])] = r.pick(["q", "r", "b", "n", "p"]);
          if (r.next() < 0.5) pieces[randomSquare(r, Object.keys(pieces), [2, 3, 4, 5, 6, 7])] = r.pick(["P", "N", "B"]);
          const fen = fenFrom(pieces);
          const inCheck = load(fen).inCheck();
          if (!inCheck && r.next() < 0.4) return null; // keep it balanced
          return {
            kind: "choice" as const,
            fen,
            prompt: "Is the white king in check?",
            ...choice(r, inCheck ? "Yes" : "No", ["Yes", "No"]),
            explain: inCheck ? "An enemy piece attacks the king's square." : "No black piece attacks the king's square.",
          };
        }),
    },
    {
      id: "chess.check.give",
      generate: (seed) =>
        until(rng(seed), (r) => {
          const bk = randomSquare(r, [], [5, 6, 7, 8]);
          const pieces: Record<string, string> = { [bk]: "k", a1: "K" };
          for (const p of [r.pick(["Q", "R", "B", "N"]), r.pick(["R", "B", "N", "P"])]) pieces[randomSquare(r, Object.keys(pieces), [2, 3, 4, 5, 6])] = p;
          const fen = fenFrom(pieces);
          if (load(fen.replace(" w ", " b ")).inCheck()) return null;
          const checks = legalMoves(fen).filter((m) => /[+#]/.test(m.san));
          if (checks.length < 1 || checks.length > 3) return null;
          return {
            kind: "move" as const,
            fen,
            prompt: "Give check to the black king.",
            goal: { type: "check" as const },
            explain: `There ${checks.length === 1 ? "was one checking move" : `were ${checks.length} checking moves`}: ${checks.map((m) => m.san).join(", ")}.`,
          };
        }),
    },
    bank("chess.check.ways", [
      {
        kind: "choice",
        fen: "4k3/8/8/8/8/5n2/8/4K3 w - - 0 1",
        prompt: "The knight on f3 checks the white king. Which way out is impossible here?",
        options: ["Moving the king", "Blocking the check", "Both are possible"],
        answer: 1,
        explain: "A knight jumps, so there is nothing to block. Only moving the king or capturing the knight can work.",
      },
      {
        kind: "choice",
        fen: "4k3/8/8/8/8/8/8/r3K2R w - - 0 1",
        prompt: "The rook on a1 checks White along the first rank. Which of these is a legal way out?",
        options: ["Ke2, moving the king off the rank", "Rf1, the rook stays behind", "Castling"],
        answer: 0,
        explain: "Ke2 leaves the attacked rank. Rf1 does not block (it is on the far side of the king) and castling out of check is never allowed.",
      },
    ]),
  ],
};

/* -------------------------------------------------------------- checkmate */

const MATE_IN_ONE: Exercise[] = [
  { kind: "move", fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1", prompt: "White to move. Checkmate in one.", goal: { type: "mate" }, explain: "Ra8 checks along the back rank, and Black's own pawns take away every escape square." },
  { kind: "move", fen: "k7/8/1K6/8/8/8/8/7Q w - - 0 1", prompt: "White to move. Checkmate in one.", goal: { type: "mate" }, explain: "Qb7, sliding along the long diagonal and protected by the king, covers every square around the black king." },
  { kind: "move", fen: "7k/R7/8/8/8/8/8/1R4K1 w - - 0 1", prompt: "White to move. Checkmate in one.", goal: { type: "mate" }, explain: "Rb8: one rook guards the 7th rank, the other checks on the 8th. This is the rook ladder." },
  { kind: "move", fen: "6k1/8/6K1/8/8/8/8/3Q4 w - - 0 1", prompt: "White to move. Checkmate in one.", goal: { type: "mate" }, explain: "Qd8 checks along the back rank; the white king covers f7, g7 and h7." },
  { kind: "move", fen: "6k1/5p1p/6pB/8/8/8/8/3Q2K1 w - - 0 1", prompt: "White to move. Checkmate in one.", goal: { type: "mate" }, explain: "Qd8: the bishop on h6 covers g7, and Black's pawns block the rest." },
  { kind: "move", fen: "6rk/6pp/7N/8/8/8/8/6K1 w - - 0 1", prompt: "White to move. Checkmate in one.", goal: { type: "mate" }, explain: "Nf7 is a smothered mate: the king is boxed in by its own pieces, and a knight's check cannot be blocked." },
  { kind: "move", fen: "k7/7R/8/8/8/8/8/K5R1 w - - 0 1", prompt: "White to move. Checkmate in one.", goal: { type: "mate" }, explain: "Rg8: the rook on h7 guards the 7th rank while the other checks on the 8th." },
];

const POSITIONS_TO_CLASSIFY = [
  "R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1",
  "R5k1/5pp1/8/8/8/8/8/6K1 b - - 0 1",
  "6k1/5ppp/8/8/8/8/8/R5K1 b - - 0 1",
  "k7/1Q6/1K6/8/8/8/8/8 b - - 0 1",
  "k7/1Q6/8/8/8/8/8/6K1 b - - 0 1",
  "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",
  "6rk/5Npp/8/8/8/8/8/6K1 b - - 0 1",
  "k7/8/1K6/8/8/8/8/2Q5 b - - 0 1",
];

function classify(fen: string) {
  const g = load(fen);
  if (g.isCheckmate()) return "Checkmate";
  if (g.isStalemate()) return "Stalemate";
  if (g.inCheck()) return "Check, but not checkmate";
  return "Neither";
}

export const checkmate: LearningNode = {
  id: "chess.checkmate",
  course: C,
  title: "Checkmate",
  stage: 0,
  track: "mates",
  prereqs: ["chess.check"],
  related: ["chess.stalemate"],
  summary: "Checkmate is a check with no way out (no safe king move, no block, no capture), and it ends the game immediately.",
  keyPoints: [
    "checkmate is check with no legal escape",
    "test all three escapes: move, block, capture",
    "checkmate wins the game immediately",
    "the king is never actually captured",
  ],
  theory: [
    {
      text: "**Checkmate** is check with no way out: the king cannot move to safety, the check cannot be blocked, and the attacker cannot be captured. The game ends at once; the king is never actually taken.",
      fen: "R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1",
      arrows: [["a8", "g8"]],
    },
    {
      text: "Test it like a scientist, one escape at a time. **Move?** f8 and h8 are on the rook's rank, f7, g7, h7 hold Black's own pawns. **Block?** Nothing can reach b8 to f8. **Capture?** Nothing attacks a8. All three fail: checkmate. This pattern, a king trapped by its own pawns, is the **back-rank mate**.",
      fen: "R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1",
      highlight: ["f8", "h8", "f7", "g7", "h7"],
    },
    {
      text: "Now remove one pawn. The king escapes to h7, so it is only check. A single escape square is the whole difference.",
      fen: "R5k1/5pp1/8/8/8/8/8/6K1 b - - 0 1",
      highlight: ["h7"],
      tryIt: MATE_IN_ONE[0],
    },
  ],
  items: [
    bank("chess.checkmate.in-one", MATE_IN_ONE),
    {
      id: "chess.checkmate.classify",
      generate: (seed) => {
        const r = rng(seed);
        const list = POSITIONS_TO_CLASSIFY.filter((f) => classify(f) !== "Stalemate");
        const fen = list[Math.abs(seed) % list.length];
        const ans = classify(fen);
        return {
          kind: "choice",
          fen,
          prompt: "Black to move. What is the black king's situation?",
          ...choice(r, ans, ["Checkmate", "Check, but not checkmate", "Neither"]),
          explain: "Test the three escapes in turn: move, block, capture.",
        };
      },
    },
  ],
};

/* -------------------------------------------------------------- stalemate */

export const stalemate: LearningNode = {
  id: "chess.stalemate",
  course: C,
  title: "Stalemate",
  stage: 0,
  track: "rules",
  prereqs: ["chess.checkmate"],
  related: ["chess.draws"],
  summary: "Stalemate is when the side to move is not in check but has no legal move; the game is a draw, which can rescue the losing side.",
  keyPoints: [
    "the side to move is not in check",
    "it has no legal move at all",
    "the result is a draw, not a win",
    "when winning, always leave the enemy king a move unless you are giving mate",
  ],
  theory: [
    {
      text: "Black to move. The king is **not in check**, but every square around it is covered: g8 by the queen, g7 and h7 by queen and king. Black has no legal move. This is **stalemate**, and the game is a **draw**.",
      fen: "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",
      highlight: ["g8", "g7", "h7"],
    },
    {
      text: "Compare checkmate: there the king is in check **and** cannot escape. Stalemate: **no check**, and no move. White, a whole queen ahead, threw the win away.",
      fen: "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",
    },
    {
      text: "The lesson for the stronger side: when the enemy king is nearly trapped, make sure your move either **gives checkmate** or **leaves it a move**. Here, with White to move, find the mate and avoid the stalemate.",
      fen: "7k/8/6K1/8/8/8/8/5Q2 w - - 0 1",
      tryIt: {
        kind: "move",
        fen: "7k/8/6K1/8/8/8/8/5Q2 w - - 0 1",
        prompt: "White to move. Give checkmate, and do not stalemate.",
        goal: { type: "mate" },
        explain: "Qf8 is mate. Qf7 would be stalemate.",
      },
    },
  ],
  items: [
    bank("chess.stalemate.avoid", [
      { kind: "move", fen: "7k/8/6K1/8/8/8/8/5Q2 w - - 0 1", prompt: "White to move. Give checkmate without stalemating.", goal: { type: "mate" }, explain: "Qf8 is mate; Qf7 is the stalemate trap." },
      { kind: "move", fen: "k7/8/1K6/8/8/8/8/2Q5 w - - 0 1", prompt: "White to move. Give checkmate without stalemating.", goal: { type: "mate" }, explain: "Qc8 is mate. Qc7 would leave Black without a move: stalemate." },
    ]),
    {
      id: "chess.stalemate.classify",
      generate: (seed) => {
        const r = rng(seed);
        const fen = POSITIONS_TO_CLASSIFY[Math.abs(seed) % POSITIONS_TO_CLASSIFY.length];
        const ans = classify(fen);
        return {
          kind: "choice",
          fen,
          prompt: "Black to move. Which is it?",
          ...choice(r, ans, ["Checkmate", "Stalemate", "Check, but not checkmate", "Neither"]),
          explain: "First ask: is the king in check? Then ask: does Black have any legal move?",
        };
      },
    },
  ],
};

/* --------------------------------------------------------------- castling */

const CASTLE_CASES: { fen: string; prompt: string; explain: string }[] = [
  { fen: "4k3/8/8/8/8/8/8/4K2R w K - 0 1", prompt: "Neither the king nor the rook has moved. Can White castle on the king's side?", explain: "Yes: the squares between are empty and nothing attacks e1, f1 or g1." },
  { fen: "4k3/8/8/8/8/8/8/4K2R w - - 0 1", prompt: "Earlier in the game the white king stepped to e2 and back to e1. Can White castle?", explain: "No. Once the king has moved, castling is gone for the rest of the game." },
  { fen: "4k3/8/8/8/8/8/8/4K1NR w K - 0 1", prompt: "Can White castle on the king's side right now?", explain: "No. The knight on g1 is in the way; the squares between king and rook must be empty." },
  { fen: "4k3/8/8/8/1b6/8/8/4K2R w K - 0 1", prompt: "Can White castle on the king's side right now?", explain: "No. The bishop on b4 gives check, and you may not castle out of check." },
  { fen: "4k3/8/8/8/2b5/8/8/4K2R w K - 0 1", prompt: "Can White castle on the king's side right now?", explain: "No. The bishop on c4 attacks f1, and the king may not pass through an attacked square." },
  { fen: "1r2k3/8/8/8/8/8/8/R3K3 w Q - 0 1", prompt: "The black rook attacks b1. Can White castle on the queen's side?", explain: "Yes. The king only crosses d1 and lands on c1. Only the rook passes b1, and that is allowed." },
];

export const castling: LearningNode = {
  id: "chess.castling",
  course: C,
  title: "Castling",
  stage: 0,
  track: "rules",
  prereqs: ["chess.king", "chess.rook", "chess.check"],
  related: ["chess.setup"],
  summary: "Castling moves the king two squares towards a rook and puts that rook on the square the king crossed, allowed only if neither has moved, the path is clear, and the king is not in, through or into check.",
  keyPoints: [
    "the king moves two squares towards the rook; the rook jumps to the other side of the king",
    "neither the king nor that rook may have moved before",
    "all squares between them must be empty",
    "the king may not be in check, pass through an attacked square, or land in check",
    "its purpose is king safety and bringing the rook into play",
  ],
  theory: [
    {
      text: "**Castling** is the only move where two pieces move at once. The king steps **two squares** towards a rook, and the rook hops over to the square the king crossed.",
      fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
      arrows: [["e1", "g1"], ["h1", "f1"]],
    },
    {
      text: "King's side castling (written **O-O**) puts the king on g1. Queen's side castling (**O-O-O**) puts it on c1 with the rook on d1. Why castle? It tucks the king away behind pawns and brings a rook towards the centre, two jobs in one move.",
      fen: "r3k2r/8/8/8/8/8/8/2KR3R w kq - 0 1",
    },
    {
      text: "Four conditions, all required: neither the king nor that rook has moved; the squares between them are empty; the king is **not in check**; and the king does not **pass through or land on** an attacked square. Here the bishop on c4 guards f1, so White cannot castle short.",
      fen: "4k3/8/8/8/2b5/8/8/4K2R w K - 0 1",
      highlight: ["f1"],
      arrows: [["c4", "f1"]],
    },
    {
      text: "To castle on Tempo, move the king two squares towards the rook. Try it.",
      fen: "4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1",
      tryIt: {
        kind: "move",
        fen: "4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1",
        prompt: "Castle on the queen's side.",
        goal: { type: "san", moves: ["O-O-O"] },
        explain: "The king goes to c1 and the rook from a1 lands on d1.",
      },
    },
  ],
  items: [
    {
      id: "chess.castling.can",
      generate: (seed) => {
        const r = rng(seed);
        const c = CASTLE_CASES[Math.abs(seed) % CASTLE_CASES.length];
        const sans = legalMoves(c.fen).map((m) => m.san.replace(/[+#]/, ""));
        const can = c.prompt.includes("queen's side") ? sans.includes("O-O-O") : sans.includes("O-O");
        return { kind: "choice", fen: c.fen, prompt: c.prompt, ...choice(r, can ? "Yes" : "No", ["Yes", "No"]), explain: c.explain };
      },
    },
    bank("chess.castling.do", [
      { kind: "move", fen: "r3k2r/pppq1ppp/2npbn2/2b1p3/2B1P3/2NP1N2/PPPBQPPP/R3K2R w KQkq - 0 1", prompt: "Castle on the king's side.", goal: { type: "san", moves: ["O-O"] }, explain: "King to g1, rook to f1." },
      { kind: "move", fen: "r3k2r/pppq1ppp/2npbn2/2b1p3/2B1P3/2NP1N2/PPPBQPPP/R3K2R w KQkq - 0 1", prompt: "Castle on the queen's side.", goal: { type: "san", moves: ["O-O-O"] }, explain: "King to c1, rook to d1." },
    ]),
  ],
};

/* -------------------------------------------------------------- promotion */

export const promotion: LearningNode = {
  id: "chess.promotion",
  course: C,
  title: "Promotion",
  stage: 0,
  track: "rules",
  prereqs: ["chess.pawn", "chess.queen"],
  related: ["chess.values"],
  summary: "A pawn that reaches the last rank must be exchanged for a queen, rook, bishop or knight of its own colour, almost always a queen.",
  keyPoints: [
    "a pawn reaching the far rank must promote",
    "it becomes a queen, rook, bishop or knight (never a king or a pawn)",
    "you may have more than one queen",
    "choose a queen unless another piece is better (for example to avoid stalemate)",
  ],
  theory: [
    {
      text: "A pawn that reaches the far end of the board **must promote**: it is replaced by a queen, rook, bishop or knight of its own colour. Not a king, and it cannot stay a pawn.",
      fen: "8/4P3/8/8/8/8/k7/4K3 w - - 0 1",
      arrows: [["e7", "e8"]],
    },
    {
      text: "Almost always you choose a **queen**, the strongest piece, even if you still have your first queen. A humble pawn worth 1 becomes a piece worth 9. That is why pawns close to promoting are so dangerous.",
      fen: "4Q3/8/8/8/8/8/k7/4K3 w - - 0 1",
    },
    {
      text: "Sometimes a different piece is better. A knight checks in a way a queen cannot, and a rook avoids a stalemate the queen would cause. Tempo asks you to choose each time.",
      fen: "k7/7P/1K6/8/8/8/8/8 w - - 0 1",
      tryIt: {
        kind: "move",
        fen: "k7/7P/1K6/8/8/8/8/8 w - - 0 1",
        prompt: "Promote the pawn and give checkmate.",
        goal: { type: "mate" },
        explain: "h8 with a queen or a rook checks along the 8th rank; the king covers a7 and b7.",
      },
    },
  ],
  items: [
    bank("chess.promotion.do", [
      { kind: "move", fen: "8/4P3/8/8/8/8/k7/4K3 w - - 0 1", prompt: "Promote the pawn to a queen.", goal: { type: "san", moves: ["e8=Q"] }, explain: "Push to e8 and choose the queen." },
      { kind: "move", fen: "k7/7P/1K6/8/8/8/8/8 w - - 0 1", prompt: "Promote and give checkmate.", goal: { type: "mate" }, explain: "A new queen or rook on h8 checks along the back rank." },
      { kind: "move", fen: "8/8/8/8/8/K7/1p6/k7 b - - 0 1", prompt: "You are Black. Promote the pawn to a queen.", goal: { type: "san", moves: ["b1=Q"] }, explain: "Black pawns promote on the 1st rank.", orientation: "black" },
    ]),
    bank("chess.promotion.rules", [
      { kind: "choice", prompt: "Which piece can a pawn NOT promote to?", options: ["Knight", "Rook", "King", "Bishop"], answer: 2, explain: "A pawn may become a queen, rook, bishop or knight. Never a king." },
      { kind: "choice", prompt: "White still has the original queen. Can a white pawn promote to a second queen?", options: ["Yes", "No"], answer: 0, explain: "Yes. There is no limit on the number of queens." },
    ]),
  ],
};

/* ------------------------------------------------------------- en passant */

export const enPassant: LearningNode = {
  id: "chess.en-passant",
  course: C,
  title: "En passant",
  stage: 0,
  track: "rules",
  prereqs: ["chess.pawn"],
  related: ["chess.promotion"],
  summary: "If an enemy pawn steps two squares and lands beside your pawn, your pawn may capture it as if it had moved only one, but only on the very next move.",
  keyPoints: [
    "only pawns capture en passant, and only pawns can be captured that way",
    "the enemy pawn must have just moved two squares from its starting square",
    "it must land right beside your pawn",
    "you capture diagonally onto the square it skipped",
    "the chance lasts only for the very next move",
  ],
  theory: [
    {
      text: "Your pawn stands on e5. Black's pawn starts on d7. If Black could only move one square, to d6, your pawn could capture it.",
      fen: "4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1",
      arrows: [["e5", "d6"]],
    },
    {
      text: "Black instead jumps two squares, to d5, slipping past. The **en passant** rule ('in passing') says your pawn may capture it **as if it had moved only one**: you move to d6 and the d5 pawn is removed.",
      fen: "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1",
      arrows: [["e5", "d6"]],
      highlight: ["d5"],
    },
    {
      text: "The chance lasts **one move only**. If you play something else, it is gone. The rule exists so the two-square first move cannot be used to dodge a pawn's capture.",
      fen: "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1",
      tryIt: {
        kind: "move",
        fen: "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1",
        prompt: "Black has just played d7 to d5. Capture en passant.",
        goal: { type: "san", moves: ["exd6"] },
        explain: "exd6: your pawn lands on d6 and the black pawn on d5 disappears.",
      },
    },
  ],
  items: [
    bank("chess.en-passant.do", [
      { kind: "move", fen: "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", prompt: "Black has just played d7 to d5. Capture en passant.", goal: { type: "san", moves: ["exd6"] }, explain: "exd6 removes the pawn on d5." },
      { kind: "move", fen: "4k3/8/8/5Pp1/8/8/8/4K3 w - g6 0 1", prompt: "Black has just played g7 to g5. Capture en passant.", goal: { type: "san", moves: ["fxg6"] }, explain: "fxg6 removes the pawn on g5." },
      { kind: "move", fen: "4k3/8/8/8/1pP5/8/8/4K3 b - c3 0 1", prompt: "You are Black. White has just played c2 to c4. Capture en passant.", goal: { type: "san", moves: ["bxc3"] }, explain: "bxc3 removes the pawn on c4.", orientation: "black" },
    ]),
    bank("chess.en-passant.when", [
      { kind: "choice", fen: "4k3/8/8/3pP3/8/8/8/4K3 w - - 0 1", prompt: "Black's pawn reached d5 by moving two squares, but that was two moves ago. Can White capture en passant now?", options: ["Yes", "No"], answer: 1, explain: "No. En passant is only possible on the very next move." },
      { kind: "choice", fen: "4k3/8/8/3pP3/8/8/8/4K3 w - - 0 1", prompt: "Black's pawn has just moved from d6 to d5, one square. Can White capture en passant?", options: ["Yes", "No"], answer: 1, explain: "No. En passant only applies after a two-square pawn move." },
      { kind: "choice", fen: "4k3/8/8/3nP3/8/8/8/4K3 w - - 0 1", prompt: "A black knight has just jumped to d5. Can the e5 pawn capture it en passant?", options: ["Yes", "No"], answer: 1, explain: "No. Only pawns can be captured en passant." },
    ]),
  ],
};

/* ------------------------------------------------------------------ draws */

const MATERIAL_CASES = [
  "8/8/4k3/8/8/2B5/8/4K3 w - - 0 1",
  "8/8/4k3/8/8/2N5/8/4K3 w - - 0 1",
  "8/8/4k3/8/8/2R5/8/4K3 w - - 0 1",
  "8/8/4k3/8/8/2Q5/8/4K3 w - - 0 1",
  "8/8/4k3/8/8/2P5/8/4K3 w - - 0 1",
  "8/8/4k3/8/8/8/8/4K3 w - - 0 1",
];

export const draws: LearningNode = {
  id: "chess.draws",
  course: C,
  title: "How games are drawn",
  stage: 0,
  track: "rules",
  prereqs: ["chess.stalemate"],
  related: ["chess.values"],
  summary: "A game is drawn by stalemate, by agreement, by insufficient material to mate, by the same position occurring three times, or after fifty moves each with no capture or pawn move.",
  keyPoints: [
    "stalemate",
    "agreement between the players",
    "insufficient material: neither side can possibly checkmate (for example king and bishop against king)",
    "threefold repetition of the same position",
    "the fifty-move rule: fifty moves each with no capture and no pawn move",
  ],
  theory: [
    {
      text: "Not every game has a winner. A **draw** is half a point each. You already know one way: **stalemate**. There are four more.",
      fen: "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",
    },
    {
      text: "**Insufficient material**: if neither side has enough pieces to ever force mate, the game is drawn. King and bishop, or king and knight, against a lone king cannot mate. A rook or queen can, and a pawn can promote.",
      fen: "8/8/4k3/8/8/2N5/8/4K3 w - - 0 1",
    },
    {
      text: "**Threefold repetition**: the same position, with the same player to move, appears three times. **Fifty-move rule**: fifty moves by each side with no capture and no pawn move. And players may simply **agree** to a draw.",
      fen: START,
      tryIt: {
        kind: "choice",
        fen: "8/8/4k3/8/8/2R5/8/4K3 w - - 0 1",
        prompt: "White has a king and a rook against a lone king. Is this a draw by insufficient material?",
        options: ["Yes", "No, a rook can force checkmate"],
        answer: 1,
        explain: "King and rook can force mate. You will learn how in Stage 1.",
      },
    },
  ],
  items: [
    {
      id: "chess.draws.material",
      generate: (seed) => {
        const r = rng(seed);
        const fen = MATERIAL_CASES[Math.abs(seed) % MATERIAL_CASES.length];
        const draw = load(fen).isInsufficientMaterial();
        return {
          kind: "choice",
          fen,
          prompt: "Is this position an immediate draw because neither side can possibly checkmate?",
          ...choice(r, draw ? "Yes" : "No", ["Yes", "No"]),
          explain: draw ? "A lone bishop or knight (or nothing) cannot force mate." : "A rook, a queen or a pawn that can promote is enough to play on.",
        };
      },
    },
    bank("chess.draws.kinds", [
      { kind: "choice", prompt: "Which of these is NOT a way a game can be drawn?", options: ["Stalemate", "Threefold repetition", "Running out of pieces to move except the king", "Fifty moves with no capture or pawn move"], answer: 2, explain: "A lone king can still move, so the game goes on, unless it has no legal move (stalemate)." },
      { kind: "choice", prompt: "The same position, with the same side to move, has now occurred three times. What happens?", options: ["The game is drawn", "The player who repeated loses", "Nothing"], answer: 0, explain: "Threefold repetition is a draw." },
    ]),
  ],
};

/* --------------------------------------------------------------- notation */

const NOTATION_POSITIONS = [
  START,
  "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
  "rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4",
  "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5",
];

export const notation: LearningNode = {
  id: "chess.notation",
  course: C,
  title: "Writing moves down",
  stage: 0,
  track: "rules",
  prereqs: ["chess.queen", "chess.knight", "chess.king", "chess.pawn"],
  related: ["chess.board"],
  summary: "Algebraic notation records a move as the piece letter (K, Q, R, B, N; none for pawns) plus the destination square, with x for a capture, + for check, # for mate and O-O / O-O-O for castling.",
  keyPoints: [
    "piece letters: K king, Q queen, R rook, B bishop, N knight; pawns have no letter",
    "the letter is followed by the square the piece moves to",
    "x means a capture; a pawn capture names the pawn's file (exd5)",
    "+ is check, # is checkmate, O-O and O-O-O are castling",
  ],
  theory: [
    {
      text: "Chess has a language for moves, so you can record games and read books. Each piece has a capital letter: **K** king, **Q** queen, **R** rook, **B** bishop, **N** knight (K is taken). **Pawns have no letter.**",
      fen: START,
    },
    {
      text: "A move is the **letter plus the square it goes to**. The knight from g1 to f3 is **Nf3**. A pawn moving to e4 is just **e4**.",
      fen: "rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1",
      arrows: [["g1", "f3"]],
    },
    {
      text: "Extra symbols: **x** for a capture (Bxc6), **+** for check, **#** for checkmate, **O-O** and **O-O-O** for castling. A pawn capture names the file it left: the pawn on e4 taking on d5 is **exd5**.",
      fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
      arrows: [["e4", "d5"]],
      tryIt: {
        kind: "move",
        fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
        prompt: "Play exd5.",
        goal: { type: "san", moves: ["exd5"] },
        explain: "The e-pawn captures on d5.",
      },
    },
    {
      text: "If two identical pieces could reach the same square, add the file (or rank) they come from: **Nbd2** means the knight from the b-file. You will meet this rarely, but now you will recognise it.",
      fen: "rnbqkb1r/pppppppp/5n2/8/8/5N2/PPPPPPPP/RNBQKB1R w KQkq - 2 2",
    },
  ],
  items: [
    {
      id: "chess.notation.read",
      generate: (seed) => {
        const r = rng(seed);
        const fen = NOTATION_POSITIONS[Math.abs(seed) % NOTATION_POSITIONS.length];
        const m = r.pick(legalMoves(fen));
        return { kind: "move", fen, prompt: `Play the move ${m.san}.`, goal: { type: "san", moves: [m.san] }, explain: `${m.san}: ${PIECE_NAMES[m.piece]} from ${m.from} to ${m.to}.` };
      },
    },
    {
      id: "chess.notation.write",
      generate: (seed) =>
        until(rng(seed), (r) => {
          const fen = r.pick(NOTATION_POSITIONS);
          const moves = r.shuffle(legalMoves(fen));
          if (moves.length < 4) return null;
          const m = moves[0];
          return {
            kind: "choice" as const,
            fen,
            arrows: [[m.from, m.to]] as [string, string][],
            prompt: "How is the move shown by the arrow written?",
            ...choice(r, m.san, moves.slice(1, 4).map((x) => x.san)),
            explain: `${m.san}.`,
          };
        }),
    },
    bank("chess.notation.symbols", [
      { kind: "choice", prompt: "What does Qxf7# mean?", options: ["Queen captures on f7, checkmate", "Queen moves to f7, check", "Queen captures on f7, check"], answer: 0, explain: "x is a capture and # is checkmate." },
      { kind: "choice", prompt: "Which move is castling on the queen's side?", options: ["O-O", "O-O-O", "Kc1"], answer: 1, explain: "Three O's for the longer side." },
      { kind: "choice", prompt: "A pawn on c4 captures a piece on d5. How is it written?", options: ["Pxd5", "cxd5", "c4d5"], answer: 1, explain: "Pawn captures name the file the pawn came from." },
    ]),
  ],
};

/* ------------------------------------------------------------------ setup */

const BACK = ["a", "b", "c", "d", "e", "f", "g", "h"];

export const setup: LearningNode = {
  id: "chess.setup",
  course: C,
  title: "The starting position and the goal",
  stage: 0,
  track: "rules",
  prereqs: ["chess.castling", "chess.promotion", "chess.en-passant", "chess.draws", "chess.notation", "chess.values"],
  related: ["chess.board"],
  summary: "Each side starts with rooks, knights, bishops, queen and king on the back rank and eight pawns in front, the queen on her own colour; White moves first and the aim is checkmate.",
  keyPoints: [
    "light square on the right",
    "rooks in the corners, then knights, then bishops",
    "the queen goes on her own colour (white queen d1, black queen d8)",
    "pawns fill the second rank",
    "White moves first and players alternate",
    "the aim is checkmate",
  ],
  theory: [
    {
      text: "You now know every piece and every rule. Here is where they all begin. Start with the board: **light on the right**.",
      fen: START,
    },
    {
      text: "Back rank, from the corners inwards: **rooks, knights, bishops**. Then the **queen on her own colour** (the white queen on light d1, the black queen on dark d8) and the king beside her. Eight pawns stand in front.",
      fen: START,
      highlight: ["d1", "d8"],
    },
    {
      text: "**White moves first**, then the players take turns, one move each. The aim is **checkmate**. Everything in the stages ahead (tactics, plans, endgames) serves that aim.",
      fen: START,
      tryIt: {
        kind: "choice",
        fen: START,
        prompt: "Where does the black queen start?",
        options: ["d8", "e8", "d1"],
        answer: 0,
        explain: "d8: a dark square, the queen's own colour.",
      },
    },
  ],
  items: [
    {
      id: "chess.setup.missing",
      generate: (seed) => {
        const r = rng(seed);
        const white = r.next() < 0.5;
        const sq = `${r.pick(BACK)}${white ? 1 : 8}`;
        const pieces = piecesOf(START);
        const p = pieces[sq];
        delete pieces[sq];
        return {
          kind: "squares",
          fen: fenFrom(pieces, "w", "-"),
          prompt: `One piece is missing from the starting position: a ${white ? "white" : "black"} ${PIECE_NAMES[p.toLowerCase()]}. Select the square where it belongs.`,
          targets: [sq],
          explain: `It belongs on ${sq}.`,
        };
      },
    },
    {
      id: "chess.setup.which",
      generate: (seed) => {
        const r = rng(seed);
        const sq = `${r.pick(BACK)}${r.pick([1, 8])}`;
        const p = piecesOf(START)[sq];
        const name = `${p === p.toUpperCase() ? "White" : "Black"} ${PIECE_NAMES[p.toLowerCase()]}`;
        const others = ["White rook", "White knight", "White bishop", "White queen", "White king", "Black rook", "Black knight", "Black bishop", "Black queen", "Black king"];
        return {
          kind: "choice",
          fen: "8/8/8/8/8/8/8/8 w - - 0 1",
          highlight: [sq],
          prompt: `Which piece starts on ${sq}?`,
          ...choice(r, name, r.shuffle(others.filter((o) => o !== name)).slice(0, 3)),
          explain: `${name}.`,
        };
      },
    },
  ],
};
